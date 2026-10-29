// node --test src/lib/sign-request.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ContractListItem } from "./contracts.ts";
import { signRequestOf } from "./sign-request.ts";

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
