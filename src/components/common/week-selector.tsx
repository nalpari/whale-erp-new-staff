"use client";

import { EASE_OUT } from "./theme";

export type WeekDay = { key: string; weekday: string; date: number; hasSchedule?: boolean };

// Figma Weekly Day Selector: 7칸 격자(사이 4). 요일 11px(placeholder 색) 아래 36px 원에 날짜 14px bold.
// 근무가 있는 날은 날짜 아래 4px 브랜드 점, 고른 날은 원 전체가 브랜드 바탕·흰 글자(점은 숨긴다).
export function WeekSelector({
  days,
  selected,
  onSelect,
}: {
  days: WeekDay[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid w-full grid-cols-7 gap-[4px]">
      {days.map((day) => {
        const on = day.key === selected;
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={on}
            aria-label={`${day.weekday} ${day.date}일${day.hasSchedule ? ", 근무 있음" : ""}`}
            onClick={() => onSelect(day.key)}
            className="flex flex-col items-center gap-[8px]"
          >
            <span className="text-[11px] text-staff-placeholder">{day.weekday}</span>
            <span
              className={`flex size-[36px] flex-col items-center justify-center gap-[2px] rounded-full text-[14px] font-bold transition-colors duration-200 ${EASE_OUT} ${
                on ? "bg-staff-primary text-white" : "text-staff-text"
              }`}
            >
              {day.date}
              {day.hasSchedule && !on && <span className="size-[4px] rounded-full bg-staff-primary" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
