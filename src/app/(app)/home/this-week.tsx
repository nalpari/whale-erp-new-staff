"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { WeekSelector, type WeekDay } from "@/components/common";
import type { MyWorkSchedule } from "@/lib/work-schedules";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

// 데모 「이번 주 근무」 카드(Figma node 9:242). 오늘을 고른 칸으로 두고, 칸을 누르면 근무 탭의 그날로 간다.
export function ThisWeek({ week, today, items, children }: { week: string[]; today: string; items: MyWorkSchedule[]; children: ReactNode }) {
  const router = useRouter();
  const days: WeekDay[] = week.map((date, i) => {
    // 데모(/design/home) 모양 — 근무가 있는 날은 바탕색에 근무 수만큼 점, 없는 날은 흐리게(2026-10-23 재영). 시각은 근무 탭 그날 상세에서 본다.
    const workCount = items.filter((it) => it.workDate === date).length;
    return { key: date, weekday: WEEKDAYS[i], date: Number(date.slice(8, 10)), work: workCount > 0, workCount, muted: workCount === 0 };
  });
  return (
    <div className="flex flex-col gap-[13px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">
      <WeekSelector days={days} selected={today} onSelect={(date) => router.push(`/work?month=${date.slice(0, 7)}&day=${date}`)} />
      <p className="border-t border-staff-border-light pt-[12px] text-[12px] leading-[1.5] text-staff-text-sub">{children}</p>
    </div>
  );
}
