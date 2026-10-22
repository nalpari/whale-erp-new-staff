// node --test src/lib/current-store.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickCurrentMembership } from "./current-store.ts";

const items = [{ staffMemberId: 7 }, { staffMemberId: 9 }];

test("쿠키 값과 같은 소속을 고른다", () => {
  assert.equal(pickCurrentMembership(items, "9"), items[1]);
});

test("처음 · 내 소속이 아닌 값 · 망가진 값이면 첫 소속", () => {
  for (const raw of [undefined, "", "3", "abc", "9x", "07", "-9"]) assert.equal(pickCurrentMembership(items, raw), items[0], String(raw));
});

test("소속이 없으면 null", () => {
  assert.equal(pickCurrentMembership([], "7"), null);
});
