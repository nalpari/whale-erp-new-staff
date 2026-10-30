"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/common";
import { HQ_SHARING_TERMS } from "@/lib/hq-sharing-terms";

/**
 * 사업자(본사) 제공 동의 전문 — 받는 자 · 항목 · 목적 · 보유 기간 줄과 거부할 권리(선택 동의 · 철회해도 그대로) 안내(ATT-30 · ATT-8).
 * 내 정보 카드의 내용 시트와 가입 · 근무지 추가 · 소속 추가 수락의 「내용 보기」가 같은 글을 보인다 — 남기는 버전(HQ_SHARING_TERMS_VERSION)이
 * 실제로 본 문구여야 해서다(ATT-30 · ATT-8 v257, 2026-10-30 재영).
 */
export function HqSharingTermsBody() {
  return (
    <>
      <dl className="rounded-[12px] border border-staff-border-light bg-staff-info-bg px-[14px] py-[5px] text-[13px]">
        {HQ_SHARING_TERMS.map(([name, value]) => (
          <div key={name} className="flex gap-[12px] border-b border-staff-border-light py-[9px] last:border-b-0">
            <dt className="shrink-0 text-staff-text-sub">{name}</dt>
            <dd className="min-w-0 flex-1 text-right">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] text-staff-text-muted [&_strong]:font-bold [&_strong]:text-staff-text">
        선택 동의입니다. 철회해도 가입과 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. <strong>항목이나 목적이 넓어지면</strong> 새
        버전으로 다시 동의를 받습니다.
      </p>
    </>
  );
}

/** 법무 검토가 끝나기 전 문구라는 안내(ATT-8) — 카드 시트와 「내용 보기」 시트가 같이 쓴다. 검토가 끝나면 여기 하나만 지운다. */
export function HqSharingTermsReviewNote() {
  return <p className="text-[12px] text-staff-placeholder">동의 문구는 법무 검토 중(ATT-8)</p>;
}

/**
 * 동의 칸 요약 아래 「내용 보기」 — 누르면 전문 시트를 연다(가입 · 근무지 추가 · 소속 추가 수락, ATT-30 · ATT-8 v257). 동의는 체크 칸으로만
 * 받는다 — 시트는 보이기만 한다.
 */
export function HqSharingTermsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="사업자 제공 동의 내용 보기"
        // 빈칸을 음수 여백으로 당기면 44px 누르는 칸이 위 요약 글자를 덮어 요약을 눌러도 시트가 열린다 — 당기지 않는다
        className="flex min-h-[44px] items-center self-start text-[12px] font-semibold text-staff-text-sub underline underline-offset-2"
      >
        내용 보기
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="사업자 제공 동의">
        <HqSharingTermsBody />
        <HqSharingTermsReviewNote />
      </BottomSheet>
    </>
  );
}
