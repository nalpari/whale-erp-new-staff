"use client";

import { useState } from "react";
import { WeekSelector, type WeekDay } from "@/components/common";

// 목업 데이터: 2026년 9월 둘째 주, 오늘은 10일(목).
const WEEK: WeekDay[] = [
  { key: "09-07", weekday: "월", date: 7 },
  { key: "09-08", weekday: "화", date: 8, work: true, muted: true },
  { key: "09-09", weekday: "수", date: 9, work: true },
  { key: "09-10", weekday: "목", date: 10, work: true },
  { key: "09-11", weekday: "금", date: 11, work: true },
  { key: "09-12", weekday: "토", date: 12, work: true },
  { key: "09-13", weekday: "일", date: 13, muted: true },
];

// Figma 「이번 주 근무」 카드(node 9:242): 흰 바탕 · radius 18 · 위 16 아래 12 좌우 12 · 날짜 줄과 요약 사이 13.
export function ThisWeek() {
  const [day, setDay] = useState("09-10");
  return (
    <div className="flex flex-col gap-[13px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">
      <WeekSelector days={WEEK} selected={day} onSelect={setDay} />
      <p className="border-t border-staff-border-light pt-[12px] text-[12px] leading-[1.5] text-staff-text-sub">
        이번 주 <b className="font-semibold">5일 · 40시간</b> 근무 예정
      </p>
    </div>
  );
}
