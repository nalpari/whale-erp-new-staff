// node --test src/lib/sign-request.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ContractListItem } from "./contracts.ts";
import { blockedContractHref, checkInSignWaitingOf, signRequestOf, signWaitingCards } from "./sign-request.ts";

const NOW = new Date("2026-10-28T03:00:00Z"); // 한국 2026-10-28 12:00

const item = (contractId: number, over: Partial<ContractListItem> = {}): ContractListItem => ({
  contractId,
  storeId: 10,
  storeName: "웨일카페 강남역점",
  status: "PENDING_SIGNATURE",
  employmentType: "PART_TIME",
  contractMethod: "ELECTRONIC",
  startDate: "2026-11-01",
  endDate: null,
  sentAt: "2026-10-20T01:00:00.000Z",
  signDeadlineAt: "2026-11-19T01:00:00.000Z",
  processedAt: "2026-10-20T01:00:00.000Z",
  awaitingSignature: true,
  ...over,
});

test("서명을 기다리는 전자계약 가운데 기한이 가장 급한 것을 고른다", () => {
  const request = signRequestOf(
    [
      item(1, { signDeadlineAt: "2026-11-19T01:00:00.000Z" }),
      item(2, { signDeadlineAt: "2026-11-02T01:00:00.000Z", sentAt: "2026-10-03T01:00:00.000Z" }),
      item(3, { status: "SIGNED", awaitingSignature: false }),
    ],
    NOW,
  );
  assert.equal(request?.contract.contractId, 2);
  // 데모처럼 상세로 — 거기서 조항을 보고 서명한다
  assert.equal(request?.href, "/contracts/2?store=10");
  assert.equal(request?.deadline, "2026년 11월 2일 10:00까지 · 5일 남음");
  // 기억 값은 기다리는 계약 모두 — 고른 것만이 아니다
  assert.equal(request?.key, "1@2026-10-20T01:00:00.000Z,2@2026-10-03T01:00:00.000Z");
});

test("기한 당일은 「오늘 마감」", () => {
  assert.equal(signRequestOf([item(1, { signDeadlineAt: "2026-10-28T09:00:00.000Z" })], NOW)?.deadline, "2026년 10월 28일 18:00까지 · 오늘 마감");
});

test("서명할 수 없는 계약(기한 지남 · 퇴직 — awaitingSignature 거짓) · 종이 계약 · 발송 일시 없음은 띄우지 않는다", () => {
  assert.equal(signRequestOf([], NOW), null);
  assert.equal(signRequestOf([item(1, { awaitingSignature: false })], NOW), null);
  assert.equal(signRequestOf([item(1, { contractMethod: "PAPER" })], NOW), null);
  assert.equal(signRequestOf([item(1, { sentAt: null })], NOW), null);
});

test("홈 서명 대기 카드는 서명을 기다리는 전자계약 모두를 기한이 급한 순으로, 7일 이내만 강조", () => {
  const cards = signWaitingCards(
    [
      item(1, { signDeadlineAt: "2026-11-19T01:00:00.000Z" }),
      item(2, { storeName: "웨일카페 홍대점", storeId: 11, signDeadlineAt: "2026-11-02T01:00:00.000Z" }),
      item(3, { status: "SIGNED", awaitingSignature: false }),
      item(4, { contractMethod: "PAPER" }),
      item(5, { sentAt: null }),
    ],
    NOW,
  );
  assert.deepEqual(
    cards.map((c) => [c.contractId, c.storeName, c.href, c.daysLeft, c.urgent, c.until, c.left]),
    [
      [2, "웨일카페 홍대점", "/contracts/2?store=11", 5, true, "2026년 11월 2일까지", "남은 기한 5일"],
      [1, "웨일카페 강남역점", "/contracts/1?store=10", 22, false, "2026년 11월 19일까지", "남은 기한 22일"],
    ],
  );
});

test("홈 서명 대기 카드 — 기한이 오늘 · 내일이면 시각까지, 기한이 없으면 날짜 없이", () => {
  const [today, tomorrow] = signWaitingCards(
    [item(1, { signDeadlineAt: "2026-10-28T05:00:00.000Z" }), item(2, { signDeadlineAt: "2026-10-29T01:30:00.000Z" })],
    NOW,
  );
  assert.equal(today.daysLeft, 0);
  assert.equal(today.until, "2026년 10월 28일 14:00까지");
  assert.equal(today.left, "오늘 14:00 마감");
  assert.equal(tomorrow.until, "2026년 10월 29일 10:30까지");
  assert.equal(tomorrow.left, "내일 10:30 마감");
  const [none] = signWaitingCards([item(1, { signDeadlineAt: null })], NOW);
  assert.deepEqual([none.daysLeft, none.urgent, none.until, none.left], [null, false, null, null]);
});

test("checkInSignWaitingOf 는 지금 근무지의 서명 대기만 보고, 하나면 그 계약서 · 여럿이면 그 근무지 목록으로 잇는다", () => {
  const other = item(9, { storeId: 20, signDeadlineAt: "2026-10-29T01:00:00.000Z" });
  const one = checkInSignWaitingOf([item(1, { signDeadlineAt: "2026-11-19T01:00:00.000Z" }), other], NOW, 10, 1);
  assert.deepEqual(one, { href: "/contracts/1?store=10", count: 1, left: "남은 기한 22일", urgent: false });
  // 여럿이면 목록, 기한 줄은 가장 급한 계약 — 7일 이내면 강조
  const many = checkInSignWaitingOf(
    [item(1, { signDeadlineAt: "2026-11-19T01:00:00.000Z" }), item(2, { signDeadlineAt: "2026-11-02T01:00:00.000Z" }), other],
    NOW,
    10,
    1,
  );
  assert.deepEqual(many, { href: "/contracts?store=10", count: 2, left: "남은 기한 5일", urgent: true });
});

test("checkInSignWaitingOf 는 계약 목록을 못 받으면 api 가 알려 준 막은 계약으로, 그것도 없으면 근무지 목록으로 잇는다", () => {
  assert.deepEqual(checkInSignWaitingOf(null, NOW, 10, 7), { href: "/contracts/7?store=10", count: null, left: null, urgent: false });
  assert.deepEqual(checkInSignWaitingOf(null, NOW, 10, null), { href: "/contracts?store=10", count: null, left: null, urgent: false });
  // 목록에 그 근무지 서명 대기가 없어도 api 가 지목한 계약이 있으면 그 상세, 없으면 근무지 목록
  assert.deepEqual(checkInSignWaitingOf([item(9, { storeId: 20 })], NOW, 10, 7), { href: "/contracts/7?store=10", count: 0, left: null, urgent: false });
  assert.deepEqual(checkInSignWaitingOf([item(9, { storeId: 20 })], NOW, 10, null), { href: "/contracts?store=10", count: 0, left: null, urgent: false });
});

test("checkInSignWaitingOf 는 api 가 지목한 계약보다 앱에서 서명할 수 있는 카드를 앞세운다 — 경고판의 건수 · 기한과 링크가 같은 계약", () => {
  const paper = 5; // 앱이 서명 대기로 보지 않는 계약(종이 계약 — 상세가 「서명할 필요 없음」)
  const w = checkInSignWaitingOf([item(1), item(paper, { contractMethod: "PAPER" })], NOW, 10, paper);
  assert.deepEqual(w, { href: "/contracts/1?store=10", count: 1, left: "남은 기한 22일", urgent: false });
  // 지목한 계약이 카드에 있으면 카드 규칙대로
  assert.equal(checkInSignWaitingOf([item(1)], NOW, 10, 1).href, "/contracts/1?store=10");
});

test("blockedContractHref 는 막은 계약이 있으면 그 상세, 없으면 그 근무지 계약서 목록", () => {
  assert.equal(blockedContractHref(10, 7), "/contracts/7?store=10");
  assert.equal(blockedContractHref(10, null), "/contracts?store=10");
});
