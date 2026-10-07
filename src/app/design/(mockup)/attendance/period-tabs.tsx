"use client";

import { useState } from "react";
import { PeriodNav, SegmentedControl } from "@/components/common";

// 「이번 주 / 이번 달」 탭과 기간 이동. 목업이라 탭만 바뀌고 아래 목록·기간은 그대로다(이번 달 화면은 아직 Figma 에 없다).
export function PeriodTabs() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  return (
    <>
      <SegmentedControl
        label="기간"
        value={period}
        onChange={setPeriod}
        items={[
          { value: "week", label: "이번 주" },
          { value: "month", label: "이번 달" },
        ]}
      />
      <PeriodNav label="9월 7일 – 13일" prevLabel="이전 주" nextLabel="다음 주" />
    </>
  );
}
