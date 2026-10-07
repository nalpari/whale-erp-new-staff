"use client";

import { EASE_OUT } from "./theme";

// work: 근무가 있는 날(아래 4px 점). note: 점 대신 셋째 줄에 쓰는 10px 글자(근무 시간 "09-18"·"휴무", 고르지 않은 날은 남보라).
// muted: 흰 바탕·흐린 글자로 낮춘 날(쉬는 날 등 — 어떤 날을 낮출지는 화면이 정한다).
export type WeekDay = { key: string; weekday: string; date: number; work?: boolean; muted?: boolean; note?: string };

// Figma 02.Main 「이번 주 근무」 날짜 줄(node 9:243): 7칸(사이 8), 칸마다 최소 높이 82 · radius 12 · #DCE4FF 테두리.
// 요일 12px · 날짜 16px bold · 근무 있는 날은 4px 점(사이 6).
//   고른 날 — 남보라 바탕 · 흰 글자 · 남보라 그림자
//   기본 — 연한 남보라 바탕(#EEF2FF) · 보조 글자
//   muted — 흰 바탕 · 흐린 글자
// 칸 색(#EEF2FF · #DCE4FF)은 이 줄에만 나와 토큰으로 두지 않는다.
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
    <div className="flex w-full gap-[8px]">
      {days.map((day) => {
        const on = day.key === selected;
        const tone = on
          ? "border-staff-primary bg-staff-primary text-white shadow-[0_5px_6px_rgba(49,93,245,0.16)]"
          : day.muted
            ? "border-[#dce4ff] bg-white text-staff-placeholder"
            : "border-[#dce4ff] bg-[#eef2ff] text-staff-text-sub";
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={on}
            aria-label={`${day.weekday} ${day.date}일 ${day.note ?? (day.work ? "근무" : "휴무")}`}
            onClick={() => onSelect(day.key)}
            className={`flex min-h-[82px] min-w-0 flex-1 flex-col items-center gap-[6px] rounded-[12px] border pt-[8px] pb-[16px] leading-[1.5] transition-[background-color,border-color,color,box-shadow] duration-200 ${EASE_OUT} ${tone}`}
          >
            <span className="text-[12px]">{day.weekday}</span>
            <span className="text-[16px] font-bold">{day.date}</span>
            {day.note ? (
              <span className={`text-[10px] ${on ? "" : "text-staff-primary"}`}>{day.note}</span>
            ) : (
              day.work && <span className="size-[4px] rounded-[2px] bg-current" />
            )}
          </button>
        );
      })}
    </div>
  );
}
