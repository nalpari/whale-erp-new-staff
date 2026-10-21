// node --test src/lib/time-left.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatLeft } from "./time-left.ts";

test("mm:ss 로 쓰고 초 아래는 버린다", () => {
  assert.equal(formatLeft(300_000), "05:00");
  assert.equal(formatLeft(59_999), "00:59");
  assert.equal(formatLeft(61_000), "01:01");
});

test("0 이거나 지났으면 00:00", () => {
  assert.equal(formatLeft(0), "00:00");
  assert.equal(formatLeft(-5_000), "00:00");
});

test("60분이 넘으면 분 칸이 늘어난다", () => {
  assert.equal(formatLeft(3_600_000), "60:00");
});
