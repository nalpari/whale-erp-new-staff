"use client";

import Script from "next/script";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { BottomSheet } from "@/components/common";

// 카카오(Daum) 우편번호 서비스(ME-2, 2026-10-20 결정). 키 없이 쓰는 공개 스크립트이고, 화면 안 시트에 embed 로 띄운다
// (휴대전화에서 popup 은 새 창이 떠 돌아오기 어렵다). https://postcode.map.daum.net/guide
// integrity 를 걸 수 없는 바깥 스크립트라 시트를 처음 연 뒤에만 넣는다 — 화면을 열기만 해서는 받지 않는다.
// 내 정보의 주소(me/address-form.tsx)와 가입의 계정 등록(join/signup)이 같이 쓴다.
const POSTCODE_SCRIPT = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

/** 우편번호 서비스가 oncomplete 에 넘기는 값 중 쓰는 것. roadAddress 가 비면(지번을 고름 등) autoRoadAddress 가 대신한다. */
interface PostcodeResult {
  zonecode: string;
  roadAddress: string;
  autoRoadAddress: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void;
        width: string;
        height: string;
      }) => { embed: (element: HTMLElement) => void };
    };
  }
}

/** 고른 주소 — 우편번호 5자리와 도로명 주소. */
export interface PickedAddress {
  zipCode: string;
  address: string;
}

/** 주소 검색 시트. 고르면 onPick 을 부른다 — 시트를 닫는 것은 쓰는 쪽이 정한다(open). */
export function AddressSearchSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (picked: PickedAddress) => void }) {
  // 한 번 넣으면 시트를 닫아도 빼지 않는다(다시 열 때 또 받지 않게).
  const [scriptWanted, setScriptWanted] = useState(false);
  if (open && !scriptWanted) setScriptWanted(true);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  // next/script 는 받는 도중 화면을 떠났다 돌아오면 onReady 대신 onLoad 만 부르고, 한 번 실패한 뒤에는 onError 없이 onLoad ·
  // onReady 를 부른다. 그래서 두 콜백 모두에서 실제로 쓸 수 있는지(window.daum)로 가른다.
  const checkScript = () => (window.daum?.Postcode ? setScriptReady(true) : setScriptFailed(true));
  const frame = useRef<HTMLDivElement>(null);
  // 쓰는 쪽이 그릴 때마다 새 함수를 넘겨도 검색 칸을 다시 띄우지 않게 effect 밖에서 읽는다.
  const pick = useEffectEvent((data: PostcodeResult) => onPick({ zipCode: data.zonecode, address: data.roadAddress || data.autoRoadAddress }));

  // 시트가 열리면 검색 칸을 새로 띄운다. 닫았다 다시 열면 지난 검색을 지우고 처음부터다.
  useEffect(() => {
    const element = frame.current;
    if (!open || !scriptReady || !element || !window.daum) return;
    element.replaceChildren();
    new window.daum.Postcode({ oncomplete: (data) => pick(data), width: "100%", height: "100%" }).embed(element);
  }, [open, scriptReady]);

  return (
    <>
      {scriptWanted && (
        <Script src={POSTCODE_SCRIPT} strategy="afterInteractive" onLoad={checkScript} onReady={checkScript} onError={() => setScriptFailed(true)} />
      )}
      <BottomSheet open={open} onClose={onClose} title="주소 검색" description="도로명이나 건물 이름으로 찾아 고릅니다.">
        <div ref={frame} className="h-[min(470px,55dvh)] w-full overflow-hidden rounded-[12px] border border-staff-border-light">
          {!scriptReady && (
            <p className="p-[14px] text-[13px] text-staff-text-muted">
              {scriptFailed ? "주소 검색을 불러오지 못했습니다. 연결을 확인하고 화면을 다시 열어 주세요" : "주소 검색을 불러오는 중입니다"}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
