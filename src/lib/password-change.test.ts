// node --test src/lib/password-change.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CURRENT_PASSWORD_MISMATCH, passwordChangeFailure, validatePasswordChange } from "./password-change.ts";

const fieldOf = (state: { problem?: { field: string } } | null) => state?.problem?.field ?? null;

test("validatePasswordChange 는 칸 순서대로 거른다", () => {
  assert.equal(fieldOf(validatePasswordChange("", "Abcd1234!", "Abcd1234!")), "currentPassword");
  assert.deepEqual(validatePasswordChange("x".repeat(129), "Abcd1234!", "Abcd1234!"), {
    problem: { field: "currentPassword", message: CURRENT_PASSWORD_MISMATCH },
  });
  assert.equal(fieldOf(validatePasswordChange("now", "", "")), "newPassword");
  assert.equal(fieldOf(validatePasswordChange("now", "Abcd1234!", "Abcd1234?")), "confirmation");
  assert.equal(validatePasswordChange("now", "Abcd1234!", "Abcd1234!"), null);
});

test("새 비밀번호 20자는 사용자가 보는 글자 수로 센다(이모지 하나 = 한 글자)", () => {
  const twenty = "😀".repeat(20);
  assert.equal(validatePasswordChange("now", twenty, twenty), null);
  const longer = "😀".repeat(21);
  assert.equal(fieldOf(validatePasswordChange("now", longer, longer)), "newPassword");
});

test("passwordChangeFailure — 400 은 글자로 가르고, 영어 원문만 남긴다", () => {
  assert.deepEqual(passwordChangeFailure({ status: 400, message: CURRENT_PASSWORD_MISMATCH }), {
    state: { problem: { field: "currentPassword", message: CURRENT_PASSWORD_MISMATCH } },
    log: false,
  });
  const rule = "2가지 종류만 쓰면 10자 이상이어야 합니다";
  assert.deepEqual(passwordChangeFailure({ status: 400, message: rule }), { state: { problem: { field: "newPassword", message: rule } }, log: false });
  const english = passwordChangeFailure({ status: 400, message: "newPassword must be shorter" });
  assert.deepEqual([fieldOf(english.state), english.log], ["newPassword", true]);
});

test("passwordChangeFailure — 429 · 5xx · 연결 실패는 확인 칸, 예상 밖 4xx 만 남긴다", () => {
  assert.equal(fieldOf(passwordChangeFailure({ status: 429, message: "ThrottlerException" }).state), "confirmation");
  assert.equal(passwordChangeFailure({ status: 500, message: "Internal" }).log, false);
  assert.equal(passwordChangeFailure({ status: 404, message: "Cannot POST" }).log, true);
  assert.equal(fieldOf(passwordChangeFailure("network").state), "confirmation");
});
