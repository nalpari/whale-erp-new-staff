"use client";

// 근무스케줄 월 달력(WORK-1 확정 · 월 달력). Figma 없음 — DESIGN.md 기준 초안.
// Figma 의 주간 날짜 줄(WeekSelector)을 한 달로 넓힌 모양이다 — 칸 radius 12, 근무일은 연한 남보라(#EEF2FF · #DCE4FF 테두리)에
// 셋째 줄 10px 남보라 근무 시간, 쉬는 날은 흰 바탕·흐린 글자, 오늘(고른 날)은 남보라 바탕·흰 글자·파란 그림자.
// 가짜 값: 2026년 9월. 화요일~금요일 09–18, 토요일 13–22, 월·일요일 휴무(목업 그대로). 오늘은 10일(목).
// 목업처럼 오늘 칸만 누를 수 있고, 누르면 onToday 를 부른다(목업 토스트 「9월 10일을 골랐습니다」).

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const TODAY = 10;

// 2026-09-01 은 화요일이라 월요일 시작 칸 번호(0=월)는 날짜 % 7 이다.
const timeOf = (date: number) => {
  const weekday = date % 7;
  if (weekday === 0 || weekday === 6) return null;
  return weekday === 5 ? "13–22" : "09–18";
};

type Cell = { key: string; date: number; outside?: boolean; time?: string | null };

const CELLS: Cell[] = [
  { key: "08-31", date: 31, outside: true },
  ...Array.from({ length: 30 }, (_, i) => ({ key: `09-${i + 1}`, date: i + 1, time: timeOf(i + 1) })),
  ...[1, 2, 3, 4].map((date) => ({ key: `10-${date}`, date, outside: true })),
];

export function MonthCalendar({ onToday }: { onToday: () => void }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="grid grid-cols-7 gap-[4px]" aria-hidden>
        {WEEKDAYS.map((w) => (
          <p key={w} className="text-center text-[12px] text-staff-text-muted">
            {w}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[4px]">
        {CELLS.map((cell) => {
          const today = !cell.outside && cell.date === TODAY;
          const tone = cell.outside
            ? "border-transparent text-staff-placeholder"
            : today
              ? "border-staff-primary bg-staff-primary text-white shadow-[0_5px_6px_rgba(49,93,245,0.16)]"
              : cell.time
                ? "border-[#dce4ff] bg-[#eef2ff] text-staff-text-sub"
                : "border-staff-border-light bg-white text-staff-placeholder";
          const body = (
            <>
              <span className="text-[14px] font-bold">{cell.date}</span>
              {cell.time && <span className={`text-[10px] ${today ? "" : "text-staff-primary"}`}>{cell.time}</span>}
            </>
          );
          const shell = `flex min-h-[52px] min-w-0 flex-col items-center gap-[2px] rounded-[12px] border pt-[6px] leading-[1.5] ${tone}`;
          return today ? (
            <button
              key={cell.key}
              type="button"
              aria-pressed
              aria-label={`9월 ${cell.date}일 오늘 ${cell.time ?? "휴무"}`}
              onClick={onToday}
              className={shell}
            >
              {body}
            </button>
          ) : (
            <div key={cell.key} aria-hidden={cell.outside || undefined} className={shell}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
