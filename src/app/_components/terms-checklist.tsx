"use client";

import { useState } from "react";
import { Alert, BottomSheet, CheckBox } from "@/components/common";
import type { StaffTermsItem } from "@/lib/my-profile";
import { dateLabel } from "@/lib/profile";
import { allTermsChecked, checkAllTerms, type StaffTermsKey, type TermsChecks } from "@/lib/staff-terms";
import { TermsContent } from "@/app/(app)/me/terms-content";

/**
 * 직원 앱 약관 동의 묶음(운영 정책 ACC-23, WHALEERP-774) — 「모두 동의합니다」와 약관마다 체크 칸 · [보기]. 가입 화면과 홈 약관 동의 팝업이
 * 같이 쓴다. 체크 칸 이름은 api 칸 이름(termsServiceAgreed · privacyAgreed · marketingAgreed)이라 가입 폼에 그대로 실린다. 「보기」는 지금
 * 시행 중인 약관 본문을 시트로 보인다. 시행 중인 마케팅 약관이 없으면(선택 약관, 운영자가 끔) 그 줄을 두지 않는다 — api 도 남기지 않는다.
 * 묶음에 data-field-anchor="terms" 와 숨은 칸을 둬, 필수를 빼고 제출하면 화면이 여기로 초점을 옮긴다(use-field-check).
 */
export function TermsChecklist({
  terms,
  checks,
  onChange,
  error,
}: {
  terms: StaffTermsItem[];
  checks: TermsChecks;
  onChange: (checks: TermsChecks) => void;
  error?: string;
}) {
  const [viewing, setViewing] = useState<StaffTermsKey>();
  // 마케팅은 선택 약관이라 시행 중인 것을 받았을 때만 줄을 둔다. 잠시 받지 못했을 때(unavailable)도 빼는데, 그러면 보인 버전이
  // null 로 가 api 가 409 TERMS_CHANGED 로 거절할 수 있다 — 화면을 다시 받아 그때 받은 약관으로 다시 그린다
  const shown = terms.filter((item) => item.required || item.current.status === "ok");
  const opened = shown.find((item) => item.key === viewing);
  const hidesMarketing = !shown.some((item) => item.key === "marketing");
  // 보이지 않는 마케팅 줄은 「모두 동의」에서도 뺀다
  const visibleChecks = hidesMarketing ? { ...checks, marketing: true } : checks;
  const toggleAll = (on: boolean) => onChange(hidesMarketing ? { ...checkAllTerms(on), marketing: false } : checkAllTerms(on));
  return (
    <div className="flex flex-col gap-[4px]" data-field-anchor="terms">
      <input type="hidden" name="terms" value="" />
      {/* 보인 약관 버전 — 가입 폼이 api 에 싣는다(다르면 409 TERMS_CHANGED). 못 받은 약관은 빈 값이다 */}
      {terms.map((item) => (
        <input key={item.key} type="hidden" name={`${item.key}Version`} value={item.current.status === "ok" ? item.current.terms.version : ""} />
      ))}
      <div className="border-b border-staff-border-light pb-[4px]">
        <CheckBox name="termsAll" checked={allTermsChecked(visibleChecks)} onChange={toggleAll}>
          모두 동의합니다
        </CheckBox>
      </div>
      {shown.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-[8px]">
          <CheckBox name={`${item.key}Agreed`} checked={checks[item.key]} onChange={(on) => onChange({ ...checks, [item.key]: on })}>
            {`[${item.required ? "필수" : "선택"}] ${item.label}`}
          </CheckBox>
          <button
            type="button"
            onClick={() => setViewing(item.key)}
            aria-haspopup="dialog"
            aria-label={`${item.label} 보기`}
            className="flex min-h-[44px] shrink-0 items-center px-[4px] text-[12px] font-semibold text-staff-text-sub underline underline-offset-2"
          >
            보기
          </button>
        </div>
      ))}
      {error && <p className="text-[12px] text-staff-error">{error}</p>}
      <BottomSheet open={opened !== undefined} onClose={() => setViewing(undefined)} title={opened?.label ?? "약관"}>
        {opened?.current.status === "ok" ? (
          <>
            <p className="-mt-[12px] text-[12px] text-staff-text-muted">
              {opened.current.terms.version} · {dateLabel(opened.current.terms.effectiveDate)}부터
            </p>
            <div className="max-h-[45dvh] overflow-y-auto rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
              <TermsContent markdown={opened.current.terms.content} />
            </div>
          </>
        ) : (
          <Alert tone="warning">
            <p>
              {opened?.current.status === "missing"
                ? "지금은 약관을 볼 수 없습니다. 근무지 관리자에게 문의해 주세요."
                : "약관을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요."}
            </p>
          </Alert>
        )}
      </BottomSheet>
    </div>
  );
}
