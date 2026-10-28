// node --test src/lib/profile.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONSENT_CHANGES,
  addressSaveFailure,
  consentChangeFailure,
  dateLabel,
  hasFranchiseMembership,
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
