"use client";

import { useEffect, useRef } from "react";
import { MaskIcon } from "@/components/common";
import { EASE_OUT } from "@/components/common/theme";
import { HQ_SHARING_TERMS_VERSION, hqSharingSummary } from "@/lib/hq-sharing-terms";
import { HqSharingTermsButton } from "@/app/_components/hq-sharing-terms";

// 근무지 추가 확인의 사업자 제공 동의(가맹 점포, ATT-30) — 정돈 시안 제안 1(2026-11-20 사용자 지정). 테두리 둥근 카드 위 줄에
// 동그라미 체크 · 「근무정보 제공 동의 (선택)」 · 「내용 보기 ›」, 선 아래 옅은 바탕에 요약.
// 요약 글자는 동의 문구 버전(HQ_SHARING_TERMS_VERSION)과 묶여 그대로 둔다 — 시안의 꺾은선 네 줄로 나눈 문구는 버전을 올리고 api 와
// 함께 배포해야 해서 3팀 확인 뒤에 바꾼다. 폼 값은 공통 CheckBox 와 같이 숨은 칸으로 싣고 폼 초기화 때 실제 체크를 상태로 되돌린다.
export function ConsentCard({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(checked);
  useEffect(() => {
    latest.current = checked;
  }, [checked]);
  useEffect(() => {
    const element = input.current;
    const form = element?.form;
    if (!element || !form) return;
    const restore = () => queueMicrotask(() => (element.checked = latest.current));
    form.addEventListener("reset", restore);
    return () => form.removeEventListener("reset", restore);
  }, []);

  return (
    <div className="overflow-hidden rounded-[16px] border border-staff-border">
      <div className="flex min-h-[60px] items-center gap-[12px] py-[8px] pr-[12px] pl-[16px]">
        <label className="flex min-h-[44px] flex-1 items-center gap-[12px]">
          <input
            ref={input}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          {checked && <input type="hidden" name="hqSharingConsented" value="on" />}
          <span
            aria-hidden
            className={`flex size-[24px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${EASE_OUT} peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-staff-primary ${
              checked ? "bg-staff-primary text-white" : "border-[1.5px] border-[#c3cad6] text-transparent" // #c3cad6 — 꺾은선(SubLine)과 같은 회색
            }`}
          >
            <MaskIcon src="/icons/check.svg" size={12} />
          </span>
          <span className="text-[15px] font-semibold break-keep">
            근무정보 제공 동의 <span className="font-normal text-staff-text-muted">(선택)</span>
          </span>
        </label>
        <HqSharingTermsButton chevron />
      </div>
      {/* 이 화면이 보인 문구의 버전(ATT-30 v252) — 계정 등록의 동의 칸과 같다 */}
      <input type="hidden" name="hqSharingConsentVersion" value={HQ_SHARING_TERMS_VERSION} />
      {/* #f9fbfd — 상태 칩 neutral · 출퇴근 현황 예정 날과 같은 아주 옅은 바탕(토큰 없음) */}
      <p className="border-t border-staff-border-light bg-[#f9fbfd] px-[16px] pt-[12px] pb-[14px] text-[13px] leading-[1.55] break-keep text-staff-text-sub">
        {hqSharingSummary("affiliation")}
      </p>
    </div>
  );
}
