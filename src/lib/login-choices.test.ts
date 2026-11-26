// node --test src/lib/login-choices.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseLoginChoices } from "./login-choices.ts";

test("저장된 체크 기억은 두 값이 모두 참 · 거짓일 때만 읽는다", () => {
  assert.deepEqual(parseLoginChoices('{"saveEmail":true,"autoLogin":false}'), { saveEmail: true, autoLogin: false });
  assert.equal(parseLoginChoices(null), null);
  assert.equal(parseLoginChoices(""), null);
  assert.equal(parseLoginChoices("깨진 값"), null);
  assert.equal(parseLoginChoices("null"), null);
  assert.equal(parseLoginChoices('{"saveEmail":"true","autoLogin":false}'), null);
  assert.equal(parseLoginChoices('{"saveEmail":true}'), null);
});
