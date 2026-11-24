"use client";

import { useRef, useState, type ReactNode } from "react";
import { BottomSheet, Button, Card, MaskIcon } from "@/components/common";
import { EASE_OUT, FIELD } from "@/components/common/theme";
import { MAX_PERIOD_DAYS, addDays } from "@/lib/attendance-history";

// 기간별 조회 기간 — 시작일 · 종료일 두 칸(휴대폰 기본 날짜판 두 번) 대신 칸 하나를 눌러 달력 시트에서 시작일 → 종료일 순서로
// 누른다(2026-11-24 사용자 지정). 사이 날은 연보라 띠, 양 끝은 남보라 동그라미. [적용]을 누르면 바로 조회한다.
// 값은 숨은 칸(from · to)으로 GET 폼에 실어 보낸다 — 주소가 그대로 기간을 말한다(뒤로 가기 · 새로 고침에도 같은 기간).

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const dot = (day: string) => day.replaceAll("-", ".");
const monthOf = (day: string) => day.slice(0, 7);
const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000) + 1;
const label = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`;

/** 그 달 달력 칸 — 월요일 시작, 앞 · 뒤 빈칸은 null */
function monthCells(month: string): (string | null)[] {
  const first = `${month}-01`;
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = first; monthOf(d) === month; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

// 한 상자에 언제(조회 기간) → 얼마나(children, 총 근무 시간) 순서로 둔다(근무지는 화면 탭 위) — 상자 셋이 따로 떠 간격이 들쭉날쭉했다(2026-11-24 사용자 지정)
export function PeriodPicker({
  from,
  to,
  fromHome,
  today,
  children,
}: {
  from: string;
  to: string;
  fromHome: boolean;
  today: string;
  children: ReactNode;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [range, setRange] = useState({ from, to });
  const [open, setOpen] = useState(false);
  // 시트 안에서 고르는 중인 값 — [적용] 전에는 칸 값을 바꾸지 않는다
  const [draft, setDraft] = useState<{ start: string; end: string | null }>({ start: from, end: to });
  const [month, setMonth] = useState(monthOf(to));

  const handleOpen = () => {
    setDraft({ start: range.from, end: range.to });
    setMonth(monthOf(range.to));
    setOpen(true);
  };
  // 시작일 · 종료일이 다 있으면 새로 시작일, 시작일만 있으면 그 뒤 날은 종료일 · 앞 날은 새 시작일
  const handlePick = (day: string) =>
    setDraft((d) => (d.end !== null || day < d.start ? { start: day, end: null } : { start: d.start, end: day }));
  const tooLong = draft.end !== null && daysBetween(draft.start, draft.end) > MAX_PERIOD_DAYS;
  const handleApply = () => {
    if (draft.end === null || tooLong) return;
    setRange({ from: draft.start, to: draft.end });
    setOpen(false);
    // 숨은 칸이 새 값으로 그려진 뒤 보낸다
    requestAnimationFrame(() => form.current?.requestSubmit());
  };

  return (
    <Card>
      <form ref={form} action="/attendance">
        <input type="hidden" name="tab" value="period" />
        {fromHome && <input type="hidden" name="back" value="home" />}
        <input type="hidden" name="from" value={range.from} />
        <input type="hidden" name="to" value={range.to} />
        <p className="text-[13px] font-semibold text-staff-text-sub">조회 기간</p>
        <div className="relative pt-[8px]">
          <button type="button" aria-haspopup="dialog" onClick={handleOpen} className={`${FIELD} pr-[44px] text-left tabular-nums`}>
            {dot(range.from)} ~ {dot(range.to)}
          </button>
          <span aria-hidden className="pointer-events-none absolute top-[calc(50%+4px)] right-[14px] flex -translate-y-1/2 text-staff-text-sub">
            <MaskIcon src="/icons/calendar-line.svg" size={16} />
          </span>
        </div>
        <p className="pt-[8px] text-[12px] text-staff-text-muted [&_b]:font-bold">
          한 번에 <b>최대 1년</b>까지 조회할 수 있습니다.
        </p>
      </form>
      <div className="mt-[16px] border-t border-staff-border-light pt-[16px]">{children}</div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="조회 기간" closeLabel="취소">
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center justify-between">
            <button type="button" aria-label="이전 달" onClick={() => setMonth((m) => shiftMonth(m, -1))} className="flex size-[40px] items-center justify-center rounded-full text-staff-text-sub active:bg-staff-bg">
              <MaskIcon src="/icons/chevron-left-24.svg" size={20} />
            </button>
            <p className="text-[16px] font-bold">
              {month.slice(0, 4)}년 {Number(month.slice(5, 7))}월
            </p>
            <button type="button" aria-label="다음 달" onClick={() => setMonth((m) => shiftMonth(m, 1))} className="flex size-[40px] items-center justify-center rounded-full text-staff-text-sub active:bg-staff-bg">
              <MaskIcon src="/icons/chevron-right-24.svg" size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[12px] text-staff-text-sub">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-[4px]">
                {w}
              </span>
            ))}
          </div>
          <div role="grid" aria-label={`${month} 달력`} className="grid grid-cols-7 gap-y-[4px]">
            {monthCells(month).map((day, i) => {
              if (!day) return <span key={`e${i}`} />;
              const end = draft.end ?? draft.start;
              const isEdge = day === draft.start || day === draft.end;
              const inside = draft.end !== null && day > draft.start && day < draft.end;
              // 띠는 칸 전체, 양 끝은 반쪽만 이어 붙여 동그라미와 띠가 한 덩어리로 보이게
              const band =
                draft.end !== null && draft.start !== draft.end
                  ? inside
                    ? "bg-staff-primary-inactive"
                    : day === draft.start
                      ? "bg-[linear-gradient(to_right,transparent_50%,var(--color-staff-primary-inactive)_50%)]"
                      : day === end
                        ? "bg-[linear-gradient(to_left,transparent_50%,var(--color-staff-primary-inactive)_50%)]"
                        : ""
                  : "";
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isEdge || inside}
                  aria-label={label(day)}
                  onClick={() => handlePick(day)}
                  className={`flex h-[40px] items-center justify-center ${band}`}
                >
                  <span
                    className={`flex size-[36px] items-center justify-center rounded-full text-[14px] tabular-nums transition-colors duration-150 ${EASE_OUT} ${
                      isEdge ? "bg-staff-primary font-bold text-white" : day === today ? "font-bold text-staff-primary" : "text-staff-text"
                    }`}
                  >
                    {Number(day.slice(8, 10))}
                  </span>
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className={`text-center text-[14px] ${tooLong ? "text-staff-error" : "text-staff-text-sub"}`}>
            {draft.end === null
              ? `${label(draft.start)}부터 · 종료일을 선택해 주세요`
              : tooLong
                ? "한 번에 최대 1년까지 조회할 수 있습니다"
                : `${label(draft.start)} ~ ${label(draft.end)} · ${daysBetween(draft.start, draft.end)}일`}
          </p>
          <Button disabled={draft.end === null || tooLong} onClick={handleApply}>
            적용
          </Button>
        </div>
      </BottomSheet>
    </Card>
  );
}
