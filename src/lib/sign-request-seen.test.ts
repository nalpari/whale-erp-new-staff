// node --test src/lib/sign-request-seen.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { REOPEN_AFTER_MS, isSignRequestDismissed, mergeSignRequestSeen, onVisibilityChange } from "./sign-request-seen.ts";

const A = "1@2026-10-20T01:00:00.000Z";
const B = "2@2026-10-03T01:00:00.000Z";

test("닫은 계약의 부분집합이면 닫아 둔다 — 줄어들면 그대로, 새 계약 · 다시 발송이면 다시 뜬다", () => {
  const seen = mergeSignRequestSeen(`${A},${B}`, null);
  assert.equal(isSignRequestDismissed(`${A},${B}`, null), false);
  assert.equal(isSignRequestDismissed(`${A},${B}`, seen), true);
  // 하나를 서명해 줄어도 다시 뜨지 않는다
  assert.equal(isSignRequestDismissed(A, seen), true);
  // 새 계약
  assert.equal(isSignRequestDismissed(`${A},3@2026-10-27T01:00:00.000Z`, seen), false);
  // 다시 발송(발송 일시가 바뀜)
  assert.equal(isSignRequestDismissed("1@2026-10-25T01:00:00.000Z", seen), false);
});

test("「다음에 하기」는 이미 닫은 것에 더해 기억한다", () => {
  assert.equal(mergeSignRequestSeen(B, A), [A, B].sort().join(","));
  assert.equal(mergeSignRequestSeen(A, A), A);
});

test("화면이 숨으면 그 시각을 기록하고, 10분 넘게 숨었다 보이면 다시 연 것으로 본다(HOME-4)", () => {
  const t0 = 1_000_000;
  assert.deepEqual(onVisibilityChange(null, "hidden", t0), { hiddenAt: t0, reopened: false });
  // 숨은 채 또 숨김 알림이 와도 처음 숨은 시각을 둔다
  assert.deepEqual(onVisibilityChange(t0, "hidden", t0 + 5000), { hiddenAt: t0, reopened: false });
  assert.deepEqual(onVisibilityChange(t0, "visible", t0 + REOPEN_AFTER_MS), { hiddenAt: null, reopened: false });
  assert.deepEqual(onVisibilityChange(t0, "visible", t0 + REOPEN_AFTER_MS + 1), { hiddenAt: null, reopened: true });
  // 숨은 기록 없이 보임만 오면(처음 그림) 아니다
  assert.deepEqual(onVisibilityChange(null, "visible", t0), { hiddenAt: null, reopened: false });
});
