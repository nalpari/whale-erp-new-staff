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
      <BottomSheet open={open} onClose={() => setOpen(false)} title="급여명세서는 이렇게 만들어집니다">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          <strong>기본급·주휴수당·연장수당</strong>은 근로계약과 출퇴근 기록으로 시스템이 계산하고 관리자가 확인합니다.{" "}
          <strong>나머지 지급 항목과 공제 항목은 관리자가 직접 넣습니다.</strong> 요율이 해마다 바뀌거나 사람이 판단할 값이기 때문입니다.
        </p>
        {/* 맨 위 합계 카드(PAY-9)가 무엇을 더한 값인지 */}
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          맨 위 금액은 <strong>그 달에 받은 급여명세서의 실지급액을 모두 더한 값</strong>입니다. 받은 날(발송일) 기준이고, 근무지가 여럿이면 함께 더합니다.
        </p>
        {/* 데모 문구는 「급여 지급(입금)은」이지만, 같은 데모 머리말이 이 화면에 「입금」을 쓰지 않는다고 정해 괄호를 뺐다. */}
        <Notice icon={<InfoIcon size={16} />}>급여 지급은 이 앱이 처리하지 않습니다. 명세서 데이터는 생성일로부터 3년간 보관됩니다.</Notice>
      </BottomSheet>
    </>
  );
}
