// node --test src/lib/login-return.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isSignupPath } from "./login-return.ts";

test("isSignupPath 는 가입 완료를 뺀 /join · /invite 아래만 받는다", () => {
  for (const path of ["/join", "/join/invitation", "/join/signup", "/invite"]) assert.equal(isSignupPath(path), true, path);
  for (const path of ["/join/done", "/joiner", "/login", "/home", "/invites"]) assert.equal(isSignupPath(path), false, path);
});
