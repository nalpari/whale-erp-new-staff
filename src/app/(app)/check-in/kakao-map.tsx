"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LatLng = { latitude: number; longitude: number };

// 카카오 지도 JS SDK 에서 쓰는 만큼만 적는다
type KakaoLatLng = { getLat(): number; getLng(): number };
type KakaoMap = { setBounds(bounds: KakaoBounds, ...padding: number[]): void; setZoomable(zoomable: boolean): void };
type KakaoBounds = { extend(point: KakaoLatLng): void };
type KakaoMaps = {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number; draggable?: boolean; disableDoubleClickZoom?: boolean }) => KakaoMap;
  Circle: new (options: {
    center: KakaoLatLng;
    radius: number;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: "solid" | "dashed";
    fillColor: string;
    fillOpacity: number;
  }) => { setMap(map: KakaoMap): void; getBounds(): KakaoBounds };
  CustomOverlay: new (options: { position: KakaoLatLng; content: HTMLElement; xAnchor?: number; yAnchor?: number; zIndex?: number }) => { setMap(map: KakaoMap): void };
};
declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

// SDK 는 한 번만 불러온다. 실패하거나 10초 안에 끝나지 않으면(하위 스크립트가 막힌 경우 등) 다음에 다시 시도하도록 비운다
const SDK_TIMEOUT_MS = 10_000;
let sdk: Promise<KakaoMaps> | null = null;
function loadSdk(appKey: string): Promise<KakaoMaps> {
  sdk ??= new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      reject(new Error("kakao maps sdk 시간 초과"));
    }, SDK_TIMEOUT_MS);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) return reject(new Error("kakao maps sdk 없음"));
      maps.load(() => {
        clearTimeout(timer);
        resolve(maps);
      });
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error("kakao maps sdk 로드 실패"));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdk = null;
    throw error;
  });
  return sdk;
}

/**
 * 내 위치 — 퍼지는 고리 · 흰 테두리 점 · 「내 위치」 이름표. 반경 안은 반경 원과 같은 파랑, 밖은 주황이다(근무지 핀의 남보라와 헷갈리지 않게).
 * 이름표는 점 아래에 띄워 크기에 넣지 않는다 — 점 가운데가 내 좌표다(yAnchor 0.5).
 */
function myMarker(out: boolean) {
  const color = out ? "bg-[#f59e0b]" : "bg-[#315df5]";
  const marker = document.createElement("div");
  marker.className = "relative size-[22px]";
  const ring = document.createElement("span");
  ring.className = `absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:animate-none ${color}`;
  const point = document.createElement("span");
  point.className = `absolute inset-0 rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(25,48,101,0.35)] ${color}`;
  const label = document.createElement("span");
  label.className = `absolute top-full left-1/2 mt-[4px] -translate-x-1/2 rounded-full px-[8px] py-[2px] text-[11px] leading-[1.5] font-bold whitespace-nowrap text-white shadow-[0_2px_6px_rgba(25,48,101,0.25)] ${color}`;
  label.textContent = "내 위치";
  marker.append(ring, point, label);
  return marker;
}

/** 근무지 핀 — 앱 기본색 물방울에 흰 매장 아이콘. 끝이 근무지 좌표를 가리킨다(yAnchor 1) */
function storePin() {
  const pin = document.createElement("div");
  pin.className = "flex flex-col items-center drop-shadow-[0_4px_8px_rgba(25,48,101,0.28)]";
  const head = document.createElement("div");
  head.className = "flex size-[40px] items-center justify-center rounded-full border-[3px] border-white bg-staff-primary";
  const icon = document.createElement("span");
  icon.className = "size-[20px] -scale-y-100 bg-white [mask-image:url(/icons/store.svg)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]";
  head.appendChild(icon);
  const tail = document.createElement("div");
  tail.className = "-mt-[2px] size-0 border-x-[7px] border-t-[10px] border-x-transparent border-t-staff-primary";
  pin.append(head, tail);
  return pin;
}

/**
 * 출퇴근 화면의 실제 지도(카카오 지도). 근무지 핀 · 출근 가능 반경 원을 그리고, 읽은 내 위치(me)가 있으면 그 점도 그려 다 보이게 맞춘다.
 * 내 위치는 이 화면 안에서만 그린다 — 서버로 보내지 않는다(ATT-05). 카카오에서 내 주변 지도를 받아 오므로 대략적인 위치는 카카오에
 * 전달된다(위치정보 동의서에 적는다, 2026-10-28 재영). 키가 없거나 SDK 를 불러오지 못하면 fallback(그림이나 빈 지도 자리)을 보인다.
 * SDK 는 받았는데 타일만 실패하는 경우(사용량 초과 등)는 알려 주지 않아 감지하지 못한다 — 카카오 콘솔의 사용량 알림으로 본다.
 */
export function KakaoGeoMap({
  appKey,
  store,
  me,
  radiusMeters,
  caption,
  fallback,
}: {
  /** 카카오 지도 JavaScript 키(서버 env KAKAO_MAP_APP_KEY). 없으면 fallback 을 보인다 */
  appKey: string | null;
  store: LatLng;
  /** 읽은 내 위치와 반경 안 여부. 없으면 근무지만 그린다 */
  me?: LatLng & { inRange: boolean };
  radiusMeters: number;
  caption: string;
  fallback: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const out = me ? !me.inRange : false;
  const meLat = me?.latitude;
  const meLng = me?.longitude;

  useEffect(() => {
    if (!appKey) return;
    let cancelled = false;
    loadSdk(appKey)
      .then((maps) => {
        const el = container.current;
        if (cancelled || !el) return;
        el.replaceChildren();
        const storeAt = new maps.LatLng(store.latitude, store.longitude);
        // 보여 주기만 하는 지도다 — 끌거나 확대하지 않게 막아, 휴대전화에서 화면 스크롤을 가로채지 않는다
        const map = new maps.Map(el, { center: storeAt, level: 3, draggable: false, disableDoubleClickZoom: true });
        map.setZoomable(false);
        const circle = new maps.Circle({
          center: storeAt,
          radius: radiusMeters,
          strokeWeight: 1,
          strokeColor: out ? "#b6c1d5" : "#315df5",
          strokeOpacity: out ? 1 : 0.44,
          strokeStyle: "dashed",
          fillColor: out ? "#b6c1d5" : "#315df5",
          fillOpacity: out ? 0.12 : 0.07,
        });
        circle.setMap(map);
        new maps.CustomOverlay({
          position: storeAt,
          content: storePin(),
          yAnchor: 1,
          zIndex: 3,
        }).setMap(map);
        const bounds = circle.getBounds();
        if (meLat !== undefined && meLng !== undefined) {
          const meAt = new maps.LatLng(meLat, meLng);
          new maps.CustomOverlay({
            position: meAt,
            content: myMarker(out),
            yAnchor: 0.5,
            zIndex: 4,
          }).setMap(map);
          bounds.extend(meAt);
        }
        map.setBounds(bounds, 56, 40, 48, 40); // 위는 핀, 아래 · 옆은 「내 위치」 이름표만큼 더 띄운다
      })
      .catch((error: unknown) => {
        // SDK 로드 실패(키 · 등록 도메인 · 차단 · 시간 초과)와 그리기 실패를 함께 받는다 — 원인은 error 로 가린다
        console.error("[kakao-map] 지도를 그리지 못해 그림으로 대신합니다 — 키와 카카오 앱의 Web 도메인을 확인하세요", error);
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [appKey, store.latitude, store.longitude, meLat, meLng, radiusMeters, out]);

  if (!appKey || loadFailed) return fallback;
  const label = me ? (out ? "매장 반경 밖의 내 위치" : "매장 반경 안의 내 위치") : "근무지와 출근 가능 반경";
  // 안내 문구는 위에 둔다 — 아래 왼쪽은 카카오 로고 · 축척 자리라 가리면 안 된다
  return (
    <div role="img" aria-label={`${label}. ${caption}`} className="relative h-[205px] w-full shrink-0 overflow-clip rounded-[18px] border border-[#e1ebec] bg-[#eef3f7]">
      <div ref={container} className="absolute inset-0" />
      <p className="absolute top-[13px] left-[13px] z-10 rounded-[8px] border border-[#e4e8ef] bg-white/93 px-[10px] py-[6px] text-[12px] leading-[1.5] text-staff-text-sub">
        {caption}
      </p>
    </div>
  );
}
