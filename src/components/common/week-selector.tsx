"use client";

import { EASE_OUT } from "./theme";

// work: 근무가 있는 날(아래 4px 점). note: 점 대신 셋째 줄에 쓰는 10px 글자(근무 시간 "09-18"·"휴무", 고르지 않은 날은 남보라).
// workCount: 그날 근무 수 — 점을 그만큼 가로로 찍는다(없으면 1, 2026-10-23 재영: 하루 두 번이면 점 둘).
// muted: 흰 바탕·흐린 글자로 낮춘 날(쉬는 날 등 — 어떤 날을 낮출지는 화면이 정한다).
export type WeekDay = { key: string; weekday: string; date: number; work?: boolean; workCount?: number; muted?: boolean; note?: string };

// 「이번 주 근무」 날짜 줄: 7칸(사이 8), 칸마다 radius 10 · 테두리 없음, 위아래 안쪽 10px 같게.
// 요일 12px · 날짜 16px bold · 근무 있는 날은 4px 점(사이 3).
//   고른 날 — 남색(staff-navy) 바탕 · 흰 글자, 그림자 없음
//   기본(근무 있는 날) — 옅은 회색(staff-bg) 바탕 · 보조 글자 — 출퇴근 기간 요약 칸과 같은 색
//   muted(쉬는 날) — 바탕 없이 흐린 글자
// 보라 바탕 · 테두리 · 그림자는 뺐다 — 직원 앱은 보라를 쓰지 않는다(2026-11-24 사용자 지정)
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
          ? "bg-staff-navy text-white"
          : day.muted
            ? "bg-white text-staff-placeholder"
            : "bg-staff-bg text-staff-text-sub";
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={on}
            aria-label={`${day.weekday} ${day.date}일 ${day.note ?? (day.work ? ((day.workCount ?? 1) > 1 ? `근무 ${day.workCount}건` : "근무") : "휴무")}`}
            onClick={() => onSelect(day.key)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-[4px] rounded-[10px] py-[10px] leading-[1.5] transition-[background-color,color] duration-200 ${EASE_OUT} ${tone}`}
          >
            <span className="text-[12px]">{day.weekday}</span>
            <span className="text-[16px] font-bold">{day.date}</span>
            {day.note ? (
              <span className="text-[10px]">{day.note}</span>
            ) : (
              day.work && (
                <span className="flex h-[6px] items-center gap-[3px]">
                  {Array.from({ length: day.workCount ?? 1 }, (_, i) => (
                    <span key={i} className="size-[4px] rounded-[2px] bg-current" />
                  ))}
                </span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
