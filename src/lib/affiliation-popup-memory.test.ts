// node --test src/lib/affiliation-popup-memory.test.ts
// 소속 추가 요청 기억의 래퍼(합치기 · 지우기)만 본다. 저장소가 던질 때 화면 안 값으로 넘어가는 경로는 popup-memory.test.ts 한 곳에 있다.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { forgetAffiliationPopup, readSeen, rememberSeen } from "./affiliation-popup-memory.ts";

beforeEach(() => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
  forgetAffiliationPopup();
});

test("rememberSeen 은 본 요청을 쌓아 기억한다", () => {
  assert.equal(readSeen(), null);
  rememberSeen("3,9");
  rememberSeen("12");
  assert.equal(readSeen(), "3,9,12");
});

test("forgetAffiliationPopup 은 기억을 지운다", () => {
  rememberSeen("3");
  forgetAffiliationPopup();
  assert.equal(readSeen(), null);
});
