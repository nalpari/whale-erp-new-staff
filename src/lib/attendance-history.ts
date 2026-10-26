// 출퇴근 현황(WHALEERP-221 · 222, 목업 attendance-history.html · 데모 attendance)의 순수 계산. node --test 가 직접 읽으므로 값 import 를 두지 않는다.
import type { components } from "./api-types";

export type MyAttendanceDay = components["schemas"]["MyAttendanceDayDto"];
type MyAttendanceRecords = components["schemas"]["MyAttendanceRecordsResponseDto"];
type Tone = "success" | "warning" | "working" | "progress" | "neutral";

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS = "일월화수목금토";
/** 기간별 한 번에 볼 수 있는 폭 — 1년(HIST-2). api 한도(366일)와 같다 */
export const MAX_PERIOD_DAYS = 366;

export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
/** 한국 오늘 YYYY-MM-DD */
export const kstToday = (now: Date = new Date()) => new Date(now.getTime() + KST_MS).toISOString().slice(0, 10);
/** 그날이 든 주의 월요일 — 주는 월~일 */
export function mondayOf(day: string): string {
  const wd = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((wd + 6) % 7));
}
/** 「월 9/7」 */
export function dayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
const span = (from: string, to: string) => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS + 1;

/** 기간별 기본 — 이번 달(HIST-2). 주소 값이 없거나 이상하면(거꾸로 · 1년 넘음) 이 값 */
export function parsePeriod(rawFrom: unknown, rawTo: unknown, today: string): { from: string; to: string } {
  const ok = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
  const month = today.slice(0, 7);
  const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const def = { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
  if (!ok(rawFrom) || !ok(rawTo)) return def;
  const n = span(rawFrom as string, rawTo as string);
  return n < 1 || n > MAX_PERIOD_DAYS ? def : { from: rawFrom as string, to: rawTo as string };
}

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const punches = (d: MyAttendanceDay) => d.pairs.flatMap((p) => [p.checkIn, p.checkOut]);
/** 확인 필요 사유가 남은 날(HIST-3) */
export const isFlagged = (d: MyAttendanceDay) => punches(d).some((p) => p?.reviewReason);
type Punch = NonNullable<MyAttendanceDay["pairs"][number]["checkIn"]>;
type ReviewReason = NonNullable<Punch["reviewReason"]>;

/** 확인 필요 사유가 남은 기록 — 시트 제목 · 설명과 카드 요약(HIST-3). 출근 · 퇴근 어느 쪽인지는 기록이 정한다 */
export interface Flag {
  kind: "출근" | "퇴근";
  time: string;
  reason: ReviewReason;
}
export function flagsOf(d: MyAttendanceDay): Flag[] {
  return d.pairs.flatMap((p) => [
    ...(p.checkIn?.reviewReason ? [{ kind: "출근" as const, time: p.checkIn.time, reason: p.checkIn.reviewReason }] : []),
    ...(p.checkOut?.reviewReason ? [{ kind: "퇴근" as const, time: p.checkOut.time, reason: p.checkOut.reviewReason }] : []),
  ]);
}
/** 「출근 위치 확인 실패」 · 「반경 밖 퇴근」 — 반경 밖은 관리자 웹 꼬리표와 같은 말(2026-10-23 사용자 결정) */
export function flagTitle(f: Flag): string {
  if (f.reason === "ACCURACY_EXCEEDED") return `${f.kind} 위치 확인 실패`;
  if (f.reason === "MOCK_LOCATION") return `${f.kind} 위치 조작 감지`;
  return `반경 밖 ${f.kind}`;
}
export function flagDescription(f: Flag): string {
  const why =
    f.reason === "ACCURACY_EXCEEDED"
      ? "오차가 매장 범위보다 넓어 매장 안인지 자동으로 확인하지 못했습니다."
      : f.reason === "MOCK_LOCATION"
        ? "휴대전화 위치가 조작된 것으로 감지되었습니다."
        : "근무지 반경 밖에서 등록되었습니다.";
  return `${why} ${f.kind} 시각 ${f.time}은 등록되었고 관리자가 검토하고 있습니다.`;
}

/** 관리자가 보정 · 대신 등록한 날(연필, HIST-1). 「이상 없음」만 받은 날은 아니다(ATT-19) */
export const isEdited = (d: MyAttendanceDay) => d.edits.length > 0;

/** 지각 분 — 첫 출근이 첫 근무스케줄 시작보다 늦은 분 */
export function lateMinutes(d: MyAttendanceDay): number {
  const first = d.pairs.find((p) => p.checkIn)?.checkIn;
  const start = d.schedules[0]?.startTime;
  return first && start ? Math.max(0, minutesOf(first.time) - minutesOf(start)) : 0;
}

/** 하루 카드의 상태 칩(목업 · 데모). 대신 등록만 있는 날은 「대신 등록」, 퇴근 기록 없음은 확인 필요가 아닌 별도 표시(HIST-4) */
export function statusChipOf(d: MyAttendanceDay, today: string): { label: string; tone: Tone } | undefined {
  if (d.date > today) return undefined;
  const open = d.pairs.some((p) => p.checkIn && !p.checkOut);
  if (d.date === today && open) return { label: "근무 중", tone: "working" };
  if (d.status === "MISSING_CHECK_OUT") return { label: "퇴근 기록 없음", tone: "neutral" };
  if (d.status === "MISSING_CHECK_IN") return { label: "출근 기록 없음", tone: "neutral" };
  if (d.status === "ABSENT") return { label: "미출근", tone: "warning" };
  if (d.status === "LATE") return { label: `지각 ${lateMinutes(d)}분`, tone: "warning" };
  if (punches(d).some((p) => p?.entryMethod === "PROXY")) return { label: "대신 등록", tone: "neutral" };
  if (d.status === "NORMAL") return { label: "정상", tone: "success" };
  return undefined;
}

/** 카드 한 줄 요약 — 「출근 09:02 · 퇴근 18:00」, 근무 중이면 「퇴근 진행 중」, 아직 오지 않은 날은 「아직 근무 전입니다 · 예정 …」 */
export function summaryOf(d: MyAttendanceDay, today: string): string {
  const s = d.schedules[0];
  if (d.date > today || (!d.pairs.length && d.date === today)) return s ? `아직 근무 전입니다 · 예정 ${s.startTime} – ${s.endTime}` : "아직 근무 전입니다";
  if (!d.pairs.length) return d.status === "ABSENT" ? "출근 기록이 없습니다" : "-";
  return d.pairs
    .map((p) => {
      const out = p.checkOut ? `퇴근 ${p.checkOut.time}` : d.date === today ? "퇴근 진행 중" : "퇴근 기록 없음 · 근무지 관리자에게 문의";
      return `출근 ${p.checkIn?.time ?? "기록 없음"} · ${out}`;
    })
    .join(" / ");
}

/** 근무 막대 — 첫 근무스케줄과, 첫 출근 ~ 마지막 퇴근(오늘 근무 중이면 지금까지) */
export function barOf(d: MyAttendanceDay, now: Date = new Date()) {
  const s = d.schedules[0];
  const firstIn = d.pairs.find((p) => p.checkIn)?.checkIn?.time;
  const lastOut = [...d.pairs].reverse().find((p) => p.checkOut)?.checkOut?.time;
  const ongoing = d.pairs.some((p) => p.checkIn && !p.checkOut) && d.date === kstToday(now);
  const end = ongoing ? new Date(now.getTime() + KST_MS).toISOString().slice(11, 16) : lastOut;
  return {
    schedule: s ? { start: s.startTime, end: s.endTime } : undefined,
    // 퇴근이 없는 지난 날은 실제 막대를 그리지 않는다(목업 「퇴근 기록 없음」 카드는 예정만)
    worked: firstIn && end ? { start: firstIn, end } : undefined,
    ongoing,
  };
}

export interface PeriodTotals {
  workedMinutes: number;
  late: number;
  overtimeMinutes: number;
}
/**
 * 기간 누계 — 근무 · 연장은 api 가 급여 계산과 같은 규칙(휴게 뺌, 주 40시간 초과 포함)으로 센 값을 그대로 쓴다(2026-10-26 재영).
 * 지각은 오늘까지의 날에서 센다.
 */
export function periodTotals(records: Pick<MyAttendanceRecords, "items" | "totals">, today: string): PeriodTotals {
  return {
    workedMinutes: records.totals.workedMinutes,
    overtimeMinutes: records.totals.overtimeMinutes,
    late: records.items.filter((d) => d.date <= today && d.status === "LATE").length,
  };
}

/** 「63시간 16분」 · 「1시간 20분」 · 「40시간」 */
export const durationLabel = (minutes: number) => `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${String(minutes % 60).padStart(2, "0")}분` : ""}`;

export interface WeekRow {
  title: string;
  sub: string;
  current: boolean;
  upcoming: boolean;
}

/** 기간별 주별 줄(데모 weekRow) — 「9월 1주 · 8/31 – 9/6」, 「근무 5일 · 40시간 12분 · 지각 0 · 연장 1시간 20분」. 근무 · 연장은 api 의 주 값 */
export function weekRows(records: Pick<MyAttendanceRecords, "items" | "weeks">, today: string): WeekRow[] {
  const rows: WeekRow[] = [];
  for (const week of records.weeks) {
    const monday = week.monday;
    const sunday = addDays(monday, 6);
    const inWeek = records.items.filter((d) => d.date >= monday && d.date <= sunday);
    // 주의 이름은 그 주 목요일이 든 달 기준(달력 주 차)
    const thu = addDays(monday, 3);
    const nth = Math.floor((Number(thu.slice(8, 10)) - 1) / 7) + 1;
    const title = `${Number(thu.slice(5, 7))}월 ${nth}주 · ${dayLabel(monday).slice(2)} – ${dayLabel(sunday).slice(2)}`;
    const current = monday <= today && today <= sunday;
    const upcoming = monday > today;
    const worked = inWeek.filter((d) => d.date <= today && d.pairs.some((p) => p.checkIn));
    const t = { workedMinutes: week.workedMinutes, overtimeMinutes: week.overtimeMinutes, late: inWeek.filter((d) => d.status === "LATE").length };
    const sub = upcoming
      ? "예정 · 아직 근무 전입니다"
      : `${current ? "이번 주 · 진행 중 · " : `근무 ${worked.length}일 · `}${durationLabel(t.workedMinutes)} · 지각 ${t.late}${current ? "회" : ""}${t.overtimeMinutes ? ` · 연장 ${durationLabel(t.overtimeMinutes)}` : ""}`;
    rows.push({ title, sub, current, upcoming });
  }
  return rows;
}

/** 이번 주 7일 — 기록이 없는 날은 null(휴무 줄) */
export function weekDays(monday: string, days: readonly MyAttendanceDay[]): { date: string; day: MyAttendanceDay | null }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, day: days.find((d) => d.date === date) ?? null };
  });
}

/** 누계 제목의 기간 — 같은 달이면 「9월 1일 – 30일」, 아니면 「2025년 10월 23일 – 2026년 10월 23일」처럼 다른 부분까지 */
export function rangeLabel(from: string, to: string): string {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  if (fy !== ty) return `${fy}년 ${fm}월 ${fd}일 – ${ty}년 ${tm}월 ${td}일`;
  if (fm !== tm) return `${fm}월 ${fd}일 – ${tm}월 ${td}일`;
  return `${fm}월 ${fd}일 – ${td}일`;
}

/** 「9월 9일 22:10」(한국) */
export function stampLabel(iso: string): string {
  const k = new Date(Date.parse(iso) + KST_MS).toISOString();
  return `${Number(k.slice(5, 7))}월 ${Number(k.slice(8, 10))}일 ${k.slice(11, 16)}`;
}

type Edit = MyAttendanceDay["edits"][number];
/** 「출근 09:02 · 퇴근 없음」 → { 출근: "09:02", 퇴근: "없음" } — api 이력의 전후 값 글자 */
function partsOf(text: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (text ?? "").split(" · ")) {
    const [kind, value] = part.split(" ");
    if ((kind === "출근" || kind === "퇴근") && value) out[kind] = value;
  }
  return out;
}

/**
 * 연필 시트의 줄(목업 attendance-history 시트). 보정은 바뀐 쪽만 「수정 전 퇴근 17:48」 · 「수정 후 퇴근 18:02」, 대신 등록은
 * 「출근 · 퇴근 09:00 · 18:00」. 전후 값 글자를 읽지 못하면 통째로 보인다.
 */
export function editRows(e: Edit): [string, string][] {
  if (e.kind === "PROXY") {
    const a = partsOf(e.after);
    const value = a.출근 ? (a.퇴근 ? `${a.출근} · ${a.퇴근}` : a.출근) : e.after;
    return [
      [a.퇴근 || !a.출근 ? "출근 · 퇴근" : "출근", value],
      ["등록한 사람", e.by],
      ["등록 시각", stampLabel(e.at)],
      ["사유", e.reason],
    ];
  }
  const before = partsOf(e.before);
  const after = partsOf(e.after);
  const changed = (["출근", "퇴근"] as const).filter((k) => after[k] && before[k] !== after[k]);
  const diff: [string, string][] = changed.length
    ? changed.flatMap((k): [string, string][] => [
        [`수정 전 ${k}`, before[k] ?? "없음"],
        [`수정 후 ${k}`, after[k]],
      ])
    : [
        ["수정 전", e.before ?? "-"],
        ["수정 후", e.after],
      ];
  return [...diff, ["수정자", e.by], ["수정 시각", stampLabel(e.at)], ["사유", e.reason]];
}
