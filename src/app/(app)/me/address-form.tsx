"use client";

import Script from "next/script";
import { useActionState, useEffect, useRef, useState } from "react";
import { Alert, BottomSheet, Button, Toast } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { ADDRESS_DETAIL_MAX } from "@/lib/profile";
import { saveAddressAction, type AddressSaveState } from "./actions";
import { ReadOnlyField } from "./read-only-field";

// 카카오(Daum) 우편번호 서비스(ME-2, 2026-10-20 결정). 키 없이 쓰는 공개 스크립트이고, 화면 안 시트에 embed 로 띄운다
// (휴대전화에서 popup 은 새 창이 떠 돌아오기 어렵다). https://postcode.map.daum.net/guide
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

const INITIAL: AddressSaveState = {};

/**
 * 연락처 카드의 주소 칸(데모 me 의 주소 · 주소 검색). 도로명 주소는 검색해서 고르고 상세 주소만 직접 적는다.
 * 저장이 실패해도 고른 주소 · 적은 상세 주소는 이 컴포넌트가 들고 있어 그대로 남는다.
 */
export function AddressForm({ zipCode, address, addressDetail }: { zipCode: string | null; address: string | null; addressDetail: string | null }) {
  const [state, formAction, pending] = useActionState(saveAddressAction, INITIAL);
  const [picked, setPicked] = useState({ zipCode: zipCode ?? "", address: address ?? "" });
  const [detail, setDetail] = useState(addressDetail ?? "");
  const [searching, setSearching] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  // next/script 는 받는 도중 화면을 떠났다 돌아오면 onReady 대신 onLoad 만 부르고, 한 번 실패한 뒤에는 onError 없이 onLoad ·
  // onReady 를 부른다. 그래서 두 콜백 모두에서 실제로 쓸 수 있는지(window.daum)로 가른다.
  const checkScript = () => (window.daum?.Postcode ? setScriptReady(true) : setScriptFailed(true));
  const frame = useRef<HTMLDivElement>(null);

  // 시트가 열리면 검색 칸을 새로 띄운다. 닫았다 다시 열면 지난 검색을 지우고 처음부터다.
  useEffect(() => {
    const element = frame.current;
    if (!searching || !scriptReady || !element || !window.daum) return;
    element.replaceChildren();
    new window.daum.Postcode({
      oncomplete: (data) => {
        setPicked({ zipCode: data.zonecode, address: data.roadAddress || data.autoRoadAddress });
        setSearching(false);
      },
      width: "100%",
      height: "100%",
    }).embed(element);
  }, [searching, scriptReady]);

  const shown = picked.address ? `(${picked.zipCode}) ${picked.address}` : "";
  // 바뀐 것이 없으면 저장을 막는다(api 는 같은 값이면 쓰지 않지만 「저장했습니다」가 뜨면 헷갈린다). 실패한 뒤의 「다시 하기」는 연다.
  const changed =
    picked.zipCode !== (zipCode ?? "") || picked.address !== (address ?? "") || detail.trim() !== (addressDetail ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-[8px]">
      <Script src={POSTCODE_SCRIPT} strategy="lazyOnload" onLoad={checkScript} onReady={checkScript} onError={() => setScriptFailed(true)} />
      <input type="hidden" name="zipCode" value={picked.zipCode} />
      <input type="hidden" name="address" value={picked.address} />
      <ReadOnlyField
        label="주소"
        value={shown}
        wrap
        action={
          <Button variant="outline" onClick={() => setSearching(true)}>
            검색
          </Button>
        }
      />
      <input
        name="addressDetail"
        aria-label="상세 주소"
        placeholder="상세 주소"
        autoComplete="address-line2"
        maxLength={ADDRESS_DETAIL_MAX}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        className={FIELD}
      />
      <p className="pt-[2px] text-[12px] text-staff-text-muted">
        도로명 주소는 검색해서 고르고 상세 주소만 직접 적습니다. 주소 변경은 다음 계약부터 반영됩니다.
      </p>
      {state.error && (
        <Alert tone="danger">
          <p>{state.error}</p>
        </Alert>
      )}
      <div className="pt-[4px]">
        {/* 실패하면 같은 값을 다시 보내는 「다시 하기」다. */}
        <Button type="submit" disabled={pending || !picked.address || (!changed && !state.error)}>
          {state.error ? "다시 하기" : "변경사항 저장"}
        </Button>
      </div>
      {state.savedAt && <Toast key={state.savedAt}>변경사항을 저장했습니다</Toast>}
      <BottomSheet open={searching} onClose={() => setSearching(false)} title="주소 검색" description="도로명이나 건물 이름으로 찾아 고릅니다.">
        <div ref={frame} className="h-[min(470px,55dvh)] w-full overflow-hidden rounded-[12px] border border-staff-border-light">
          {!scriptReady && (
            <p className="p-[14px] text-[13px] text-staff-text-muted">
              {scriptFailed ? "주소 검색을 불러오지 못했습니다. 연결을 확인하고 화면을 다시 열어 주세요" : "주소 검색을 불러오는 중입니다"}
            </p>
          )}
        </div>
      </BottomSheet>
    </form>
  );
}
