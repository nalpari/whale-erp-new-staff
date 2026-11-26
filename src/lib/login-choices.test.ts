// node --test src/lib/login-choices.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSaveEmailChoice } from "./login-choices.ts";

test("저장된 아이디 저장 기억은 참 · 거짓일 때만 읽는다", () => {
  assert.equal(parseSaveEmailChoice('{"saveEmail":true}'), true);
  assert.equal(parseSaveEmailChoice('{"saveEmail":false}'), false);
  assert.equal(parseSaveEmailChoice(null), null);
  assert.equal(parseSaveEmailChoice(""), null);
  assert.equal(parseSaveEmailChoice("깨진 값"), null);
  assert.equal(parseSaveEmailChoice("null"), null);
  assert.equal(parseSaveEmailChoice('{"saveEmail":"true"}'), null);
  assert.equal(parseSaveEmailChoice("{}"), null);
});

test("옛 형식에 함께 있던 자동로그인은 읽지 않는다 — 공용 기기에서 다음 사람에게 넘어가지 않게", () => {
  assert.equal(parseSaveEmailChoice('{"saveEmail":true,"autoLogin":true}'), true);
  assert.equal(parseSaveEmailChoice('{"saveEmail":false,"autoLogin":true}'), false);
});
