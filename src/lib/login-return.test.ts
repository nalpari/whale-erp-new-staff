// node --test src/lib/login-return.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isSignupPath } from "./login-return.ts";

test("isSignupPath 는 가입 완료를 뺀 /join 아래만 받는다 — 초대 링크는 액션이 보낸다", () => {
  for (const path of ["/join", "/join/invitation", "/join/signup"]) assert.equal(isSignupPath(path), true, path);
  for (const path of ["/join/done", "/joiner", "/invite", "/login", "/home"]) assert.equal(isSignupPath(path), false, path);
});
