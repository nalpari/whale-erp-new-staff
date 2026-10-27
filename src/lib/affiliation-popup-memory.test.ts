// node --test src/lib/affiliation-popup-memory.test.ts
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { forgetAffiliationPopup, readSeen, rememberSeen } from "./affiliation-popup-memory.ts";

/** 꾸민 sessionStorage. failing 이면 쓰기를 막는다(사생활 보호 모드 · 용량 초과). */
class FakeStorage {
  values = new Map<string, string>();
  failing = false;
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failing) throw new Error("QuotaExceededError");
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

let storage: FakeStorage;
beforeEach(() => {
  storage = new FakeStorage();
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
  forgetAffiliationPopup();
});

test("rememberSeen 은 본 요청을 쌓아 기억한다", () => {
  assert.equal(readSeen(), null);
  rememberSeen("3,9");
  rememberSeen("12");
  assert.equal(readSeen(), "3,9,12");
});

test("저장소 쓰기가 한 번 실패한 뒤 다시 성공하면 옛 값이 아니라 저장소 값을 읽는다", () => {
  storage.failing = true;
  rememberSeen("3");
  assert.equal(readSeen(), "3");
  storage.failing = false;
  rememberSeen("9");
  assert.equal(readSeen(), "3,9");
  assert.equal(storage.getItem("staff:affiliation-popup-dismissed"), "3,9");
});

test("forgetAffiliationPopup 은 저장소와 화면 기억을 모두 지운다", () => {
  storage.failing = true;
  rememberSeen("3");
  forgetAffiliationPopup();
  assert.equal(readSeen(), null);
});
