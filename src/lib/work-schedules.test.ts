// node --test src/lib/work-schedules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  badgeOf,
  barOf,
  dayTitle,
  durationLabel,
  initialDay,
  kstDate,
  monthGrid,
  monthLabel,
  parseMonth,
  shiftMonth,
  weekDates,
  workMinutes,
  type MyWorkSchedule,
} from "./work-schedules.ts";

const shift = (over: Partial<MyWorkSchedule>): MyWorkSchedule => ({
  workScheduleId: 1,
  staffMemberId: 7,
  storeId: 10,
  workDate: "2026-09-10",
  startTime: "09:00",
  endTime: "18:00",
  startAt: "2026-09-10T00:00:00.000Z",
  endAt: "2026-09-10T09:00:00.000Z",
  breakMinutes: 60,
  ...over,
});

test("한국 날짜 — 서울 기준으로 자정을 넘긴다", () => {
  assert.equal(kstDate(new Date("2026-09-30T14:59:59.000Z")), "2026-09-30");
  assert.equal(kstDate(new Date("2026-09-30T15:00:00.000Z")), "2026-10-01");
});

test("주소의 달 — 형식이 맞으면 그대로, 아니면 오늘의 달", () => {
  assert.equal(parseMonth("2026-12", "2026-09-10"), "2026-12");
  for (const raw of [undefined, "", "2026-13", "2026-1", "0050-01", "abc", "2026-09-01"])
    assert.equal(parseMonth(raw, "2026-09-10"), "2026-09", String(raw));
});

test("달 옮기기 — 해를 넘긴다", () => {
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-09", 1), "2026-10");
  assert.equal(monthLabel("2026-09"), "2026년 9월");
});

test("달 격자 — 월요일 시작, 앞뒤 달 날은 inMonth 가 아니다", () => {
  const weeks = monthGrid("2026-09");
  // 2026-09-01 은 화요일 — 첫 주는 8월 31일(월)부터, 마지막 주는 10월 4일(일)까지
  assert.equal(weeks.length, 5);
  assert.deepEqual(weeks[0][0], { date: "2026-08-31", day: 31, inMonth: false });
  assert.deepEqual(weeks[0][1], { date: "2026-09-01", day: 1, inMonth: true });
  assert.deepEqual(weeks[4][6], { date: "2026-10-04", day: 4, inMonth: false });
  assert.ok(weeks.every((w) => w.length === 7));
  // 2026-02 는 일요일 1일 — 앞에 1월 여섯 날
  assert.equal(monthGrid("2026-02")[0][6].date, "2026-02-01");
  // 12월 → 다음 해 1월로 끝난다
  assert.equal(monthGrid("2026-12").at(-1)!.at(-1)!.date, "2027-01-03");
});

test("배지 — 시만, 30분이면 분까지, 여럿이면 첫 근무와 외 n", () => {
  assert.equal(badgeOf([]), null);
  assert.equal(badgeOf([shift({})]), "09–18");
  assert.equal(badgeOf([shift({ startTime: "09:30", endTime: "18:00" })]), "09:30–18");
  assert.equal(badgeOf([shift({ startTime: "22:00", endTime: "02:00" })]), "22–02");
  assert.equal(
    badgeOf([shift({}), shift({ workScheduleId: 2, startTime: "19:00", endTime: "21:00" })]),
    "09–18 외 1",
  );
});

test("처음 고른 날 — 이번 달이면 오늘, 아니면 첫 근무일, 없으면 1일", () => {
  const items = [shift({ workDate: "2026-09-15" }), shift({ workDate: "2026-09-03" })];
  assert.equal(initialDay("2026-09", "2026-09-10", items), "2026-09-10");
  assert.equal(initialDay("2026-09", "2026-10-02", items), "2026-09-03");
  assert.equal(initialDay("2026-09", "2026-10-02", []), "2026-09-01");
});

test("고른 날 제목", () => {
  assert.equal(dayTitle("2026-09-10"), "9월 10일(목)");
  assert.equal(dayTitle("2026-08-31"), "8월 31일(월)");
});

test("근무 막대 — 기본 08~20시, 넘으면 넓히고 자정 넘김은 다음 날 시각으로", () => {
  assert.deepEqual(barOf(shift({})), { schedule: { start: "09:00", end: "18:00" }, from: 8, to: 20 });
  assert.deepEqual(barOf(shift({ startTime: "06:30", endTime: "21:30" })), {
    schedule: { start: "06:30", end: "21:30" },
    from: 4,
    to: 24,
  });
  assert.deepEqual(barOf(shift({ startTime: "22:00", endTime: "02:00" })), {
    schedule: { start: "22:00", end: "26:00" },
    from: 8,
    to: 28,
  });
  // 자정에 끝나면 24:00
  assert.deepEqual(barOf(shift({ startTime: "16:00", endTime: "00:00" })).schedule, { start: "16:00", end: "24:00" });
});

test("이번 주 — 월요일부터 일요일까지, 달 · 해를 넘는다", () => {
  assert.deepEqual(weekDates("2026-10-23"), ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]);
  assert.deepEqual(weekDates("2026-10-19"), weekDates("2026-10-25"));
  assert.deepEqual(weekDates("2026-10-29"), ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]);
  assert.equal(weekDates("2027-01-01")[0], "2026-12-28");
});

test("근무 분 — 휴게를 빼고 자정 넘김은 다음 날로", () => {
  assert.equal(workMinutes(shift({})), 8 * 60);
  assert.equal(workMinutes(shift({ startTime: "22:00", endTime: "02:00", breakMinutes: 30 })), 210);
  assert.equal(workMinutes(shift({ startTime: "18:00", endTime: "00:00", breakMinutes: 0 })), 360);
});

test("근무 시간 글자", () => {
  assert.equal(durationLabel(480), "8시간");
  assert.equal(durationLabel(450), "7시간 30분");
  assert.equal(durationLabel(30), "30분");
  assert.equal(durationLabel(0), "0분");
});
