// 근무 탭 근무스케줄 월 달력(#205)의 순수 계산 — 달 · 격자 · 배지 · 고른 날 · 근무 막대 범위.
// node --test 가 직접 읽으므로 값 import 는 두지 않는다(타입 import 는 지워진다).
import type { Schemas } from "./api";

export type MyWorkSchedule = Schemas["WorkScheduleDto"];
export type CalendarDay = { date: string; day: number; inMonth: boolean };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
/** api 와 같은 달 형식 — 해 첫 자리 0 은 받지 않는다 */
const MONTH_PATTERN = /^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/;

const pad = (n: number) => String(n).padStart(2, "0");
const utcOf = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const ymdOf = (date: Date) => date.toISOString().slice(0, 10);

/** 그 순간의 한국 날짜 YYYY-MM-DD */
export const kstDate = (at: Date) => ymdOf(new Date(at.getTime() + KST_OFFSET_MS));

/** 주소의 ?month= — 형식이 맞으면 그대로, 아니면 오늘(YYYY-MM-DD)의 달 */
export const parseMonth = (raw: string | undefined, today: string) => (raw && MONTH_PATTERN.test(raw) ? raw : today.slice(0, 7));

export function shiftMonth(month: string, delta: number): string {
  const index = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + delta;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

export const monthLabel = (month: string) => `${Number(month.slice(0, 4))}년 ${Number(month.slice(5, 7))}월`;

/** 월요일부터 일요일까지 주 단위 격자. 첫 주 · 마지막 주의 앞뒤 달 날은 inMonth 가 false 다 */
export function monthGrid(month: string): CalendarDay[][] {
  const first = utcOf(`${month}-01`);
  const next = utcOf(`${shiftMonth(month, 1)}-01`);
  // getUTCDay 는 일요일이 0 — 월요일로부터 며칠 지났는지로 바꾼다
  let cursor = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY_MS);
  const weeks: CalendarDay[][] = [];
  while (cursor < next) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push({ date: ymdOf(cursor), day: cursor.getUTCDate(), inMonth: ymdOf(cursor).startsWith(month) });
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    weeks.push(week);
  }
  return weeks;
}

/** 배지 시각 — 정시면 시만(09), 30분이면 분까지(09:30) */
const short = (hhmm: string) => (hhmm.endsWith(":00") ? hhmm.slice(0, 2) : hhmm);

/** 그날 근무(시작순)의 배지 글자. 없으면 null — 근무가 있는 날에만 붙인다(WORK-1) */
export function badgeOf(items: readonly MyWorkSchedule[]): string | null {
  if (items.length === 0) return null;
  const text = `${short(items[0].startTime)}–${short(items[0].endTime)}`;
  return items.length > 1 ? `${text} 외 ${items.length - 1}` : text;
}

/** 처음 고른 날 — 보는 달이 이번 달이면 오늘, 아니면 그 달 첫 근무일, 근무가 없으면 1일 */
export function initialDay(month: string, today: string, items: readonly MyWorkSchedule[]): string {
  if (today.startsWith(month)) return today;
  const days = items.map((i) => i.workDate).sort();
  return days[0] ?? `${month}-01`;
}

/** 9월 10일(목) */
export function dayTitle(ymd: string): string {
  const date = utcOf(ymd);
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일(${WEEKDAYS[date.getUTCDay()]})`;
}

const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmmOf = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/**
 * 고른 날 상세의 근무 막대(WorkTimeBar) 값. 종료가 시작보다 이르거나 같으면 다음 날이라(자정 넘김) 24시간을 더한 시각으로
 * 그린다. 막대 범위는 기본 08~20시이고, 넘으면 4시간 눈금에 맞춰 넓힌다.
 */
export function barOf(item: MyWorkSchedule): { schedule: { start: string; end: string }; from: number; to: number } {
  const start = minutesOf(item.startTime);
  let end = minutesOf(item.endTime);
  if (end <= start) end += 24 * 60;
  const from = Math.min(8, Math.floor(start / 60 / 4) * 4);
  const reach = Math.max(20, Math.ceil(end / 60));
  return {
    schedule: { start: item.startTime, end: hhmmOf(end) },
    from,
    to: from + Math.ceil((reach - from) / 4) * 4,
  };
}
