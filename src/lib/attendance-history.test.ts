// node --test src/lib/attendance-history.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { barOf, dayLabel, durationLabel, editRows, flagDescription, flagsOf, flagTitle, rangeLabel, mondayOf, parsePeriod, periodTotals, stampLabel, statusChipOf, summaryOf, weekDays, weekRows, type MyAttendanceDay } from "./attendance-history.ts";

const TODAY = "2026-10-23";
const punch = (date: string, time: string, extra: object = {}) => ({
  attendanceRecordId: 1,
  recordedAt: `${date}T${time}:00+09:00`,
  time,
  reviewReason: null,
  entryMethod: "SELF" as const,
  isCorrected: false,
  ...extra,
});
const day = (date: string, patch: Partial<MyAttendanceDay> = {}): MyAttendanceDay => ({
  date,
  staffMemberId: 1,
  name: "가",
  phone: "01000000000",
  storeId: 1,
  storeName: "강남역점",
  employmentType: "PART_TIME",
  employmentStatus: "EMPLOYED",
  schedules: [{ startTime: "09:00", endTime: "18:00", breakMinutes: 60 }],
  pairs: [{ checkIn: punch(date, "09:00"), checkOut: punch(date, "18:00") }],
  status: "NORMAL",
  isPayslipConfirmed: false,
  edits: [],
  ...patch,
});

test("기간별 기본은 이번 달, 거꾸로 · 1년 넘으면 기본", () => {
  assert.deepEqual(parsePeriod(undefined, undefined, TODAY), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(parsePeriod("2026-10-20", "2026-10-01", TODAY), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(parsePeriod("2025-10-01", "2026-10-02", TODAY), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(parsePeriod("2025-10-23", "2026-10-23", TODAY), { from: "2025-10-23", to: "2026-10-23" });
});

test("상태 칩 — 정상 · 지각 N분 · 퇴근 기록 없음(HIST-4) · 근무 중 · 대신 등록 · 아직 오지 않은 날은 없음", () => {
  assert.deepEqual(statusChipOf(day("2026-10-20"), TODAY), { label: "정상", tone: "success" });
  assert.deepEqual(statusChipOf(day("2026-10-21", { status: "LATE", pairs: [{ checkIn: punch("2026-10-21", "09:14"), checkOut: punch("2026-10-21", "18:02") }] }), TODAY), {
    label: "지각 14분",
    tone: "warning",
  });
  assert.deepEqual(statusChipOf(day("2026-10-22", { status: "MISSING_CHECK_OUT", pairs: [{ checkIn: punch("2026-10-22", "09:00"), checkOut: null }] }), TODAY), {
    label: "퇴근 기록 없음",
    tone: "neutral",
  });
  assert.deepEqual(statusChipOf(day(TODAY, { pairs: [{ checkIn: punch(TODAY, "09:02"), checkOut: null }] }), TODAY), { label: "근무 중", tone: "working" });
  assert.deepEqual(statusChipOf(day("2026-10-20", { pairs: [{ checkIn: punch("2026-10-20", "09:00", { entryMethod: "PROXY" }), checkOut: punch("2026-10-20", "18:00") }] }), TODAY), {
    label: "대신 등록",
    tone: "neutral",
  });
  assert.equal(statusChipOf(day("2026-10-24", { pairs: [], status: null }), TODAY), undefined);
});

test("요약 줄과 근무 막대", () => {
  assert.equal(summaryOf(day("2026-10-20"), TODAY), "출근 09:00 · 퇴근 18:00");
  assert.equal(summaryOf(day("2026-10-24", { pairs: [], status: null }), TODAY), "아직 근무 전입니다 · 예정 09:00 – 18:00");
  assert.equal(summaryOf(day(TODAY, { pairs: [{ checkIn: punch(TODAY, "09:02"), checkOut: null }] }), TODAY), "출근 09:02 · 퇴근 진행 중");
  const bar = barOf(day(TODAY, { pairs: [{ checkIn: punch(TODAY, "09:02"), checkOut: null }] }), new Date("2026-10-23T05:00:00Z"));
  assert.deepEqual(bar, { schedule: { start: "09:00", end: "18:00" }, worked: { start: "09:02", end: "14:00" }, ongoing: true });
});

test("이번 주 7일 · 날 라벨 · 주별 줄 · 누계", () => {
  assert.equal(mondayOf(TODAY), "2026-10-19");
  assert.equal(dayLabel("2026-10-19"), "월 10/19");
  const week = weekDays("2026-10-19", [day("2026-10-20")]);
  assert.equal(week.length, 7);
  assert.equal(week[0].day, null);
  assert.equal(week[1].day?.date, "2026-10-20");
  const days = [day("2026-10-13"), day("2026-10-14", { status: "LATE", pairs: [{ checkIn: punch("2026-10-14", "09:10"), checkOut: punch("2026-10-14", "19:10") }] })];
  // 근무 · 연장은 api 값(급여 계산 규칙)을 그대로 — 지각만 날에서 센다
  assert.deepEqual(periodTotals({ items: days, totals: { workedMinutes: 17 * 60, overtimeMinutes: 60 } }, TODAY), { workedMinutes: 17 * 60, late: 1, overtimeMinutes: 60 });
  const weeks = ["2026-10-12", "2026-10-19", "2026-10-26"].map((monday, i) => ({ monday, workedMinutes: i ? 0 : 19 * 60, overtimeMinutes: i ? 0 : 60 }));
  const rows = weekRows({ items: days, weeks }, TODAY);
  assert.equal(rows[0].title, "10월 3주 · 10/12 – 10/18");
  assert.equal(rows[0].sub, "근무 2일 · 19시간 · 지각 1 · 연장 1시간");
  assert.equal(rows[1].current, true);
  assert.equal(rows[2].upcoming, true);
  assert.equal(durationLabel(63 * 60 + 16), "63시간 16분");
  assert.equal(stampLabel("2026-09-09T13:10:00Z"), "9월 9일 22:10");
});

test("확인 필요 사유(HIST-3)와 누계 기간 이름", () => {
  const d = day("2026-10-20", { pairs: [{ checkIn: punch("2026-10-20", "09:58", { reviewReason: "ACCURACY_EXCEEDED" }), checkOut: punch("2026-10-20", "18:00", { reviewReason: "OUT_OF_RADIUS_CHECKOUT" }) }] });
  const flags = flagsOf(d);
  assert.deepEqual(flags.map(flagTitle), ["출근 위치 확인 실패", "반경 밖 퇴근"]);
  assert.equal(flagDescription(flags[0]), "오차가 매장 범위보다 넓어 매장 안인지 자동으로 확인하지 못했습니다. 출근 시각 09:58은 등록되었고 관리자가 검토하고 있습니다.");
  const long = flagsOf(day("2026-10-21", { pairs: [{ checkIn: punch("2026-10-21", "06:00"), checkOut: punch("2026-10-21", "19:00", { reviewReason: "LONG_SHIFT" }) }] }))[0];
  assert.equal(flagTitle(long), "근무 12시간 초과");
  assert.equal(flagDescription(long), "출근부터 퇴근까지 12시간이 넘었습니다. 퇴근 시각 19:00은 등록되었고 관리자가 검토하고 있습니다.");
  assert.equal(summaryOf(day("2026-10-22", { status: "MISSING_CHECK_OUT", pairs: [{ checkIn: punch("2026-10-22", "09:14"), checkOut: null }] }), TODAY), "출근 09:14 · 퇴근 기록 없음 · 근무지 관리자에게 문의");
  assert.equal(rangeLabel("2026-09-01", "2026-09-30"), "9월 1일 – 30일");
  assert.equal(rangeLabel("2026-09-15", "2026-10-14"), "9월 15일 – 10월 14일");
  assert.equal(rangeLabel("2025-10-23", "2026-10-23"), "2025년 10월 23일 – 2026년 10월 23일");
});

test("연필 시트 줄 — 보정은 바뀐 쪽만, 대신 등록은 시각만(목업)", () => {
  const base = { at: "2026-09-09T13:10:00Z", by: "박지수", byRole: "BP 마스터" };
  assert.deepEqual(editRows({ ...base, kind: "CORRECTION", before: "출근 09:14 · 퇴근 17:48", after: "출근 09:14 · 퇴근 18:02", reason: "퇴근 시각 미태깅 정정" }), [
    ["수정 전 퇴근", "17:48"],
    ["수정 후 퇴근", "18:02"],
    ["수정자", "박지수"],
    ["수정 시각", "9월 9일 22:10"],
    ["사유", "퇴근 시각 미태깅 정정"],
  ]);
  assert.deepEqual(editRows({ ...base, kind: "CORRECTION", before: "출근 09:14 · 퇴근 없음", after: "출근 09:14 · 퇴근 18:30", reason: "r" }).slice(0, 2), [
    ["수정 전 퇴근", "없음"],
    ["수정 후 퇴근", "18:30"],
  ]);
  assert.deepEqual(editRows({ ...base, kind: "PROXY", before: null, after: "출근 09:00 · 퇴근 18:00", reason: "위치정보 동의 없음" }).slice(0, 2), [
    ["출근 · 퇴근", "09:00 · 18:00"],
    ["등록한 사람", "박지수"],
  ]);
  const past = barOf(day("2026-10-22", { status: "MISSING_CHECK_OUT", pairs: [{ checkIn: punch("2026-10-22", "09:14"), checkOut: null }] }), new Date("2026-10-23T05:00:00Z"));
  assert.equal(past.worked, undefined);
});
