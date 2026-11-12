"use client";

import { useState } from "react";
import { BottomSheet, Notice } from "@/components/common";
import { InfoIcon } from "./pay-frame";

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
      {/* 첫 문단은 데모 문구다 — 기본급 · 주휴 · 연장은 api 가 근로계약 · 출퇴근 기록으로 계산한다(WHALEERP-227) */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="급여명세서는 이렇게 만들어집니다">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          <strong>기본급·주휴수당·연장수당</strong>은 근로계약과 출퇴근 기록으로 자동 계산되고, 관리자가 확인합니다.
          <br />
          <strong>그 외 지급 항목과 공제 항목</strong>은 관리자가 직접 입력합니다.
        </p>
        {/* 맨 위 합계 카드(PAY-9)가 무엇을 더한 값인지 */}
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          맨 위 금액은 <strong>그 달에 받은 급여명세서의 실지급액 합계</strong>입니다.
          <br />
          근무지가 여러 곳이면 모두 더해서 보여 드립니다.
        </p>
        {/* 급여 지급은 이 시스템 밖이라 「입금」은 근무지에서 한다는 이 안내에만 쓴다(데모 머리말과 같다). */}
        <Notice icon={<InfoIcon size={16} />}>
          실제 급여 입금은 근무지에서 진행합니다.
          <br />
          명세서는 만든 날부터 3년 동안 보관됩니다.
        </Notice>
      </BottomSheet>
    </>
  );
}
