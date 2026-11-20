"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/common";
import { InfoIcon } from "./pay-frame";

const ABOUT: [string, string][] = [
  ["자동 계산 항목", "기본급 · 주휴수당 · 연장수당은 근로계약과 출퇴근 기록으로 계산되며, 관리자가 확인합니다."],
  ["관리자 입력 항목", "그 외 지급 항목과 공제 항목은 관리자가 직접 입력합니다."],
  ["실지급액 합계", "그 달에 받은 급여명세서의 실지급액을 합산한 금액입니다. 여러 근무지에서 받은 급여도 함께 합산됩니다."],
];

// 급여 머리줄 오른쪽 안내 버튼 + 「급여명세서 안내」 시트(데모 pay 의 about). 계산 주체와 맨 위 합계의 기준을 설명한다.
export function AboutSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="급여명세서 안내"
        className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center"
      >
        <InfoIcon />
      </button>
      {/* 정돈 시안 ⑳(2026-11-20 사용자 지정) — 번호 붙은 세 줄(무엇 → 설명)을 연회색 둥근 상자에, 입금 · 보관은 점 목록.
          기본급 · 주휴 · 연장은 api 가 근로계약 · 출퇴근 기록으로 계산한다(WHALEERP-227). 맨 위 금액은 합계 카드(PAY-9). 급여 입금은 이 시스템 밖이다. */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="급여명세서 안내">
        <ol className="overflow-hidden rounded-[16px] border border-staff-border bg-staff-bg">
          {ABOUT.map(([title, body], i) => (
            // 줄 사이 #e4e8ef — staff-bg 바탕 위에서 옅은 테두리는 보이지 않아 한 단계 진하게(신고 정보 상자와 같다)
            <li key={title} className="flex gap-[12px] border-t border-[#e4e8ef] px-[18px] py-[14px] first:border-t-0">
              <span aria-hidden className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-staff-primary-inactive text-[12px] font-bold text-staff-primary">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-[2px] break-keep">
                <span className="text-[15px] font-bold">{title}</span>
                <span className="text-[14px] text-staff-text-sub">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <ul className="flex flex-col gap-[4px] px-[4px] text-[13px] text-staff-text-sub">
          {["실제 급여 지급은 근무지에서 진행합니다.", "명세서는 만든 날부터 3년 동안 보관됩니다."].map((line) => (
            <li key={line} className="flex gap-[6px]">
              <span aria-hidden className="text-staff-placeholder">
                ·
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
