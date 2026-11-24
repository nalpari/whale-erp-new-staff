// node --test src/lib/payslip-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterYears,
  historyEntries,
  isItemShown,
  itemAmount,
  parsePayFilter,
  parsePayslipId,
  payslipDownloadAlert,
  payslipDownloadFailure,
  payslipFailurePath,
  payslipKeepQuery,
  receivedMonthLabel,
  receivedYears,
} from "./payslip-rules.ts";
import type { PayslipItem, PayslipLog } from "./payslips.ts";

const log = (payslipLogId: number, logType: PayslipLog["logType"], changedAt: string): PayslipLog => ({ payslipLogId, logType, changedAt });

test("처리 내역은 가장 최근 발송 한 줄(「다시 발송」)과 확정 취소만 — 「재발송」 줄을 따로 두지 않는다(PAY-20)", () => {
  const logs = [
    log(1, "SEND", "2026-08-03T00:12:00Z"),
    log(2, "CANCEL_CONFIRMATION", "2026-08-19T08:40:00Z"),
    log(3, "SEND", "2026-08-20T01:05:00Z"),
  ];
  assert.deepEqual(historyEntries(logs), [
    { at: "8월 20일 10:05", label: "다시 발송" },
    { at: "8월 19일 17:40", label: "정정을 위해 확정 취소" },
  ]);
});

test("발송이 한 번이면 그 한 줄", () => {
  assert.deepEqual(historyEntries([log(1, "SEND", "2026-09-10T00:12:00Z")]), [{ at: "9월 10일 09:12", label: "발송" }]);
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

test("명세서 번호는 1..2147483647 의 맨 숫자만 — 주소를 더럽히는 값은 null", () => {
  assert.equal(parsePayslipId("1"), 1);
  assert.equal(parsePayslipId("2147483647"), 2147483647);
  for (const raw of ["0", "01", "-1", "1.5", "1e3", " 1", "", "2147483648", "../me", "1/pdf", "1?x", "1\n"]) {
    assert.equal(parsePayslipId(raw), null, JSON.stringify(raw));
  }
});

test("받은 해만 고른다 — 보관 범위 안, 최신순, 없으면 올해 하나", () => {
  const allowed = [2026, 2025, 2024, 2023];
  assert.deepEqual(receivedYears(["2026-11-01", "2026-10-01"], allowed), [2026]);
  assert.deepEqual(receivedYears(["2024-12-01", "2026-01-01", "2022-05-01"], allowed), [2026, 2024, 2022]);
  assert.deepEqual(receivedYears([], allowed), [2026]);
});

test("PDF 받기 실패 까닭: 404 는 notfound, 409 는 reviewing, 그 밖은 failed", () => {
  assert.equal(payslipDownloadFailure(404), "notfound");
  assert.equal(payslipDownloadFailure(409), "reviewing");
  assert.equal(payslipDownloadFailure(500), "failed");
  assert.equal(payslipDownloadFailure(502), "failed");
});

test("PDF 받기 실패 안내는 정한 값만 받는다(프로토타입 이름 · 배열 막기)", () => {
  assert.match(payslipDownloadAlert("failed") ?? "", /내려받지 못했습니다/);
  assert.match(payslipDownloadAlert("reviewing") ?? "", /다시 검토/);
  assert.equal(payslipDownloadAlert("toString"), null);
  assert.equal(payslipDownloadAlert(["failed"]), null);
  assert.equal(payslipDownloadAlert(undefined), null);
});

test("상세로 돌아갈 때 이어 줄 주소 값은 from=notifications 또는 from=sites 와 숫자 store 만", () => {
  const get = (q: Record<string, string>) => (name: string) => q[name] ?? null;
  assert.equal(payslipKeepQuery(get({ from: "notifications" })), "?from=notifications");
  assert.equal(payslipKeepQuery(get({ from: "sites", store: "12" })), "?from=sites&store=12");
  assert.equal(payslipKeepQuery(get({ from: "sites", store: "x" })), "");
  assert.equal(payslipKeepQuery(get({ from: "evil", store: "12" })), "");
  assert.equal(payslipKeepQuery(get({})), "");
});

test("받기 실패 주소는 앱이 알아보는 /pay/<id>?download= 모양이고 이어 줄 값 뒤에 붙는다", () => {
  assert.equal(payslipFailurePath(12, "", "failed"), "/pay/12?download=failed");
  assert.equal(payslipFailurePath(12, "?from=notifications", "reviewing"), "/pay/12?from=notifications&download=reviewing");
  const keep = payslipKeepQuery((name) => ({ from: "sites", store: "7" })[name]);
  assert.equal(payslipFailurePath(12, keep, "notfound"), "/pay/12?from=sites&store=7&download=notfound");
});
