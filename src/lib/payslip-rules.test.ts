// node --test src/lib/payslip-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { filterYears, historyEntries, isItemShown, itemAmount, parsePayFilter, receivedMonthLabel } from "./payslip-rules.ts";
import type { PayslipItem, PayslipLog } from "./payslips.ts";

const log = (payslipLogId: number, logType: PayslipLog["logType"], changedAt: string): PayslipLog => ({ payslipLogId, logType, changedAt });

test("처리 이력은 가장 최근 발송 한 줄과 확정 취소만 — 「재발송」 줄은 없다(PAY-20)", () => {
  const logs = [
    log(1, "SEND", "2026-08-03T00:12:00Z"),
    log(2, "CANCEL_CONFIRMATION", "2026-08-19T08:40:00Z"),
    log(3, "SEND", "2026-08-20T01:05:00Z"),
  ];
  assert.deepEqual(historyEntries(logs), [
    { at: "08-20 10:05", label: "발송" },
    { at: "08-19 17:40", label: "확정 취소" },
  ]);
});

test("발송이 한 번이면 그 한 줄", () => {
  assert.deepEqual(historyEntries([log(1, "SEND", "2026-09-10T00:12:00Z")]), [{ at: "09-10 09:12", label: "발송" }]);
});

test("받은 달 라벨은 api 의 YYYY-MM 그대로 — 「9월」", () => {
  assert.equal(receivedMonthLabel("2026-09"), "9월");
  assert.equal(receivedMonthLabel("2026-10"), "10월");
});

test("연도는 한국 시간 올해부터 3년 전까지 — 1월 1일 0시(한국)는 UTC 로 전해", () => {
  assert.deepEqual(filterYears(new Date("2026-10-20T03:00:00Z")), [2026, 2025, 2024, 2023]);
  assert.deepEqual(filterYears(new Date("2026-12-31T15:30:00Z")), [2027, 2026, 2025, 2024]);
});

test("주소 필터: 없거나 고를 수 없는 연도는 올해, 숫자가 아닌 점포는 전체", () => {
  const years = [2026, 2025, 2024, 2023];
  assert.deepEqual(parsePayFilter({}, years), { storeId: undefined, year: 2026 });
  assert.deepEqual(parsePayFilter({ store: "5", year: "2024" }, years), { storeId: 5, year: 2024 });
  assert.deepEqual(parsePayFilter({ store: "abc", year: "2019" }, years), { storeId: undefined, year: 2026 });
  assert.deepEqual(parsePayFilter({ store: ["5", "6"], year: ["2025"] }, years), { storeId: undefined, year: 2026 });
});

const item = (itemCode: string, itemCategory: PayslipItem["itemCategory"], amounts: Partial<PayslipItem> = {}): PayslipItem =>
  ({ itemCode, itemCategory, itemName: itemCode, calculatedAmount: null, adjustedAmount: null, ...amounts }) as PayslipItem;

test("3.3% 를 켜면 원천징수 둘이 보이고 소득세 · 지방소득세는 빠진다, 끄면 반대", () => {
  const lines = [item("INCOME_TAX", "BASIC"), item("LOCAL_INCOME_TAX", "BASIC"), item("NATIONAL_PENSION", "BASIC"), item("WITHHOLDING_TAX", "WITHHOLDING"), item("EXTRA", "ADDITIONAL")];
  const shown = (on: boolean) => lines.filter((l) => isItemShown(l, on)).map((l) => l.itemCode);
  assert.deepEqual(shown(true), ["NATIONAL_PENSION", "WITHHOLDING_TAX", "EXTRA"]);
  assert.deepEqual(shown(false), ["INCOME_TAX", "LOCAL_INCOME_TAX", "NATIONAL_PENSION", "EXTRA"]);
});

test("줄 금액은 조정 값 → 계산 값 → 0", () => {
  assert.equal(itemAmount(item("A", "EARNING", { adjustedAmount: 0, calculatedAmount: 500 })), 0);
  assert.equal(itemAmount(item("A", "EARNING", { calculatedAmount: 500 })), 500);
  assert.equal(itemAmount(item("A", "EARNING")), 0);
});
