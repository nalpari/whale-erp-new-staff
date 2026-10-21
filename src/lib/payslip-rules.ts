import type { PayslipItem, PayslipLog } from "./payslips";

// 급여명세서 화면 규칙과 문구. 상태 없는 순수 함수만 둔다 — 가져오기는 payslips.ts 다.
// 합계 · 실지급액은 다시 더하지 않고 api 가 저장한 값(grossPayAmount · totalDeductionAmount · netPayAmount)을 보인다.

const TIME_ZONE = "Asia/Seoul";
const MAX_ID = 2_147_483_647;

/** 보이는 금액: 관리자 수정값 > 시스템 계산값. 둘 다 없으면 0 — 관리자 화면의 합계도 0 으로 센다. */
export function itemAmount(item: PayslipItem): number {
  return item.adjustedAmount ?? item.calculatedAmount ?? 0;
}

export const isEarning = (item: PayslipItem) => item.itemCategory === "EARNING";

/** 3.3% 원천징수를 켜면 소득세 · 지방소득세가 빠진다 — 3.3% 가 사업소득세 3% + 지방소득세 0.3% 라서다(PAY-03). */
const REPLACED_BY_WITHHOLDING = new Set(["INCOME_TAX", "LOCAL_INCOME_TAX"]);

/**
 * 이 명세서에 보이는 줄. 관리자 화면(whale-erp-front src/lib/payslips.ts 의 isItemShown)과 같은 규칙이다 — api 는 저장된 줄을
 * 모두 준다. 원천징수 둘은 3.3% 를 켰을 때만, 그때 기본 공제의 소득세 · 지방소득세는 뺀다.
 */
export function isItemShown(item: PayslipItem, isWithholdingApplied: boolean): boolean {
  if (item.itemCategory === "WITHHOLDING") return isWithholdingApplied;
  if (item.itemCategory === "BASIC") return !(isWithholdingApplied && REPLACED_BY_WITHHOLDING.has(item.itemCode));
  return true;
}

const byTime = (a: PayslipLog, b: PayslipLog) => Date.parse(a.changedAt) - Date.parse(b.changedAt);
const sends = (logs: readonly PayslipLog[]) => logs.filter((l) => l.logType === "SEND").sort(byTime);

export const isResent = (logs: readonly PayslipLog[]) => sends(logs).length > 1;

const parts = (iso: string, options: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hourCycle: "h23", ...options })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );

/** 처리 이력의 시각 「09-10 09:12」(한국 시각). */
export function formatHistoryTime(iso: string): string {
  const p = parts(iso, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** 「9월 10일」(한국 시각). */
export function sentDateLabel(iso: string): string {
  const p = parts(iso, { month: "numeric", day: "numeric" });
  return `${p.month}월 ${p.day}일`;
}

/**
 * 처리 이력(PAY-1 · PAY-20): 발송 · 확정 취소만 보인다(api 가 이 둘만 준다). 발송이 여럿이면 가장 최근 발송 한 줄만
 * 「발송」으로 보이고 앞의 발송은 보이지 않는다 — 「재발송」 줄은 두지 않는다. 확정 취소는 모두 보인다. 관리자 이름은
 * 적지 않는다. 최근 것이 위.
 */
export function historyEntries(logs: readonly PayslipLog[]): { at: string; label: string }[] {
  const latestSend = sends(logs).at(-1);
  return [...logs]
    .sort(byTime)
    .filter((l) => l.logType === "CANCEL_CONFIRMATION" || l === latestSend)
    .map((l) => ({ at: formatHistoryTime(l.changedAt), label: l.logType === "SEND" ? "발송" : "확정 취소" }))
    .reverse();
}

const ymd = (date: string) => date.split("-").map(Number) as [number, number, number];

/** 「9월」 — api 의 이번 달(YYYY-MM, 한국 시간) */
export function receivedMonthLabel(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/** 고를 수 있는 연도 — 한국 시간 올해부터 3년 전까지(보관 3년, PAY-4 · PAY-10). */
export function filterYears(now: Date = new Date()): number[] {
  const thisYear = Number(parts(now.toISOString(), { year: "numeric" }).year);
  return [0, 1, 2, 3].map((n) => thisYear - n);
}

/** 주소의 점포 · 연도 필터. 숫자가 아니거나 고를 수 없는 연도면 없는 것으로 본다(연도는 올해). */
export function parsePayFilter(
  raw: { store?: string | string[]; year?: string | string[] },
  years: readonly number[],
): { storeId?: number; year: number } {
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const storeId = parsePayslipId(one(raw.store) ?? "") ?? undefined;
  const year = Number(one(raw.year));
  return { storeId, year: years.includes(year) ? year : years[0] };
}

/** 「2026년 8월」 */
export function monthLabel(periodStartDate: string): string {
  const [y, m] = ymd(periodStartDate);
  return `${y}년 ${m}월`;
}

/** 「2026년 8월 1일 – 8월 31일」. 해를 넘으면 끝에도 해를 적는다. */
export function periodLabel(start: string, end: string): string {
  const [sy, sm, sd] = ymd(start);
  const [ey, em, ed] = ymd(end);
  return `${sy}년 ${sm}월 ${sd}일 – ${ey === sy ? "" : `${ey}년 `}${em}월 ${ed}일`;
}

export const formatWon = (amount: number) => amount.toLocaleString("ko-KR");

/** 경로의 명세서 번호. api 의 id 는 integer 라 1..2147483647 밖은 없는 명세서다. 다른 글자를 api 경로에 싣지 않으려고도 거른다. */
export function parsePayslipId(raw: string): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_ID ? id : null;
}
