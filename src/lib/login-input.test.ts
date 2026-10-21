// node --test src/lib/login-input.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { readLoginForm } from "./login-input.ts";

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
  });
  const on = readLoginForm(form({ email: "a@b.co", password: "pw", saveEmail: "on", autoLogin: "on" }));
  assert.deepEqual([on.saveEmail, on.autoLogin], [true, true]);
  const other = readLoginForm(form({ email: "a@b.co", password: "pw", saveEmail: "true", autoLogin: "1" }));
  assert.deepEqual([other.saveEmail, other.autoLogin], [false, false]);
});
