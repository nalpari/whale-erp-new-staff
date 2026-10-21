// node --test src/lib/attempt-lock.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { lockCountdown, lockOf } from "./attempt-lock.ts";

const failure = (status: number, body: unknown) => ({ status, body });
const AT = "2026-10-21T05:07:47.119Z";
const SERVER_NOW = Date.parse("2026-10-21T05:03:00.000Z");

test("429 본문에 해제 시각(ISO)이 있으면 잠금 — 해제 시각(ms)과 받은 순간의 서버 시각", () => {
  assert.deepEqual(lockOf(failure(429, { lockExpiresAt: AT }), SERVER_NOW), {
    kind: "locked",
    attemptLock: { lockExpiresAt: Date.parse(AT), serverNow: SERVER_NOW },
  });
});

test("이미 지난 해제 시각도 잠금으로 둔다 — 화면은 00:00 과 열린 버튼을 보이고 판정은 api 가 한다", () => {
  assert.equal(lockOf(failure(429, { lockExpiresAt: AT }), Date.parse(AT) + 60_000).kind, "locked");
});

test("해제 시각 칸이 없으면 요청 제한", () => {
  assert.deepEqual(lockOf(failure(429, { statusCode: 429, message: "ThrottlerException: Too Many Requests" })), { kind: "rate-limited" });
  assert.deepEqual(lockOf(failure(429, null)), { kind: "rate-limited" });
  assert.deepEqual(lockOf(failure(429, "Too Many Requests")), { kind: "rate-limited" });
});

test("칸은 있는데 ISO 문자열로 읽을 수 없으면 계약 어긋남(malformed) — 요청 제한과 가른다", () => {
  assert.deepEqual(lockOf(failure(429, { lockExpiresAt: "내일" })), { kind: "malformed" });
  assert.deepEqual(lockOf(failure(429, { lockExpiresAt: 1_700_000_000_000 })), { kind: "malformed" });
  assert.deepEqual(lockOf(failure(429, { lockExpiresAt: null })), { kind: "malformed" });
});

test("429 가 아니면 본문에 해제 시각이 있어도 잠금이 아니다", () => {
  assert.deepEqual(lockOf(failure(401, { lockExpiresAt: AT })), { kind: "rate-limited" });
});

const lock = { lockExpiresAt: SERVER_NOW + 252_000, serverNow: SERVER_NOW };

test("시계가 돌기 전(null)은 서버가 그린 순간의 남은 시간을 보이고 버튼을 열어 둔다", () => {
  assert.deepEqual(lockCountdown(lock, null), { text: "04:12", waiting: false });
});

test("시계가 돌면 남은 시간이 있는 동안 버튼을 막는다", () => {
  assert.deepEqual(lockCountdown(lock, SERVER_NOW + 2_000), { text: "04:10", waiting: true });
});

test("해제 시각이 되거나 지나면 00:00 이고 버튼을 연다", () => {
  assert.deepEqual(lockCountdown(lock, lock.lockExpiresAt), { text: "00:00", waiting: false });
  assert.deepEqual(lockCountdown(lock, lock.lockExpiresAt + 5_000), { text: "00:00", waiting: false });
});

test("1초 안쪽이 남으면 글자는 00:00 이지만 버튼은 아직 막혀 있다(초 아래는 버림)", () => {
  assert.deepEqual(lockCountdown(lock, lock.lockExpiresAt - 500), { text: "00:00", waiting: true });
});
