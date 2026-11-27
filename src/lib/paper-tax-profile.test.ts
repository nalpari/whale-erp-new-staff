// node --test src/lib/paper-tax-profile.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { allPaper, paperSignedMemberships, paperTaxProfileConfirmed, taxProfileDueMemberships, taxProfileNewHref } from "./paper-tax-profile.ts";

const TODAY = "2026-11-27";
const member = (staffMemberId: number, retiredDate: string | null = null) => ({ staffMemberId, retiredDate });
const contract = (
  staffMemberId: number,
  contractMethod: "PAPER" | "ELECTRONIC" | null,
  status: "SIGNED" | "PENDING_SIGNATURE" | "ENDED" = "SIGNED",
) => ({ staffMemberId, contractMethod, status, awaitingSignature: status === "PENDING_SIGNATURE" });

test("서명 완료된 종이 계약이 있는 소속은 대상이다", () => {
  assert.deepEqual(paperSignedMemberships([member(1)], [contract(1, "PAPER")], TODAY), [member(1)]);
});

test("전자계약만 있는 소속은 대상이 아니다", () => {
  assert.deepEqual(paperSignedMemberships([member(1)], [contract(1, "ELECTRONIC")], TODAY), []);
});

test("서명 완료가 아닌 종이 계약 · 계약 방식이 없는 계약은 대상이 아니다", () => {
  assert.deepEqual(paperSignedMemberships([member(1)], [contract(1, "PAPER", "ENDED"), contract(1, null)], TODAY), []);
});

test("퇴직한 소속은 대상이 아니고 퇴직 예정 소속은 대상이다", () => {
  const retired = member(1, "2026-11-26");
  const retiring = member(2, TODAY);
  assert.deepEqual(paperSignedMemberships([retired, retiring], [contract(1, "PAPER"), contract(2, "PAPER")], TODAY), [retiring]);
});

test("다른 소속의 종이 계약은 그 소속을 대상으로 만들지 않는다 · 소속 순서를 지킨다", () => {
  const [a, b, c] = [member(1), member(2), member(3)];
  assert.deepEqual(paperSignedMemberships([a, b, c], [contract(3, "PAPER"), contract(1, "PAPER"), contract(2, "ELECTRONIC")], TODAY), [a, c]);
});

test("같은 근무지라도 옛 레코드(퇴직 뒤 재입사)의 종이 계약은 지금 소속을 대상으로 만들지 않는다", () => {
  // 옛 레코드 1 은 퇴직해 소속 목록에 없고, 지금 소속 2 는 전자계약을 맺었다
  assert.deepEqual(paperSignedMemberships([member(2)], [contract(1, "PAPER"), contract(2, "ELECTRONIC")], TODAY), []);
});

test("그 소속에 서명을 기다리는 계약이 있으면 대상이 아니다", () => {
  assert.deepEqual(paperSignedMemberships([member(1)], [contract(1, "PAPER"), contract(1, "ELECTRONIC", "PENDING_SIGNATURE")], TODAY), []);
});

test("함께 온 계약을 모두 찾았고 모두 종이 계약일 때만 allPaper", () => {
  const paper = (contractId: number) => ({ contractId, contractMethod: "PAPER" as const });
  const electronic = (contractId: number) => ({ contractId, contractMethod: "ELECTRONIC" as const });
  assert.equal(allPaper([1, 2], [paper(1), paper(2)]), true);
  assert.equal(allPaper([1, 1], [paper(1)]), true);
  assert.equal(allPaper([1, 2], [paper(1), electronic(2)]), false);
  assert.equal(allPaper([1, 2], [paper(1)]), false);
  assert.equal(allPaper([], []), false);
});

test("신고 정보를 내지 않은 종이 계약 소속만 — 냈거나 냈는지 모르면(옛 api) 안내하지 않는다", () => {
  const due = { ...member(1), taxProfileSubmitted: false };
  const submitted = { ...member(2), taxProfileSubmitted: true };
  const unknown = member(3);
  const electronic = { ...member(4), taxProfileSubmitted: false };
  const contracts = [contract(1, "PAPER"), contract(2, "PAPER"), contract(3, "PAPER"), contract(4, "ELECTRONIC")];
  assert.deepEqual(taxProfileDueMemberships([due, submitted, unknown, electronic], contracts, TODAY), [due]);
});

test("신고 정보를 낼 소속이 여럿이면 소속 목록 순서 그대로", () => {
  const [a, b] = [{ ...member(7), taxProfileSubmitted: false }, { ...member(3), taxProfileSubmitted: false }];
  assert.deepEqual(taxProfileDueMemberships([a, b], [contract(3, "PAPER"), contract(7, "PAPER")], TODAY), [a, b]);
});

test("낸 것을 확인한 종이 계약 소속이 있을 때만 할 일 없음 — 냈는지 모르거나 짝을 못 맞추면 아니다", () => {
  const contracts = [contract(1, "PAPER")];
  assert.equal(paperTaxProfileConfirmed([{ ...member(1), taxProfileSubmitted: true }], contracts, TODAY), true);
  assert.equal(paperTaxProfileConfirmed([{ ...member(1), taxProfileSubmitted: false }], contracts, TODAY), false);
  assert.equal(paperTaxProfileConfirmed([member(1)], contracts, TODAY), false);
  assert.equal(paperTaxProfileConfirmed([{ ...member(2), taxProfileSubmitted: true }], contracts, TODAY), false);
});

test("처음 넣기 화면 주소", () => {
  assert.equal(taxProfileNewHref(7), "/me/memberships/7/tax-profile/new");
});
