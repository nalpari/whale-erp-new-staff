// node --test src/lib/login-input.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { appDeviceIdOf, readLoginForm } from "./login-input.ts";

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

test("체크 박스는 숨은 칸이 \"on\" 일 때만 켠 것이고, 없으면 둘 다 끔", () => {
  assert.deepEqual(readLoginForm(form({ email: " A@b.co ", password: " pw " })), {
    email: "A@b.co",
    password: " pw ",
    saveEmail: false,
    autoLogin: false,
    appDeviceId: null,
  });
  const on = readLoginForm(form({ email: "a@b.co", password: "pw", saveEmail: "on", autoLogin: "on" }));
  assert.deepEqual([on.saveEmail, on.autoLogin], [true, true]);
  const other = readLoginForm(form({ email: "a@b.co", password: "pw", saveEmail: "true", autoLogin: "1" }));
  assert.deepEqual([other.saveEmail, other.autoLogin], [false, false]);
});

test("앱 기기 식별자는 64자 소문자 16진수만 받고 그 밖은 버린다(폼에서 오는 값)", () => {
  const hex = "a".repeat(64);
  assert.equal(readLoginForm(form({ email: "a@b.co", password: "pw", appDeviceId: hex })).appDeviceId, hex);
  assert.equal(appDeviceIdOf("A".repeat(64)), null);
  assert.equal(appDeviceIdOf("a".repeat(63)), null);
  assert.equal(appDeviceIdOf("9774d56d682e549c"), null);
  assert.equal(appDeviceIdOf(`${hex}\n`), null);
  assert.equal(appDeviceIdOf(null), null);
});
