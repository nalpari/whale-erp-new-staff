"use client";

import { useRef, useState } from "react";
import { BottomSheet, Button, MaskIcon } from "@/components/common";
import { EASE_OUT, FIELD } from "@/components/common/theme";
import { MAX_PERIOD_DAYS, addDays, swipeStep } from "@/lib/attendance-history";

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

// 날짜 칸만 — 「조회 기간」 이름표 없이 맨 위에, 1년 안내는 달력 시트 안(2026-11-24 사용자 지정) — 상자 셋이 따로 떠 간격이 들쭉날쭉했다(2026-11-24 사용자 지정)
export function PeriodPicker({
  from,
  to,
  fromHome,
  today,
}: {
  from: string;
  to: string;
  fromHome: boolean;
  today: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const fromInput = useRef<HTMLInputElement>(null);
  const toInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // 시트 안에서 고르는 중인 값 — [적용] 전에는 칸 값을 바꾸지 않는다
  const [draft, setDraft] = useState<{ start: string; end: string | null }>({ start: from, end: to });
  const [month, setMonth] = useState(monthOf(to));
  // 손가락으로 달력을 좌우로 밀어 달을 넘긴다(2026-11-26 실기기 피드백). 시작 지점만 들고 있다가 손을 뗄 때 판단한다.
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const handleOpen = () => {
    setDraft({ start: from, end: to });
    setMonth(monthOf(to));
    setOpen(true);
  };
  // 시작일 · 종료일이 다 있으면 새로 시작일, 시작일만 있으면 그 뒤 날은 종료일 · 앞 날은 새 시작일
  const handlePick = (day: string) =>
    setDraft((d) => (d.end !== null || day < d.start ? { start: day, end: null } : { start: d.start, end: day }));
  const tooLong = draft.end !== null && daysBetween(draft.start, draft.end) > MAX_PERIOD_DAYS;
  const handleApply = () => {
    if (draft.end === null || tooLong) return;
    // 칸 글자는 받은 기간(props) 그대로 두고 보낼 값만 숨은 칸에 넣는다 — 상태로 먼저 바꾸면 뒤로 가기(bfcache)로 되살아난 화면에서 칸과 목록이 어긋났다
    if (fromInput.current && toInput.current) {
      fromInput.current.value = draft.start;
      toInput.current.value = draft.end;
    }
    setOpen(false);
    form.current?.requestSubmit();
  };

  return (
    <>
      <form ref={form} action="/attendance">
        <input type="hidden" name="tab" value="period" />
        {fromHome && <input type="hidden" name="back" value="home" />}
        <input ref={fromInput} type="hidden" name="from" defaultValue={from} />
        <input ref={toInput} type="hidden" name="to" defaultValue={to} />
        <div className="relative">
          <button type="button" aria-haspopup="dialog" aria-label={`조회 기간 ${dot(from)} ~ ${dot(to)}`} onClick={handleOpen} className={`${FIELD} pr-[44px] text-left tabular-nums`}>
            {dot(from)} ~ {dot(to)}
          </button>
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-[14px] flex -translate-y-1/2 text-staff-text-sub">
            <MaskIcon src="/icons/calendar-line.svg" size={16} />
          </span>
        </div>
      </form>
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
          {/* 화살표 키 이동이 없어 grid 대신 group — 날짜마다 버튼이다(리뷰) */}
          {/* 좌우로 밀면 달을 넘긴다 — 왼쪽으로 밀면 다음 달, 오른쪽이면 이전 달. 세로 움직임이 더 크면(시트 스크롤) 넘기지 않는다.
              pan-y 로 가로 움직임은 브라우저가 쓰지 않게 해 손가락을 따라 화면이 흔들리지 않게 한다. 버튼(화살표)은 그대로 둔다 */}
          <div
            role="group"
            aria-label={`${Number(month.slice(0, 4))}년 ${Number(month.slice(5, 7))}월`}
            className="grid touch-pan-y grid-cols-7 gap-y-[4px]"
            onTouchStart={(e) => {
              const t = e.touches[0];
              swipeStart.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
            }}
            onTouchEnd={(e) => {
              const start = swipeStart.current;
              const t = e.changedTouches[0];
              swipeStart.current = null;
              if (!start || !t) return;
              const step = swipeStep(t.clientX - start.x, t.clientY - start.y);
              if (step !== 0) setMonth((m) => shiftMonth(m, step));
            }}
            onTouchCancel={() => {
              swipeStart.current = null;
            }}
          >
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
                  aria-label={`${label(day)}${isEdge ? (draft.end === null || draft.start === draft.end ? ", 선택한 날" : day === draft.start ? ", 시작일" : ", 종료일") : ""}`}
                  onClick={() => handlePick(day)}
                  className="relative flex h-[48px] items-start justify-center pt-[4px]"
                >
                  {/* 띠는 숫자 동그라미 높이에만 */}
                  {band && <span aria-hidden className={`absolute inset-x-0 top-[4px] h-[32px] ${band}`} />}
                  <span
                    className={`relative flex size-[32px] items-center justify-center rounded-full text-[14px] tabular-nums transition-colors duration-150 ${EASE_OUT} ${
                      isEdge ? "bg-staff-primary font-bold text-white" : day === today ? "font-bold text-staff-primary" : "text-staff-text"
                    }`}
                  >
                    {Number(day.slice(8, 10))}
                  </span>
                  {/* 양 끝 아래 「시작」 · 「종료」 꼬리표 — 어느 쪽이 시작인지 달력에서 바로 보이게(2026-11-24 사용자 지정) */}
                  {isEdge && (
                    <span className="absolute bottom-[1px] text-[10px] leading-none font-bold text-staff-primary">
                      {draft.end === null || draft.start === draft.end ? (draft.end === null ? "시작" : "하루") : day === draft.start ? "시작" : "종료"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* 고른 기간 · 날 수 — 날 수는 굵은 꼬리표로 기간 글자와 가른다(2026-11-24 사용자 지정) */}
          <p aria-live="polite" className={`flex items-center justify-center gap-[8px] text-[14px] ${tooLong ? "text-staff-error" : "text-staff-text"}`}>
            {draft.end === null ? (
              <>
                <span className="font-semibold">{label(draft.start)}</span>
                <span className="text-staff-text-sub">종료일을 선택해 주세요</span>
              </>
            ) : tooLong ? (
              "한 번에 최대 1년까지 조회할 수 있습니다"
            ) : (
              <>
                <span className="font-semibold">
                  {label(draft.start)} ~ {label(draft.end)}
                </span>
                <span className="rounded-full bg-staff-bg px-[10px] py-[2px] text-[13px] font-bold tabular-nums">{daysBetween(draft.start, draft.end)}일</span>
              </>
            )}
          </p>
          <p className="text-center text-[12px] text-staff-text-muted [&_b]:font-bold">
            한 번에 <b>최대 1년</b>까지 조회할 수 있습니다.
          </p>
          <Button disabled={draft.end === null || tooLong} onClick={handleApply}>
            적용
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
