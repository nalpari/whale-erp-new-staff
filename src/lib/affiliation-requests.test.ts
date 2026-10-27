// node --test src/lib/affiliation-requests.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_FAILED, RATE_LIMITED } from "./action-errors.ts";
import { answerFailure, employmentLine, parseRejectReason, popupSummary, type AffiliationRequest } from "./affiliation-requests.ts";

test("parseRejectReason 은 다듬고, 비면 보내지 않는다", () => {
  assert.deepEqual(parseRejectReason("  다른 곳에서 일하고 있어요 "), { ok: true, reason: "다른 곳에서 일하고 있어요" });
  assert.deepEqual(parseRejectReason("   "), { ok: true, reason: undefined });
});

test("parseRejectReason 은 500자까지 받고 넘으면 막는다", () => {
  assert.equal(parseRejectReason("가".repeat(500)).ok, true);
  assert.deepEqual(parseRejectReason("가".repeat(501)), { ok: false, error: "거절 사유는 500자 이하로 입력해 주세요" });
});

test("answerFailure 는 code 로 더 답할 수 없는 요청을 가른다", () => {
  const title = (status: number, code?: string) => {
    const { state } = answerFailure({ status, message: "", code });
    return state.step === "closed" ? state.title : null;
  };
  assert.equal(title(409, "AFFILIATION_REQUEST_ANSWERED"), "이미 답한 요청입니다");
  assert.equal(title(404, "AFFILIATION_REQUEST_ENDED"), "끝난 요청입니다");
  assert.equal(title(404, "AFFILIATION_REQUEST_NOT_FOUND"), "요청을 찾을 수 없습니다");
  // 재직 중 409 에는 code 가 없다
  assert.equal(title(409), "이미 이 점포에서 일하고 있습니다");
});

test("answerFailure 는 다시 누를 수 있는 실패를 입력 상태로 두고, 예상 밖 4xx 만 남긴다", () => {
  assert.deepEqual(answerFailure("network"), { state: { step: "input", error: CONNECTION_FAILED }, log: false });
  assert.deepEqual(answerFailure({ status: 429, message: "" }), { state: { step: "input", error: RATE_LIMITED }, log: false });
  assert.equal(answerFailure({ status: 400, message: "" }).log, true);
  assert.equal(answerFailure({ status: 503, message: "" }).log, false);
  assert.equal(answerFailure({ status: 503, message: "" }).state.step, "input");
});

const request = (invitationId: number, storeName: string): AffiliationRequest => ({
  invitationId,
  invitationType: "AFFILIATION_CONFIRM",
  storeName,
  bpName: "웨일카페",
  employmentType: "PART_TIME",
  employmentTypeLabel: "파트타이머",
  jobTitle: null,
  sentAt: "2026-10-26T00:00:00Z",
  expiresAt: "2026-11-25T00:00:00Z",
  asksHqSharingConsent: false,
});

test("popupSummary 는 첫 요청과 나머지 수를, 없으면 null 을 준다", () => {
  assert.equal(popupSummary([]), null);
  assert.deepEqual(popupSummary([request(9, "홍대점"), request(3, "강남역점")]), {
    storeName: "홍대점",
    employmentTypeLabel: "파트타이머",
    others: 1,
    key: "3,9",
  });
});

test("employmentLine 은 고용 형태 · 직무를 잇고 빈 값은 뺀다", () => {
  assert.equal(employmentLine({ employmentTypeLabel: "파트타이머", jobTitle: "바리스타" }), "파트타이머 · 바리스타");
  assert.equal(employmentLine({ employmentTypeLabel: "정직원", jobTitle: null }), "정직원");
  assert.equal(employmentLine({ employmentTypeLabel: null, jobTitle: null }), "고용 형태 미정");
});
