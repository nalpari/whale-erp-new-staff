// node --test src/lib/popup-memory.test.ts
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createPopupMemory, isSeenSubset, mergeSeen } from "./popup-memory.ts";

/** 꾸민 sessionStorage. failing 이면 쓰기를, readFailing 이면 읽기를, removeFailing 이면 지우기를 막는다. */
class FakeStorage {
  values = new Map<string, string>();
  failing = false;
  readFailing = false;
  removeFailing = false;
  getItem(key: string) {
    if (this.readFailing) throw new Error("SecurityError");
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failing) throw new Error("QuotaExceededError");
    this.values.set(key, value);
  }
  removeItem(key: string) {
    if (this.removeFailing) throw new Error("SecurityError");
    this.values.delete(key);
  }
}

let storage: FakeStorage;
beforeEach(() => {
  storage = new FakeStorage();
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
});

test("저장소 키마다 따로 기억하고, 기억 · 지우기를 구독자에게 알린다", () => {
  const sign = createPopupMemory("a");
  const affiliation = createPopupMemory("b");
  let notified = 0;
  const unsubscribe = sign.subscribe(() => notified++);
  sign.remember("1@x");
  assert.equal(sign.read(), "1@x");
  assert.equal(affiliation.read(), null);
  sign.forget();
  assert.equal(sign.read(), null);
  assert.equal(notified, 2);
  unsubscribe();
  sign.remember("2@y");
  assert.equal(notified, 2);
});

test("저장소 쓰기가 던지면 화면 안 값으로 기억하고, 다시 쓰기가 되면 저장소 값을 읽는다", () => {
  const memory = createPopupMemory("a");
  storage.failing = true;
  memory.remember("1@x");
  assert.equal(memory.read(), "1@x");
  assert.equal(storage.values.get("a"), undefined);
  storage.failing = false;
  memory.remember("2@y");
  storage.values.set("a", "3@z"); // 다른 탭이 아니라 저장소만 믿는지 — 화면 안 값이 비었으면 저장소를 읽는다
  assert.equal(memory.read(), "3@z");
});

test("읽기가 던지면 쓰기가 돼도 화면 안 값을 둔다 — 닫은 팝업이 다시 뜨지 않게", () => {
  const memory = createPopupMemory("a");
  storage.readFailing = true;
  memory.remember("1@x");
  assert.equal(memory.read(), "1@x");
});

test("지우기가 던져도 화면 안 값은 지운다", () => {
  const memory = createPopupMemory("a");
  storage.failing = true;
  memory.remember("1@x");
  storage.removeFailing = true;
  memory.forget();
  storage.failing = false;
  assert.equal(memory.read(), null);
});

test("닫은 항목 판정은 부분집합, 합치기는 정렬을 인자로", () => {
  assert.equal(isSeenSubset("3", "3,9"), true);
  assert.equal(isSeenSubset("3,12", "3,9"), false);
  assert.equal(isSeenSubset("3", null), false);
  assert.equal(mergeSeen("12", "3,9"), "12,3,9");
  assert.equal(mergeSeen("12", "3,9", (a, b) => Number(a) - Number(b)), "3,9,12");
});
