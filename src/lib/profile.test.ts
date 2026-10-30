// node --test src/lib/profile.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { HQ_SHARING_TERMS_VERSION, hqNotRecordedParams, hqSharingSummary, parseHqSharingVersion } from "./hq-sharing-terms.ts";
import {
  consentRequestBody,
  hqReconsentOf,
  locationNeedsReconsent,
  CONSENT_CHANGES,
  addressSaveFailure,
  consentChangeFailure,
  dateLabel,
  hasFranchiseMembership,
  hasHqSharingRecord,
  hqSharingView,
  isConsentChange,
  isPasswordStale,
  kstDateLabel,
  kstMonthDayLabel,
  membershipStatusOf,
  kstDateTimeLabel,
  parseAddress,
  type MyMembership,
} from "./profile.ts";

test("dateLabel 은 달력 날짜를 그대로 읽는다", () => {
  assert.equal(dateLabel("2025-11-03"), "2025년 11월 3일");
});

test("kstDateTimeLabel 은 한국 시각으로 바꾼다 — 자정을 넘기는 UTC 도", () => {
  assert.equal(kstDateTimeLabel("2026-03-15T00:04:00.000Z"), "2026년 3월 15일 09:04");
  assert.equal(kstDateTimeLabel("2026-12-31T15:30:00Z"), "2027년 1월 1일 00:30");
  assert.equal(kstDateLabel("2026-06-01T16:00:00Z"), "2026년 6월 2일");
});

const membership = (storeTypeCode: string) => ({ store: { storeId: 1, storeName: "강남역점", storeTypeCode } }) as MyMembership;

test("hasFranchiseMembership 은 가맹 소속이 하나라도 있으면 참", () => {
  assert.equal(hasFranchiseMembership([]), false);
  assert.equal(hasFranchiseMembership([membership("DIRECT")]), false);
  assert.equal(hasFranchiseMembership([membership("DIRECT"), membership("FRANCHISE")]), true);
});

test("parseAddress 는 다듬어 보내고 빈 상세 주소는 null", () => {
  assert.deepEqual(parseAddress(" 04044 ", " 서울 마포구 양화로 12 ", "  "), {
    ok: true,
    value: { zipCode: "04044", address: "서울 마포구 양화로 12", addressDetail: null },
  });
  assert.deepEqual(parseAddress("04044", "서울 마포구 양화로 12", " 3층 302호 "), {
    ok: true,
    value: { zipCode: "04044", address: "서울 마포구 양화로 12", addressDetail: "3층 302호" },
  });
});

test("parseAddress 는 api 가 400 으로 거를 값을 먼저 막고, 어느 칸인지 문구로 가른다", () => {
  const PICK_AGAIN = { ok: false, error: "주소를 검색해서 다시 골라 주세요" };
  assert.deepEqual(parseAddress("0404", "서울", ""), PICK_AGAIN);
  assert.deepEqual(parseAddress("04044a", "서울", ""), PICK_AGAIN);
  assert.deepEqual(parseAddress("040441", "서울", ""), PICK_AGAIN);
  assert.deepEqual(parseAddress("04044", "  ", ""), PICK_AGAIN);
  assert.deepEqual(parseAddress("04044", "가".repeat(201), ""), PICK_AGAIN);
  assert.deepEqual(parseAddress("04044", "서울", "가".repeat(101)), { ok: false, error: "상세 주소는 100자까지 넣을 수 있습니다" });
});

test("parseAddress 는 api 상한과 같은 길이(도로명 200 · 상세 100)를 받는다", () => {
  assert.equal(parseAddress("04044", "가".repeat(200), "나".repeat(100)).ok, true);
});

test("addressSaveFailure — 400 은 다시 고르게 하고 남기며, 5xx · 연결 실패는 남기지 않는다(request 가 남김)", () => {
  assert.deepEqual(addressSaveFailure({ status: 400, message: "zipCode must match" }), { error: "주소를 검색해서 다시 골라 주세요", log: true });
  assert.equal(addressSaveFailure({ status: 404, message: "Not Found" }).log, true);
  assert.equal(addressSaveFailure({ status: 500, message: "Internal server error" }).log, false);
  assert.match(addressSaveFailure("network").error, /서버에 연결하지 못했습니다/);
});

test("isConsentChange 는 정한 동작만, 프로토타입 이름은 받지 않는다", () => {
  for (const kind of Object.keys(CONSENT_CHANGES)) assert.equal(isConsentChange(kind), true);
  assert.equal(isConsentChange("toString"), false);
  assert.equal(isConsentChange("location-delete"), false);
  assert.equal(isConsentChange(1), false);
});

test("consentChangeFailure — 409 는 다시 받기, 500 한글 사유는 그대로, 그 밖은 일반 문구", () => {
  assert.deepEqual(consentChangeFailure({ status: 409, message: "이미 철회했습니다" }), {
    error: "그사이 동의 상태가 바뀌어 지금 상태를 다시 불러왔습니다",
    refresh: true,
    log: false,
  });
  // 동의 시트를 연 사이 약관이 바뀐 409 는 api 사유를 그대로(WHALEERP-628)
  const termsChanged = "그사이 위치정보 약관이 바뀌었습니다. 바뀐 약관을 확인하고 다시 동의해 주세요";
  assert.deepEqual(consentChangeFailure({ status: 409, message: termsChanged }), { error: termsChanged, refresh: true, log: false });
  // 사업자 제공 동의 문구 버전이 바뀐 409 도 api 사유(새로 고치라는 안내)를 그대로(ATT-30 v252)
  const hqChanged = "사업자 제공 동의 내용이 바뀌었습니다. 화면을 새로 고쳐 바뀐 내용을 확인한 뒤 다시 동의해 주세요.";
  assert.deepEqual(consentChangeFailure({ status: 409, message: hqChanged }), { error: hqChanged, refresh: true, log: false });
  const noTerms = "지금은 위치정보 동의를 받을 수 없습니다. 관리자에게 문의해 주세요";
  assert.deepEqual(consentChangeFailure({ status: 500, message: noTerms }), { error: noTerms, refresh: false, log: false });
  const generic = consentChangeFailure({ status: 502, message: "Bad Gateway" });
  assert.match(generic.error, /동의 상태를 바꾸지 못했습니다/);
  assert.deepEqual([generic.refresh, generic.log], [false, false]);
  assert.equal(consentChangeFailure({ status: 404, message: "Cannot POST" }).log, true);
  assert.match(consentChangeFailure("network").error, /서버에 연결하지 못했습니다/);
});

test("isPasswordStale 은 마지막 변경에서 6개월이 지나야 참", () => {
  const changed = "2026-04-20T03:00:00.000Z";
  assert.equal(isPasswordStale(changed, new Date("2026-10-20T02:59:59.000Z")), false);
  assert.equal(isPasswordStale(changed, new Date("2026-10-20T03:00:00.000Z")), true);
  assert.equal(isPasswordStale("2026-10-20T00:00:00Z", new Date("2026-10-20T09:00:00Z")), false);
  // 월말: 8월 31일 → 2월 말일(2027-02-28), 3월로 넘치지 않는다.
  assert.equal(isPasswordStale("2026-08-31T00:00:00Z", new Date("2027-02-28T00:00:00Z")), true);
  assert.equal(isPasswordStale("2026-08-31T00:00:00Z", new Date("2027-02-27T23:59:59Z")), false);
  // 윤년: 2027-08-31 → 2028-02-29.
  assert.equal(isPasswordStale("2027-08-31T00:00:00Z", new Date("2028-02-29T00:00:00Z")), true);
  assert.equal(isPasswordStale("2027-08-31T00:00:00Z", new Date("2028-02-28T23:59:59Z")), false);
  // 읽을 수 없는 값이면 권하지 않는다.
  assert.equal(isPasswordStale("not-a-date", new Date("2030-01-01T00:00:00Z")), false);
});

test("membershipStatusOf 는 퇴직일이 오늘보다 앞일 때만 퇴직이다 — 퇴직일 당일까지는 퇴직 예정", () => {
  assert.equal(membershipStatusOf(null, "2026-10-28"), "working");
  assert.equal(membershipStatusOf("2026-10-28", "2026-10-28"), "retiring");
  assert.equal(membershipStatusOf("2026-11-01", "2026-10-28"), "retiring");
  assert.equal(membershipStatusOf("2026-10-27", "2026-10-28"), "retired");
  // 해가 바뀌어도 문자열 비교가 날짜 순서와 같다.
  assert.equal(membershipStatusOf("2025-12-31", "2026-01-01"), "retired");
});

test("kstMonthDayLabel 은 한국 날짜와 요일 — UTC 로는 전날이어도 한국 날짜로", () => {
  assert.equal(kstMonthDayLabel("2026-09-02T03:00:00.000Z"), "9월 2일 (수)");
  assert.equal(kstMonthDayLabel("2026-10-01T16:30:00.000Z"), "10월 2일 (금)");
});

test("hqSharingView — 옛 문구 버전에 동의했으면 「다시 동의 필요」 · 다시 동의하기 · 시트에서 동의(ATT-30, api #183)", () => {
  const base = { isConsented: true, agreedAt: "2026-10-01T01:00:00Z", withdrawnAt: null, consentVersion: "v1.0", needsReconsent: false };
  const agreed = hqSharingView(base);
  assert.deepEqual(agreed.badge, { tone: "success", text: "동의함" });
  assert.deepEqual(agreed.action, { kind: "withdraw" });
  // 동의 일시가 없는 옛 행도 동의로 보인다
  assert.equal(hqSharingView({ ...base, agreedAt: null }).line, "동의했습니다");
  const stale = hqSharingView({ ...base, needsReconsent: true });
  assert.deepEqual(stale.badge, { tone: "warning", text: "다시 동의 필요" });
  // 새 문구에 동의하지 않으려면 카드에서 옛 동의를 거둘 수 있다
  assert.deepEqual(stale.action, { kind: "agree", label: "다시 동의하기", alsoWithdraw: true });
  assert.equal(hqSharingView({ ...base, agreedAt: null, needsReconsent: true }).line, "동의 내용이 바뀌어 다시 동의해야 합니다");
  assert.match(stale.line, /v1\.0 — 동의 내용이 바뀌어 다시 동의해야 합니다$/);
  assert.match(stale.note, /점포별 숫자로만/);
});

test("hqSharingView — 미동의 · 철회 뒤는 동의하기 · 다시 동의하기", () => {
  const base = { isConsented: false, agreedAt: null, withdrawnAt: null, consentVersion: null, needsReconsent: false };
  const none = hqSharingView(base);
  assert.deepEqual(none.badge, { tone: "plain", text: "동의하지 않음" });
  assert.equal(none.line, "아직 동의하지 않았습니다");
  assert.deepEqual(none.action, { kind: "agree", label: "동의하기", alsoWithdraw: false });
  // 처음이면 「다시」 없이
  assert.match(none.note, / 동의하면 개인 단위로/);
  assert.doesNotMatch(none.note, /다시 동의하면/);
  const withdrawn = hqSharingView({ ...base, withdrawnAt: "2026-10-02T01:00:00Z", consentVersion: "v1.0" });
  assert.deepEqual(withdrawn.action, { kind: "agree", label: "다시 동의하기", alsoWithdraw: false });
  assert.match(withdrawn.line, /철회 · 사업자 제공 동의 v1\.0$/);
});

test("hasHqSharingRecord — 동의 중 · 철회함이면 참, 한 번도 동의하지 않았으면 거짓(소속을 못 받았을 때 카드)", () => {
  // 다시 동의 · 철회에 성공해도 참이라 카드 · 토스트가 사라지지 않는다
  assert.equal(hasHqSharingRecord({ isConsented: true, withdrawnAt: null }), true);
  assert.equal(hasHqSharingRecord({ isConsented: false, withdrawnAt: "2026-10-02T01:00:00Z" }), true);
  assert.equal(hasHqSharingRecord({ isConsented: false, withdrawnAt: null }), false);
});

test("hqReconsentOf 는 동의 중 · 다시 동의 필요 · 가맹 소속이 있을 때만 보이는 문구 버전을 키로 준다", () => {
  const franchise = [membership("FRANCHISE")];
  const direct = [membership("DIRECT")];
  // 키는 팝업이 보이는 문구 버전 — 직원이 동의한 옛 버전이 아니다
  assert.deepEqual(hqReconsentOf({ isConsented: true, needsReconsent: true, consentVersion: "v0.9" }, franchise), { key: HQ_SHARING_TERMS_VERSION });
  assert.deepEqual(hqReconsentOf({ isConsented: true, needsReconsent: true, consentVersion: null }, franchise), { key: HQ_SHARING_TERMS_VERSION });
  assert.equal(hqReconsentOf({ isConsented: true, needsReconsent: false, consentVersion: "v1.0" }, franchise), null);
  // 철회한 계정은 다시 동의를 묻지 않는다
  assert.equal(hqReconsentOf({ isConsented: false, needsReconsent: true, consentVersion: "v1.0" }, franchise), null);
  // 가맹 소속이 없거나(퇴직 — 내 정보에 카드가 없어 철회할 길이 없다) 소속을 못 받았으면 묻지 않는다
  assert.equal(hqReconsentOf({ isConsented: true, needsReconsent: true, consentVersion: "v1.0" }, direct), null);
  assert.equal(hqReconsentOf({ isConsented: true, needsReconsent: true, consentVersion: "v1.0" }, null), null);
});

test("locationNeedsReconsent 는 동의 · 일시 중지에서 약관이 바뀌었을 때만 참", () => {
  assert.equal(locationNeedsReconsent({ state: "AGREED", needsReconsent: true }), true);
  assert.equal(locationNeedsReconsent({ state: "PAUSED", needsReconsent: true }), true);
  assert.equal(locationNeedsReconsent({ state: "AGREED", needsReconsent: false }), false);
  assert.equal(locationNeedsReconsent({ state: "WITHDRAWN", needsReconsent: true }), false);
});

test("consentRequestBody 는 위치정보 · 사업자 제공 동의에 화면이 보인 버전을 싣고 나머지는 본문이 없다", () => {
  assert.deepEqual(consentRequestBody("location-agree", "v2"), { termsVersion: "v2" });
  assert.deepEqual(consentRequestBody("location-agree", null), { termsVersion: null });
  assert.deepEqual(consentRequestBody("hq-sharing-agree", HQ_SHARING_TERMS_VERSION), { consentVersion: HQ_SHARING_TERMS_VERSION });
  assert.equal(consentRequestBody("hq-sharing-withdraw", "v1.0"), undefined);
  assert.equal(consentRequestBody("location-pause", undefined), undefined);
});

test("parseHqSharingVersion 은 비지 않은 64자 이하 문자열만 받는다", () => {
  assert.equal(parseHqSharingVersion("v1.0"), "v1.0");
  for (const raw of [null, "", "v".repeat(65), 1, undefined]) assert.equal(parseHqSharingVersion(raw), undefined);
});

test("hqSharingSummary 는 흐름 이름에 맞는 조사를 쓴다", () => {
  assert.match(hqSharingSummary("signup"), /동의하지 않아도 가입과 근무는/);
  assert.match(hqSharingSummary("addStore"), /동의하지 않아도 근무지 추가와 근무는/);
  assert.match(hqSharingSummary("affiliation"), /동의하지 않아도 소속 추가와 근무는/);
});

test("hqNotRecordedParams 는 동의를 남기지 못했을 때(false)만 싣는다 — null · true 는 싣지 않는다", () => {
  assert.deepEqual(hqNotRecordedParams(false), { hq: "not-recorded" });
  assert.deepEqual(hqNotRecordedParams(null), {});
  assert.deepEqual(hqNotRecordedParams(true), {});
  assert.deepEqual(hqNotRecordedParams(undefined), {});
});
