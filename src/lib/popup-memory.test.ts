// node --test src/lib/popup-memory.test.ts
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createPopupMemory } from "./popup-memory.ts";

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => void values.set(k, v),
    removeItem: (k: string) => void values.delete(k),
  };
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
});

test("저장소 키마다 따로 기억하고 구독자에게 알린다", () => {
  const sign = createPopupMemory("a");
  const affiliation = createPopupMemory("b");
  let notified = 0;
  const unsubscribe = sign.subscribe(() => notified++);
  sign.remember("1@x");
  assert.equal(sign.read(), "1@x");
  assert.equal(affiliation.read(), null);
  assert.equal(notified, 1);
  unsubscribe();
  sign.forget();
  assert.equal(sign.read(), null);
});
