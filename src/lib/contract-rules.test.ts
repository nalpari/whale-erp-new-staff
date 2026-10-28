// node --test src/lib/contract-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contractSubText,
  deadlineOf,
  deadlineText,
  groupContracts,
  maskPhone,
  monthlyHourRows,
  paperDocuments,
  parseId,
  payDayText,
  periodText,
  probationText,
  statusTone,
  weekdayRows,
  weeklyHours,
  wonText,
} from "./contract-rules.ts";
import type { ContractDocument, ContractListItem, ContractWorkDay } from "./contracts.ts";

const item = (over: Partial<ContractListItem> = {}): ContractListItem => ({
  contractId: 1,
  storeId: 10,
  storeName: "웨일카페 강남역점",
  status: "PENDING_SIGNATURE",
  employmentType: "PART_TIME",
  contractMethod: "ELECTRONIC",
  startDate: "2026-09-15",
  endDate: "2027-03-14",
  sentAt: "2026-08-14T01:00:00Z",
  signDeadlineAt: "2026-09-12T14:59:59Z", // 한국 9월 12일 23:59:59
  processedAt: "2026-08-14T01:00:00Z",
  awaitingSignature: true,
  ...over,
});

test("남은 기한은 한국 달력으로 센다 — 7일 이내만 강조", () => {
  // 한국 9월 10일 오전 9시
  const d = deadlineOf(item(), new Date("2026-09-10T00:00:00Z"));
  assert.deepEqual(d, { date: "2026년 9월 12일", daysLeft: 2, passed: false, urgent: true });
  assert.equal(deadlineText(d!, "list"), "서명 기한 2026년 9월 12일 · D-2");
  assert.equal(deadlineText(d!, "detail"), "서명 기한 2026년 9월 12일 · 2일 남음");

  // 한국 9월 5일 0시 30분(UTC 로는 9월 4일) — 7일 남아 강조, 8일이면 강조하지 않는다
  assert.equal(deadlineOf(item(), new Date("2026-09-04T15:30:00Z"))!.daysLeft, 7);
  assert.equal(deadlineOf(item(), new Date("2026-09-04T15:30:00Z"))!.urgent, true);
  assert.equal(deadlineOf(item(), new Date("2026-09-04T14:30:00Z"))!.urgent, false);
});

test("기한 당일은 D-day · 오늘까지, 지나면 지남(강조 없음)", () => {
  const today = deadlineOf(item(), new Date("2026-09-12T10:00:00Z"))!;
  assert.equal(deadlineText(today, "list"), "서명 기한 2026년 9월 12일 · D-day");
  assert.equal(deadlineText(today, "detail"), "서명 기한 2026년 9월 12일 · 오늘까지");
  const passed = deadlineOf(item(), new Date("2026-09-12T15:00:00Z"))!;
  assert.equal(passed.passed, true);
  assert.equal(passed.urgent, false);
  assert.equal(deadlineText(passed, "list"), "서명 기한 2026년 9월 12일 지남");
});

test("서명 대기가 아니거나 기한이 없으면 기한이 없다", () => {
  assert.equal(deadlineOf(item({ status: "SIGNED" }), new Date("2026-09-10T00:00:00Z")), null);
  assert.equal(deadlineOf(item({ signDeadlineAt: null }), new Date("2026-09-10T00:00:00Z")), null);
});

test("목록 둘째 줄은 상태마다 다르다", () => {
  const now = new Date("2026-10-28T00:00:00Z");
  assert.equal(contractSubText(item({ status: "SIGNED", processedAt: "2026-08-22T16:00:00Z" }), now, "체결 완료"), "서명 2026년 8월 23일");
  assert.equal(
    contractSubText(item({ status: "SIGNED", contractMethod: "PAPER", processedAt: "2026-04-02T01:00:00Z" }), now, "체결 완료"),
    "종이 계약 · 2026년 4월 2일 등록",
  );
  assert.equal(contractSubText(item({ status: "REJECTED", processedAt: "2026-06-25T01:00:00Z" }), now, "거부"), "거부 2026년 6월 25일");
  assert.equal(contractSubText(item({ status: "EXPIRED", signDeadlineAt: "2026-07-31T14:59:59Z" }), now, "만료"), "서명 기한 2026년 7월 31일 지남");
  assert.equal(contractSubText(item({ status: "ENDED", startDate: "2025-03-01", endDate: "2026-08-31" }), now, "종료"), "2025년 3월 1일 – 2026년 8월 31일");
});

test("계약 기간 — 끝이 없으면 기간 정함 없음", () => {
  assert.equal(periodText("2026-03-01", null), "2026년 3월 1일부터 · 기간 정함 없음");
  assert.equal(periodText(null, null), "-");
});

test("묶음: 서명 대기 · 수정 요청은 진행 중, 나머지는 처리 끝 — api 순서 유지", () => {
  const items = [
    item({ contractId: 1 }),
    item({ contractId: 2, status: "SIGNED" }),
    item({ contractId: 3, status: "CORRECTION_REQUESTED" }),
    item({ contractId: 4, status: "EXPIRED" }),
    item({ contractId: 5, status: "ENDED" }),
    item({ contractId: 6, status: "REJECTED" }),
  ];
  const { open, finished } = groupContracts(items);
  assert.deepEqual(open.map((c) => c.contractId), [1, 3]);
  assert.deepEqual(finished.map((c) => c.contractId), [2, 4, 5, 6]);
});

test("배지 색 — 서명 대기 경고, 거부 · 만료 오류, 체결 완료 정상, 종료 중립", () => {
  assert.equal(statusTone("PENDING_SIGNATURE"), "warning");
  assert.equal(statusTone("REJECTED"), "danger");
  assert.equal(statusTone("EXPIRED"), "danger");
  assert.equal(statusTone("SIGNED"), "success");
  assert.equal(statusTone("ENDED"), "waiting");
});

const day = (weekday: ContractWorkDay["weekday"], startTime: string, endTime: string, rest?: [string, string]): ContractWorkDay => ({
  weekday,
  startTime,
  endTime,
  breakStartTime: rest?.[0] ?? null,
  breakEndTime: rest?.[1] ?? null,
});

test("소정근로시간 표는 월~일 일곱 줄 — 근무하지 않는 날은 휴무, 주휴일은 주휴일", () => {
  const days = [day("WED", "10:00", "15:30", ["12:00", "12:30"]), day("FRI", "10:00", "15:30", ["12:00", "12:30"]), day("SAT", "09:00", "13:00")];
  const rows = weekdayRows(days, "SUN");
  assert.deepEqual(
    rows.map((r) => r.weekday),
    ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
  );
  assert.deepEqual(rows[2], { weekday: "WED", start: "10:00", end: "15:30", rest: "12:00–12:30", hours: "5시간", off: false });
  assert.deepEqual(rows[5], { weekday: "SAT", start: "09:00", end: "13:00", rest: "없음", hours: "4시간", off: false });
  assert.equal(rows[0].hours, "휴무");
  assert.equal(rows[0].off, true);
  assert.equal(rows[6].hours, "주휴일");
  assert.equal(weeklyHours(days), 14);
});

test("30분 단위 근로시간은 소수 한 자리", () => {
  assert.equal(weekdayRows([day("MON", "09:00", "17:00", ["12:00", "12:30"])], null)[0].hours, "7.5시간");
});

test("금액 · 지급일 · 수습 문구", () => {
  assert.equal(wonText(10320), "10,320원");
  assert.equal(payDayText("익월", 10), "익월 10일");
  assert.equal(payDayText("당월", 31), "당월 말일");
  assert.equal(payDayText(null, 10), null);
  assert.equal(probationText(3, 10, 10320), "3개월 · 시급의 10% 감액(수습 중 시급 9,288원)");
  assert.equal(probationText(null, null, 10320), null);
});

test("월 근로시간 줄은 값이 있는 것만", () => {
  assert.deepEqual(monthlyHourRows({ baseHours: 209, monthlyOvertimeHours: null, baseNightHours: 10.5 }), [
    ["월 기본 근로", "209시간"],
    ["기본 근로 중 야간", "10.5시간"],
  ]);
});

test("휴대전화번호는 가운데를 가린다", () => {
  assert.equal(maskPhone("01012345521"), "010-****-5521");
  assert.equal(maskPhone("010-1234-5521"), "010-****-5521");
  assert.equal(maskPhone(null), null);
});

test("종이 계약 파일은 날인본 · 임금계약서만, 날인본 먼저", () => {
  const doc = (contractDocumentId: number, kind: ContractDocument["kind"]): ContractDocument => ({ contractDocumentId, kind, fileName: `${kind}.pdf` });
  const docs = [doc(1, "WAGE_CONTRACT"), doc(2, "SIGNATURE"), doc(3, "PAPER_EMPLOYMENT_CONTRACT"), doc(4, "SENT_ORIGINAL")];
  assert.deepEqual(
    paperDocuments(docs).map((d) => d.contractDocumentId),
    [3, 1],
  );
});

test("번호는 1..2147483647 의 맨 숫자만", () => {
  assert.equal(parseId("12"), 12);
  for (const raw of ["0", "01", "-1", "1.5", "", "2147483648", "../me", undefined, ["1"]]) {
    assert.equal(parseId(raw), null, JSON.stringify(raw));
  }
});
