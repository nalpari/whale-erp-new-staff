// node --test src/lib/sheet-locks.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DRAG_CLOSE_PX, createSheetLocks, shouldCloseOnDrag } from "./sheet-locks.ts";

function setup() {
  const calls: string[] = [];
  const locks = createSheetLocks({ apply: () => calls.push("apply"), restore: () => calls.push("restore") });
  return { calls, locks };
}

test("열린 시트가 없으면 afterAllClosed 는 바로 부른다", () => {
  const { locks } = setup();
  let ran = 0;
  locks.afterAllClosed(() => ran++);
  assert.equal(ran, 1);
});

test("시트 두 개가 겹치면 마지막 시트가 풀릴 때 한 번만 풀고 기다리던 일을 부른다", () => {
  const { calls, locks } = setup();
  let ran = 0;
  locks.lock();
  locks.lock();
  locks.afterAllClosed(() => ran++);
  locks.unlock();
  assert.equal(ran, 0);
  assert.deepEqual(calls, ["apply"]);
  locks.unlock();
  assert.equal(ran, 1);
  assert.deepEqual(calls, ["apply", "restore"]);
});

test("잠근 적 없이 풀어도 0 아래로 내려가지 않아, 다음 잠금이 그대로 걸린다", () => {
  const { calls, locks } = setup();
  locks.unlock();
  assert.equal(locks.count, 0);
  locks.lock();
  assert.equal(locks.count, 1);
  assert.deepEqual(calls, ["apply"]);
});

test("한 번 부른 일은 다음에 다시 잠그고 풀어도 또 부르지 않는다", () => {
  const { locks } = setup();
  let ran = 0;
  locks.lock();
  locks.afterAllClosed(() => ran++);
  locks.unlock();
  locks.lock();
  locks.unlock();
  assert.equal(ran, 1);
});

test("기다리던 일 하나가 던져도 나머지는 부르고 밖으로 던지지 않는다", (t) => {
  t.mock.method(console, "error", () => {});
  const { locks } = setup();
  let ran = 0;
  locks.lock();
  locks.afterAllClosed(() => {
    throw new Error("알림 실패");
  });
  locks.afterAllClosed(() => ran++);
  assert.doesNotThrow(() => locks.unlock());
  assert.equal(ran, 1);
});

test("머리 끌기: 80px 를 넘기거나, 24px 를 넘겨 빠르게 내리면 닫는다", () => {
  assert.equal(shouldCloseOnDrag(DRAG_CLOSE_PX, 1000), false);
  assert.equal(shouldCloseOnDrag(DRAG_CLOSE_PX + 1, 1000), true);
  assert.equal(shouldCloseOnDrag(24, 10), false);
  assert.equal(shouldCloseOnDrag(25, 10), true);
  assert.equal(shouldCloseOnDrag(60, 1000), false);
  assert.equal(shouldCloseOnDrag(30, 0), true);
});
