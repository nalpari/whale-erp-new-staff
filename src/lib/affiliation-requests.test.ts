// node --test src/lib/affiliation-requests.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_FAILED, RATE_LIMITED } from "./action-errors.ts";
import {
  contractHrefOf,
  ALREADY_EMPLOYED,
  answerFailure,
  contentOf,
  employmentLine,
  invitationTypeLabel,
  isPopupDismissed,
  mergeSeenKey,
  parseResult,
  parseRejectReason,
  popupSummary,
  requestsLoadFailure,
  resultHref,
  type AffiliationRequest,
  type AnswerResult,
} from "./affiliation-requests.ts";

test("parseRejectReason 은 다듬고, 비면 보내지 않는다", () => {
  assert.deepEqual(parseRejectReason("  다른 곳에서 일하고 있어요 "), { ok: true, reason: "다른 곳에서 일하고 있어요" });
  assert.deepEqual(parseRejectReason("   "), { ok: true, reason: undefined });
});

test("parseRejectReason 은 500자까지 받고 넘으면 막는다", () => {
  assert.equal(parseRejectReason("가".repeat(500)).ok, true);
  assert.deepEqual(parseRejectReason("가".repeat(501)), { ok: false, error: "거절 사유는 500자 이하로 입력해 주세요" });
});

const ERROR = { state: { error: "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요" }, log: true };

test("answerFailure 는 code 로 더 답할 수 없는 요청을 결과로 보낸다 — 수락 · 거절 같다", () => {
  for (const answer of ["accept", "reject"] as const) {
    const closed = (status: number, code: string) => answerFailure({ status, message: "", code }, answer);
    assert.deepEqual(closed(409, "AFFILIATION_REQUEST_ANSWERED"), { result: { kind: "closed", reason: "answered" }, log: false });
    assert.deepEqual(closed(404, "AFFILIATION_REQUEST_ENDED"), { result: { kind: "closed", reason: "ended" }, log: false });
    assert.deepEqual(closed(404, "AFFILIATION_REQUEST_NOT_FOUND"), { result: { kind: "closed", reason: "notFound" }, log: false });
  }
});

test("answerFailure 는 수락의 code 없는 409(이 점포에 재직 중)만 수락을 막고 거절은 남긴다", () => {
  assert.deepEqual(answerFailure({ status: 409, message: "이 점포에 이미 재직 중입니다" }, "accept"), {
    state: { error: ALREADY_EMPLOYED, acceptBlocked: true },
    log: false,
  });
});

test("answerFailure 는 거절의 code 없는 409 를 재직 중 안내 없이 일반 오류로 두고 남긴다", () => {
  assert.deepEqual(answerFailure({ status: 409, message: "Conflict" }, "reject"), ERROR);
});

test("answerFailure 는 code 없는 404(라우트 없음 · api 배포 전)를 끝난 화면이 아니라 다시 누를 수 있는 오류로 두고 남긴다", () => {
  for (const answer of ["accept", "reject"] as const)
    assert.deepEqual(answerFailure({ status: 404, message: "Cannot POST /me/affiliation-requests/3/accept" }, answer), ERROR);
});

test("answerFailure 는 다시 누를 수 있는 실패를 확인 화면 상태로 두고, 예상 밖 4xx 만 남긴다", () => {
  assert.deepEqual(answerFailure("network", "accept"), { state: { error: CONNECTION_FAILED }, log: false });
  assert.deepEqual(answerFailure({ status: 429, message: "" }, "reject"), { state: { error: RATE_LIMITED }, log: false });
  assert.equal(answerFailure({ status: 400, message: "" }, "reject").log, true);
  assert.deepEqual(answerFailure({ status: 503, message: "" }, "accept"), { ...ERROR, log: false });
});

const query = (href: string) => Object.fromEntries(new URL(href, "http://x").searchParams);

test("resultHref · parseResult 는 결과를 주소로 실었다 그대로 되읽는다", () => {
  const results: AnswerResult[] = [
    { kind: "accepted", contractIds: [12], hqNotRecorded: false },
    { kind: "accepted", contractIds: [12, 34], hqNotRecorded: false },
    { kind: "accepted", contractIds: [], hqNotRecorded: false },
    { kind: "rejected" },
    { kind: "closed", reason: "answered" },
    { kind: "closed", reason: "ended" },
    { kind: "closed", reason: "notFound" },
  ];
  for (const result of results) {
    const href = resultHref(result);
    assert.ok(href.startsWith("/affiliations/done?"));
    assert.deepEqual(parseResult(query(href)), result);
  }
});

test("resultHref 는 점포 이름을 싣지 않고 계약 ID 를 쉼표로 20개까지 싣는다", () => {
  assert.equal(resultHref({ kind: "accepted", contractIds: [12, 34], hqNotRecorded: false }), "/affiliations/done?result=accepted&contractIds=12%2C34");
  assert.equal(resultHref({ kind: "accepted", contractIds: [], hqNotRecorded: false }), "/affiliations/done?result=accepted&contractIds=");
  const many = Array.from({ length: 25 }, (_, i) => i + 1);
  assert.deepEqual(parseResult(query(resultHref({ kind: "accepted", contractIds: many, hqNotRecorded: false }))), { kind: "accepted", contractIds: many.slice(0, 20), hqNotRecorded: false });
});

test("resultHref 는 읽는 쪽과 같은 기준으로 계약 ID 를 걸러 수락 결과가 늘 되읽힌다", () => {
  const href = resultHref({ kind: "accepted", contractIds: [12, 0, 2147483648, 34], hqNotRecorded: false });
  assert.deepEqual(parseResult(query(href)), { kind: "accepted", contractIds: [12, 34], hqNotRecorded: false });
});

test("겹친 계약 ID 는 하나로 — 한 계약이 목록으로 가지 않는다", () => {
  assert.equal(resultHref({ kind: "accepted", contractIds: [12, 12], hqNotRecorded: false }), "/affiliations/done?result=accepted&contractIds=12");
  assert.deepEqual(parseResult({ result: "accepted", contractIds: "12,12" }), { kind: "accepted", contractIds: [12], hqNotRecorded: false });
});

test("contractHrefOf 는 계약이 하나면 그 계약서, 여럿이면 목록, 없으면 null", () => {
  assert.equal(contractHrefOf([12]), "/contracts/12");
  assert.equal(contractHrefOf([12, 34]), "/contracts");
  assert.equal(contractHrefOf([]), null);
  // 근무지를 알면 그 근무지로 거른다
  assert.equal(contractHrefOf([12], 5), "/contracts/12?store=5");
  assert.equal(contractHrefOf([12, 34], 5), "/contracts?store=5");
  assert.equal(contractHrefOf([], 5), null);
});

test("parseResult 는 정한 값만 받고 나머지는 null", () => {
  assert.equal(parseResult({}), null);
  assert.equal(parseResult({ result: "deleted" }), null);
  assert.equal(parseResult({ result: ["rejected", "rejected"] }), null);
  assert.equal(parseResult({ result: "closed", reason: "toString" }), null);
  assert.equal(parseResult({ result: "accepted", contractIds: "-1" }), null);
  assert.equal(parseResult({ result: "accepted", contractIds: "1e2" }), null);
  assert.equal(parseResult({ result: "accepted", contractIds: "0" }), null);
  assert.equal(parseResult({ result: "accepted", contractIds: "12,,34" }), null);
  assert.equal(parseResult({ result: "accepted", contractIds: "2147483648" }), null);
  assert.equal(parseResult({ result: "accepted", contractIds: Array.from({ length: 21 }, (_, i) => i + 1).join(",") }), null);
  assert.equal(parseResult({ result: "accepted" }), null);
  // 계약 수를 싣던 예전 주소(contracts=)는 받지 않는다 — 수를 ID 로 읽지 않게
  assert.equal(parseResult({ result: "accepted", contracts: "1" }), null);
  // 점포 이름은 받지 않는다 — 남이 만든 링크의 글이 결과에 실리지 않는다
  assert.deepEqual(parseResult({ result: "accepted", store: "가짜 점포", contractIds: "1" }), { kind: "accepted", contractIds: [1], hqNotRecorded: false });
});

test("contentOf 는 결과마다 제목 · 설명을 주고, 수락이면 쿠키의 점포 이름을 넣는다", () => {
  assert.equal(contentOf({ kind: "accepted", contractIds: [1], hqNotRecorded: false }, "홍대점").title, "홍대점 소속이 추가되었습니다");
  assert.equal(contentOf({ kind: "accepted", contractIds: [1], hqNotRecorded: false }).title, "소속이 추가되었습니다");
  assert.equal(contentOf({ kind: "rejected" }, "홍대점").title, "소속 추가를 거절했습니다");
  assert.equal(contentOf({ kind: "closed", reason: "ended" }).title, "끝난 요청입니다");
  assert.equal(contentOf({ kind: "closed", reason: "answered" }).title, "이미 답한 요청입니다");
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

test("사업자 제공 동의를 남기지 못함은 정한 값 하나로만 싣고 되읽는다(ATT-30 v253)", () => {
  assert.equal(
    resultHref({ kind: "accepted", contractIds: [1], hqNotRecorded: true }),
    "/affiliations/done?result=accepted&contractIds=1&hq=not-recorded",
  );
  // 다른 값 · 여러 번 실린 값은 거짓 — 안내 한 줄이라 결과는 그대로 받는다
  for (const hq of ["yes", "NOT-RECORDED", ["not-recorded", "not-recorded"]])
    assert.deepEqual(parseResult({ result: "accepted", contractIds: "1", hq }), { kind: "accepted", contractIds: [1], hqNotRecorded: false });
  assert.deepEqual(parseResult({ result: "accepted", contractIds: "1", hq: "not-recorded" }), { kind: "accepted", contractIds: [1], hqNotRecorded: true });
});
