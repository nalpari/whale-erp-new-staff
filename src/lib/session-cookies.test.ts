// node --test src/lib/session-cookies.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEVICE_ID_COOKIE, SAVED_EMAIL_COOKIE, clearSessionCookies, parseAccountCookie, savedEmailCookie } from "./session-cookies.ts";

test("clearSessionCookies 는 접속 쿠키 셋만 지우고, 기기 id 와 저장된 아이디는 남긴다(로그아웃해도 남는 약속)", () => {
  const deleted: string[] = [];
  clearSessionCookies({ delete: (name: string) => deleted.push(name) });
  assert.deepEqual(deleted.sort(), ["access_token", "account", "refresh_token"]);
  assert.equal(deleted.includes(SAVED_EMAIL_COOKIE), false);
  assert.equal(deleted.includes(DEVICE_ID_COOKIE), false);
});

test("parseAccountCookie 는 모양이 맞을 때만 계정이다 — proxy 와 화면이 같은 판정을 써야 끝없이 돌지 않는다", () => {
  const account = { accountId: 1, email: "a@b.co", realName: "이하은", status: "JOINED" };
  assert.deepEqual(parseAccountCookie(JSON.stringify(account)), account);
  assert.equal(parseAccountCookie(undefined), null);
  assert.equal(parseAccountCookie("null"), null);
  assert.equal(parseAccountCookie("{broken"), null);
  assert.equal(parseAccountCookie(JSON.stringify({ ...account, accountId: "1" })), null);
});

test("저장된 아이디 쿠키는 httpOnly · 1년", () => {
  const options = savedEmailCookie();
  assert.equal(options.httpOnly, true);
  assert.equal(options.maxAge, 365 * 24 * 60 * 60);
});
