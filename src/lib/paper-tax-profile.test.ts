// node --test src/lib/paper-tax-profile.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { paperSignedMemberships, taxProfileDueOf, taxProfileNewHref } from "./paper-tax-profile.ts";

const TODAY = "2026-11-27";
const member = (staffMemberId: number, storeId: number, retiredDate: string | null = null) => ({ staffMemberId, store: { storeId }, retiredDate });
const contract = (storeId: number, contractMethod: "PAPER" | "ELECTRONIC" | null, status: "SIGNED" | "PENDING_SIGNATURE" | "ENDED" = "SIGNED") => ({
  storeId,
  contractMethod,
  status,
});

test("서명 완료된 종이 계약이 있는 소속은 대상이다", () => {
  assert.deepEqual(paperSignedMemberships([member(1, 10)], [contract(10, "PAPER")], TODAY), [member(1, 10)]);
});

test("전자계약만 있는 소속은 대상이 아니다", () => {
  assert.deepEqual(paperSignedMemberships([member(1, 10)], [contract(10, "ELECTRONIC")], TODAY), []);
});

test("서명 완료가 아닌 종이 계약 · 계약 방식이 없는 계약은 대상이 아니다", () => {
  assert.deepEqual(paperSignedMemberships([member(1, 10)], [contract(10, "PAPER", "ENDED"), contract(10, null)], TODAY), []);
});

test("퇴직한 소속은 대상이 아니고 퇴직 예정 소속은 대상이다", () => {
  const retired = member(1, 10, "2026-11-26");
  const retiring = member(2, 20, TODAY);
  assert.deepEqual(paperSignedMemberships([retired, retiring], [contract(10, "PAPER"), contract(20, "PAPER")], TODAY), [retiring]);
});

test("다른 근무지의 종이 계약은 그 소속을 대상으로 만들지 않는다 · 소속 순서를 지킨다", () => {
  const a = member(1, 10);
  const b = member(2, 20);
  const c = member(3, 30);
  assert.deepEqual(paperSignedMemberships([a, b, c], [contract(30, "PAPER"), contract(10, "PAPER"), contract(20, "ELECTRONIC")], TODAY), [a, c]);
});

test("신고 정보를 내지 않은 재직 소속만 안내하고 조회 실패는 keepUnknown 을 따른다", () => {
  assert.equal(taxProfileDueOf({ taxProfile: null, editable: true }, false), true);
  assert.equal(taxProfileDueOf({ taxProfile: null }, false), true);
  assert.equal(taxProfileDueOf({ taxProfile: { bankCode: "004" }, editable: true }, true), false);
  assert.equal(taxProfileDueOf({ taxProfile: null, editable: false }, true), false);
  assert.equal(taxProfileDueOf(null, true), true);
  assert.equal(taxProfileDueOf(null, false), false);
});

test("처음 넣기 화면 주소", () => {
  assert.equal(taxProfileNewHref(7), "/me/memberships/7/tax-profile/new");
});
