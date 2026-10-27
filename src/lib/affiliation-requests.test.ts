// node --test src/lib/affiliation-requests.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_FAILED, RATE_LIMITED } from "./action-errors.ts";
import {
  ALREADY_EMPLOYED,
  answerFailure,
  employmentLine,
  invitationTypeLabel,
  isPopupDismissed,
  mergeSeenKey,
  parseRejectReason,
  popupSummary,
  requestsLoadFailure,
  type AffiliationRequest,
} from "./affiliation-requests.ts";

test("parseRejectReason 은 다듬고, 비면 보내지 않는다", () => {
  assert.deepEqual(parseRejectReason("  다른 곳에서 일하고 있어요 "), { ok: true, reason: "다른 곳에서 일하고 있어요" });
  assert.deepEqual(parseRejectReason("   "), { ok: true, reason: undefined });
});

test("parseRejectReason 은 500자까지 받고 넘으면 막는다", () => {
  assert.equal(parseRejectReason("가".repeat(500)).ok, true);
  assert.deepEqual(parseRejectReason("가".repeat(501)), { ok: false, error: "거절 사유는 500자 이하로 입력해 주세요" });
});

const ERROR = { step: "input", error: "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };

test("answerFailure 는 code 로 더 답할 수 없는 요청을 가른다 — 수락 · 거절 같다", () => {
  for (const answer of ["accept", "reject"] as const) {
    const title = (status: number, code?: string) => {
      const { state } = answerFailure({ status, message: "", code }, answer);
      return state.step === "closed" ? state.title : null;
    };
    assert.equal(title(409, "AFFILIATION_REQUEST_ANSWERED"), "이미 답한 요청입니다");
    assert.equal(title(404, "AFFILIATION_REQUEST_ENDED"), "끝난 요청입니다");
    assert.equal(title(404, "AFFILIATION_REQUEST_NOT_FOUND"), "요청을 찾을 수 없습니다");
  }
});

test("answerFailure 는 수락의 code 없는 409(이 점포에 재직 중)만 수락을 막고 거절은 남긴다", () => {
  assert.deepEqual(answerFailure({ status: 409, message: "이 점포에 이미 재직 중입니다" }, "accept"), {
    state: { step: "input", error: ALREADY_EMPLOYED, acceptBlocked: true },
    log: false,
  });
});

test("answerFailure 는 거절의 code 없는 409 를 재직 중 안내 없이 일반 오류로 두고 남긴다", () => {
  assert.deepEqual(answerFailure({ status: 409, message: "Conflict" }, "reject"), { state: ERROR, log: true });
});

test("answerFailure 는 code 없는 404(라우트 없음 · api 배포 전)를 끝난 화면이 아니라 다시 누를 수 있는 오류로 두고 남긴다", () => {
  for (const answer of ["accept", "reject"] as const)
    assert.deepEqual(answerFailure({ status: 404, message: "Cannot POST /me/affiliation-requests/3/accept" }, answer), { state: ERROR, log: true });
});

test("answerFailure 는 다시 누를 수 있는 실패를 입력 상태로 두고, 예상 밖 4xx 만 남긴다", () => {
  assert.deepEqual(answerFailure("network", "accept"), { state: { step: "input", error: CONNECTION_FAILED }, log: false });
  assert.deepEqual(answerFailure({ status: 429, message: "" }, "reject"), { state: { step: "input", error: RATE_LIMITED }, log: false });
  assert.equal(answerFailure({ status: 400, message: "" }, "reject").log, true);
  assert.equal(answerFailure({ status: 503, message: "" }, "accept").log, false);
  assert.equal(answerFailure({ status: 503, message: "" }, "accept").state.step, "input");
});

test("invitationTypeLabel 은 복귀 확인과 소속 추가 요청을 가른다", () => {
  assert.equal(invitationTypeLabel({ invitationType: "RETURN_CONFIRM" }), "복귀 확인");
  assert.equal(invitationTypeLabel({ invitationType: "AFFILIATION_CONFIRM" }), "소속 추가 요청");
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

test("popupSummary 는 요청이 없으면 null", () => {
  assert.equal(popupSummary([]), null);
});

test("popupSummary 는 요청이 하나면 점포와 고용 형태 · 직무 줄을 준다", () => {
  assert.deepEqual(popupSummary([{ ...request(9, "홍대점"), jobTitle: "바리스타" }]), {
    rows: [
      { label: "점포", value: "홍대점" },
      { label: "고용 형태", value: "파트타이머 · 바리스타" },
    ],
    key: "9",
  });
  assert.equal(popupSummary([{ ...request(9, "홍대점"), employmentTypeLabel: null }])?.rows[1].value, "고용 형태 미정");
});

test("popupSummary 는 요청이 여럿이면 첫 점포 「외 N곳」과 요청 수를 준다", () => {
  assert.deepEqual(popupSummary([request(9, "홍대점"), request(3, "강남역점")]), {
    rows: [
      { label: "점포", value: "홍대점 외 1곳" },
      { label: "요청", value: "2건" },
    ],
    key: "3,9",
  });
});

test("employmentLine 은 고용 형태 · 직무를 잇고 빈 값은 뺀다", () => {
  assert.equal(employmentLine({ employmentTypeLabel: "파트타이머", jobTitle: "바리스타" }), "파트타이머 · 바리스타");
  assert.equal(employmentLine({ employmentTypeLabel: "정직원", jobTitle: null }), "정직원");
  assert.equal(employmentLine({ employmentTypeLabel: null, jobTitle: null }), "고용 형태 미정");
});

test("isPopupDismissed 는 지금 요청이 모두 이미 본 요청일 때만 닫아 둔다", () => {
  assert.equal(isPopupDismissed("3,9", null), false);
  assert.equal(isPopupDismissed("3,9", "3,9"), true);
  // 하나에 답해 줄었으면 그대로 닫혀 있다
  assert.equal(isPopupDismissed("9", "3,9"), true);
  // 새 요청이 오면 다시 뜬다
  assert.equal(isPopupDismissed("3,9,12", "3,9"), false);
  assert.equal(isPopupDismissed("12", "3,9"), false);
});

test("mergeSeenKey 는 본 요청에 지금 요청을 더한다", () => {
  assert.equal(mergeSeenKey("3,9", null), "3,9");
  assert.equal(mergeSeenKey("12", "3,9"), "3,9,12");
  assert.equal(mergeSeenKey("9", "3,9"), "3,9");
});

test("requestsLoadFailure 는 api 실패를 모두 화면을 깨지 않는 null 로, 그 밖(401 redirect · 결함)은 던지게 한다", () => {
  assert.equal(requestsLoadFailure(null), "throw");
  // api 배포 전 404 같은 예상 밖 4xx 는 남긴다
  assert.equal(requestsLoadFailure({ status: 404, message: "Cannot GET /me/affiliation-requests" }), "log");
  assert.equal(requestsLoadFailure({ status: 403, message: "Forbidden" }), "log");
  // 5xx · 연결 실패는 request() 가 이미 남겼다
  assert.equal(requestsLoadFailure({ status: 503, message: "" }), "ignore");
  assert.equal(requestsLoadFailure("network"), "ignore");
});
