// 근로계약서 화면 규칙과 문구(WHALEERP-146). 상태 없는 순수 함수만 둔다 — 가져오기는 contracts.ts 다.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { formatWon } from "./payslip-rules.ts";
import { KST_OFFSET_MS, dateLabel, kstDateLabel, kstDateTimeLabel } from "./profile.ts";
import type { ContractDetail, ContractDocument, ContractListItem, ContractStatus, ContractWorkDay, Weekday } from "./contracts";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ID = 2_147_483_647;

/** 남은 날인 기한이 이 날수 이내면 강조색으로 보인다(CON-4). 임박 알림은 없다. */
export const URGENT_DAYS = 7;

/** ISO 시각의 한국 달력 날짜(UTC 자정 ms). 한국은 서머타임이 없어 9시간만 민다. */
const kstDay = (ms: number) => Math.floor((ms + KST_OFFSET_MS) / DAY_MS);

/**
 * 화면이 보이는 계약 단계. api 상태 그대로이되, 서명 대기인데 api 가 지금 날인할 수 없다고 하면(awaitingSignature=false — 서명 대기 ·
 * 기한 안 · 재직 중 셋 중 하나가 아님) 서명 대기로 보이지 않는다. 날인할 수 있는지는 api 의 awaitingSignature 로만 정하고, 서버 시계는
 * 그 까닭을 문구로 고를 때만 본다 — 기한이 지났으면 만료(하루 배치가 만료로 바꾸기 전), 아니면 퇴직 등으로 서명할 수 없음(UNSIGNABLE).
 */
export type ContractPhase = ContractStatus | "UNSIGNABLE";

type PhaseFields = Pick<ContractListItem, "status" | "awaitingSignature" | "signDeadlineAt">;

export function phaseOf(c: PhaseFields, now: Date): ContractPhase {
  if (c.status !== "PENDING_SIGNATURE" || c.awaitingSignature) return c.status;
  return c.signDeadlineAt && Date.parse(c.signDeadlineAt) <= now.getTime() ? "EXPIRED" : "UNSIGNABLE";
}

/**
 * 화면 단계의 한글. 보통은 api enum 한글(enumLabel, ContractStatus)을 그대로 쓴다. 예외 둘만 값을 코드에 적는다:
 * 서명 불가(UNSIGNABLE)는 enum 값이 아닌 화면 단계이고, 거부(REJECTED)는 용어집(2026-10-28 재영)이 직원 앱 화면에서 「거절」로
 * 부르기로 해서다 — enum 한글은 표준(거부) 그대로 두고 관리자 웹도 그것을 쓴다.
 */
export function phaseLabel(phase: ContractPhase, enumLabel: string): string {
  if (phase === "UNSIGNABLE") return "서명 불가";
  if (phase === "REJECTED") return "거절";
  return enumLabel;
}

export type Deadline = {
  /** 「2026년 9월 12일」(한국 날짜) */
  date: string;
  /** 「2026년 9월 12일 10:23」(한국 시각) — api 의 기한은 발송 시각 + 30일 그 시각이라 하루 끝이 아니다 */
  dateTime: string;
  /** 기한 날짜 − 오늘(한국 달력), 0 아래로 내리지 않는다 */
  daysLeft: number;
  /** 남은 날이 URGENT_DAYS 이내 */
  urgent: boolean;
};

/**
 * 날인 기한 — api 가 지금 날인할 수 있다고 할 때(awaitingSignature)만. 남은 날은 한국 달력 날짜로 센다(기한이 오늘이면 0).
 * 기한 안인지는 api 가 이미 판정했으므로 서버 시계로 다시 「지남」을 가리지 않는다. 그 밖이면 null.
 */
export function deadlineOf(c: PhaseFields, now: Date): Deadline | null {
  if (c.status !== "PENDING_SIGNATURE" || !c.awaitingSignature || !c.signDeadlineAt) return null;
  const daysLeft = Math.max(0, kstDay(Date.parse(c.signDeadlineAt)) - kstDay(now.getTime()));
  return { date: kstDateLabel(c.signDeadlineAt), dateTime: kstDateTimeLabel(c.signDeadlineAt), daysLeft, urgent: daysLeft <= URGENT_DAYS };
}

/**
 * 목록 줄 「서명 기한 2026년 9월 12일 · D-2」, 기한이 오늘 · 내일이면 시각까지 「서명 기한 2026년 9월 12일 10:23까지 · D-1」.
 * 상세 머리 카드는 늘 시각까지 「서명 기한 2026년 9월 12일 10:23까지 · 2일 남음」(당일은 「오늘 마감」). 기한은 하루 끝이 아니라
 * 발송 시각 + 30일 그 시각이라(api) 날짜만 보이면 그날 저녁까지 남은 줄 안다 — 내일 이른 시각이면 남은 시간이 한 시간일 수도 있다.
 */
export function deadlineText(d: Deadline, style: "list" | "detail"): string {
  const withTime = style === "detail" || d.daysLeft <= 1;
  const left = style === "list" ? (d.daysLeft === 0 ? "D-day" : `D-${d.daysLeft}`) : d.daysLeft === 0 ? "오늘 마감" : `${d.daysLeft}일 남음`;
  return `서명 기한 ${withTime ? `${d.dateTime}까지` : d.date} · ${left}`;
}

/** 「2026년 9월 15일 – 2027년 3월 14일」, 끝이 없으면 「2026년 3월 1일부터 · 기간 정함 없음」. */
export function periodText(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "-";
  return endDate ? `${dateLabel(startDate)} – ${dateLabel(endDate)}` : `${dateLabel(startDate)}부터 · 기간 정함 없음`;
}

/**
 * 목록 줄 · 상세 머리 카드의 둘째 줄. 날인할 수 있는 서명 대기는 기한, 체결 완료는 서명한 날(종이 계약은 관리자가 올린 날),
 * 거부 · 수정 요청은 그날(processedAt), 만료(기한이 지난 서명 대기 포함)는 지난 기한, 서명 불가는 그 까닭, 종료는 계약 기간.
 * statusLabel 은 화면 단계의 한글(phaseLabel).
 */
export function contractSubText(
  c: PhaseFields & Pick<ContractListItem, "contractMethod" | "processedAt" | "startDate" | "endDate">,
  now: Date,
  statusLabel: string,
  style: "list" | "detail" = "list",
): string {
  const deadline = deadlineOf(c, now);
  if (deadline) return deadlineText(deadline, style);
  const on = (iso: string | null) => (iso ? ` ${kstDateLabel(iso)}` : "");
  switch (phaseOf(c, now)) {
    case "SIGNED":
      return c.contractMethod === "PAPER" ? `종이 계약 ·${on(c.processedAt)} 등록` : `서명${on(c.processedAt)}`;
    case "EXPIRED":
      return c.signDeadlineAt ? `서명 기한 ${kstDateLabel(c.signDeadlineAt)} 지남` : statusLabel;
    case "UNSIGNABLE":
      return "지금은 서명할 수 없습니다";
    case "ENDED":
      return periodText(c.startDate, c.endDate);
    default:
      return `${statusLabel}${on(c.processedAt)}`;
  }
}

/** 상태 배지 색. 서명 대기만 강조, 거부 · 만료는 오류 색, 체결 완료는 정상, 종료 · 서명 불가는 중립(데모 contract). */
export function statusTone(phase: ContractPhase): "warning" | "success" | "danger" | "waiting" | "progress" {
  switch (phase) {
    case "PENDING_SIGNATURE":
      return "warning";
    case "SIGNED":
      return "success";
    case "REJECTED":
    case "EXPIRED":
      return "danger";
    case "CORRECTION_REQUESTED":
      return "progress";
    default:
      return "waiting";
  }
}

/** 처리가 끝난 계약 — 다시 서명 · 거부할 수 없고 읽기만 한다. 날인할 수 있는 서명 대기 · 수정 요청만 아직 진행 중이다. */
export const isFinished = (phase: ContractPhase) => phase !== "PENDING_SIGNATURE" && phase !== "CORRECTION_REQUESTED";

/**
 * 목록 묶음: 진행 중(날인할 수 있는 서명 대기 · 수정 요청)과 처리가 끝난 것. 기한이 지났거나 퇴직 등으로 날인할 수 없는 서명 대기는
 * 상세와 같게 처리가 끝난 쪽이다. 각 묶음 안은 api 순서(날인 대기는 기한이 급한 순, 그다음 최근 것) 그대로.
 */
export function groupContracts<T extends PhaseFields>(items: readonly T[], now: Date): { open: T[]; finished: T[] } {
  const done = (c: T) => isFinished(phaseOf(c, now));
  return { open: items.filter((c) => !done(c)), finished: items.filter(done) };
}

/** 경로의 계약 번호 · 주소의 점포 번호. api 의 id 는 integer 라 1..2147483647 밖은 없는 것으로 본다. */
export function parseId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== "string" || !/^[1-9][0-9]*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_ID ? id : null;
}

const WEEKDAYS: readonly Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const minutes = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

/** 하루 근로시간(시간) — 종업 − 시업 − 휴게. */
const dayHours = (d: ContractWorkDay) =>
  (minutes(d.endTime) - minutes(d.startTime) - (d.breakStartTime && d.breakEndTime ? minutes(d.breakEndTime) - minutes(d.breakStartTime) : 0)) / 60;

/** 「5시간」 · 「7.5시간」 — 소수 한 자리, 끝의 0 은 지운다(7시간 20분 → 「7.3시간」). */
export const hoursText = (hours: number) => `${Number(hours.toFixed(1))}시간`;

export type WeekdayRow = { weekday: Weekday; start: string; end: string; rest: string; hours: string; off: boolean };

/**
 * 제3조 소정근로시간 표(CTR-21) — 월요일부터 일요일까지 일곱 줄. 근무 요일은 시업 · 종업 · 휴게 · 근로시간, 근무하지 않는 날은
 * 「—」와 「휴무」, 주휴일이면 「주휴일」.
 */
export function weekdayRows(workDays: readonly ContractWorkDay[], weeklyHoliday: Weekday | null): WeekdayRow[] {
  return WEEKDAYS.map((weekday) => {
    const d = workDays.find((w) => w.weekday === weekday);
    if (!d) return { weekday, start: "—", end: "—", rest: "—", hours: weekday === weeklyHoliday ? "주휴일" : "휴무", off: true };
    const rest = d.breakStartTime && d.breakEndTime ? `${d.breakStartTime}–${d.breakEndTime}` : "없음";
    return { weekday, start: d.startTime, end: d.endTime, rest, hours: hoursText(dayHours(d)), off: false };
  });
}

/** 주 소정근로시간(시간). */
export const weeklyHours = (workDays: readonly ContractWorkDay[]) => workDays.reduce((sum, d) => sum + dayHours(d), 0);

/** 「10,320원」 */
export const wonText = (amount: number) => `${formatWon(amount)}원`;

/** 임금 지급일 「익월 10일」 · 「당월 말일」(31 은 말일). payMonthLabel 은 enum 한글(PayMonth). */
export function payDayText(payMonthLabel: string | null, payDay: number | null): string | null {
  if (!payMonthLabel || payDay === null) return null;
  return `${payMonthLabel} ${payDay === 31 ? "말일" : `${payDay}일`}`;
}

/** 수습 「3개월 · 시급의 10% 감액(수습 중 시급 9,288원)」, 감액률 0 이면 「3개월 · 감액 없음」. 수습이 없으면 null. */
export function probationText(months: number | null, rate: number | null, wage: number | null): string | null {
  if (months === null || rate === null) return null;
  if (rate === 0) return `${months}개월 · 감액 없음`;
  const during = wage === null ? "" : `(수습 중 시급 ${wonText(Math.round(wage * (1 - rate / 100)))})`;
  return `${months}개월 · 시급의 ${rate}% 감액${during}`;
}

/** 사회보험 한 묶음 — 가입 · 가입하지 않음, 정하지 않았으면 「-」. */
export const insuredText = (v: boolean | null) => (v === null ? "-" : v ? "가입" : "가입하지 않음");

/** 「010-****-5521」 — 가운데를 가린다. 휴대전화번호 모양(01 로 시작하는 10~11자리)이 아니면 끝 4자리만 남긴다 「****-1234」. */
export function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^01\d{8,9}$/.test(digits)) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  return digits.length >= 4 ? `****-${digits.slice(-4)}` : "****";
}

/** 종이 계약(CTR-23)에서 보이는 파일 — 관리자가 올린 날인본(필수)과 임금계약서(선택). 날인본이 먼저. */
export function paperDocuments(documents: readonly ContractDocument[]): ContractDocument[] {
  const order = (d: ContractDocument) => (d.kind === "PAPER_EMPLOYMENT_CONTRACT" ? 0 : 1);
  return documents.filter((d) => d.kind === "PAPER_EMPLOYMENT_CONTRACT" || d.kind === "WAGE_CONTRACT").sort((a, b) => order(a) - order(b));
}

/**
 * 내보낼 처리 완료본(WHALEERP-149) — 체결이 끝난 전자계약(체결 완료 · 종료)의 SIGNED_COPY. 서명 대기 · 수정 요청 · 거절 · 만료와
 * 종이 계약은 null. 처리 완료본은 파일 생성(WHALEERP-131)이 만들어야 생기므로 없으면 null. 여럿이면 가장 나중 것.
 * api(#182)는 체결 완료와 체결 완료에서 종료된 계약만 받고 그 밖은 409 — 받기 라우트가 상세의 「지금은 받을 수 없음」 안내로 돌린다.
 */
export function signedCopyOf(c: Pick<ContractDetail, "status" | "contractMethod" | "documents">): ContractDocument | null {
  if (c.contractMethod === "PAPER" || (c.status !== "SIGNED" && c.status !== "ENDED")) return null;
  return c.documents.reduce<ContractDocument | null>(
    (last, d) => (d.kind === "SIGNED_COPY" && (!last || d.contractDocumentId > last.contractDocumentId) ? d : last),
    null,
  );
}

/** 계약서의 월 근로시간 줄(값이 있는 것만). 기본시간 중 휴일 · 월 추가 휴일은 관리자 작성 화면이 받지 않아 보이지 않는다. */
export function monthlyHourRows(c: Pick<ContractDetail, "baseHours" | "monthlyOvertimeHours" | "baseNightHours">): [string, string][] {
  const rows: [string, number | null][] = [
    ["월 기본 근로", c.baseHours],
    ["월 연장 근로", c.monthlyOvertimeHours],
    ["기본 근로 중 야간", c.baseNightHours],
  ];
  return rows.filter((r): r is [string, number] => r[1] !== null).map(([label, h]) => [label, hoursText(h)]);
}
