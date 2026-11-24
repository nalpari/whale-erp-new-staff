// node --test src/lib/withdrawal.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_FAILED, RATE_LIMITED } from "./action-errors.ts";
import { CURRENT_PASSWORD_MISMATCH } from "./password-change.ts";
import { employedStoresOf, validateWithdrawal, withdrawalFailure } from "./withdrawal.ts";

test("validateWithdrawal — 빈 값 · 128자 초과는 입력칸 오류", () => {
  assert.equal(validateWithdrawal("")?.problem?.field, "currentPassword");
  assert.deepEqual(validateWithdrawal("x".repeat(129)), { problem: { field: "currentPassword", message: CURRENT_PASSWORD_MISMATCH } });
  assert.equal(validateWithdrawal("now"), null);
});

test("withdrawalFailure — 400 비밀번호 불일치는 입력칸, 영어 400 은 안내 + 남김", () => {
  assert.deepEqual(withdrawalFailure({ status: 400, message: "지금 비밀번호가 맞지 않습니다." }), {
    state: { problem: { field: "currentPassword", message: CURRENT_PASSWORD_MISMATCH } },
    log: false,
  });
  const english = withdrawalFailure({ status: 400, message: "currentPassword must be a string" });
  assert.deepEqual([english.state.problem?.field, english.log], ["form", true]);
});

test("withdrawalFailure — 409 재직은 재직 안내 화면, 교착(code 없음)은 api 문구", () => {
  assert.deepEqual(withdrawalFailure({ status: 409, message: "근무지 관리자에게 퇴직 처리를 요청해 주세요.", code: "EMPLOYED_AFFILIATION" }), {
    state: { employed: [] },
    log: false,
  });
  const busy = "다른 처리와 겹쳐 탈퇴하지 못했습니다. 바뀐 것은 없으니 잠시 뒤 다시 시도해 주세요.";
  assert.deepEqual(withdrawalFailure({ status: 409, message: busy }), { state: { problem: { field: "form", message: busy } }, log: false });
  assert.equal(withdrawalFailure({ status: 409, message: "Conflict" }).state.problem?.field, "form");
});

test("withdrawalFailure — 429 · 연결 실패 · 5xx 는 화면 문구, 예상 밖 4xx 만 남긴다", () => {
  assert.equal(withdrawalFailure({ status: 429, message: "ThrottlerException" }).state.problem?.message, RATE_LIMITED);
  assert.equal(withdrawalFailure("network").state.problem?.message, CONNECTION_FAILED);
  assert.equal(withdrawalFailure({ status: 500, message: "x" }).log, false);
  assert.equal(withdrawalFailure({ status: 404, message: "x" }).log, true);
});

test("employedStoresOf — 모양이 다른 항목은 거른다", () => {
  assert.deepEqual(employedStoresOf({ employedStores: [{ storeName: "강남점", retiredDate: "2026-12-31" }, { storeName: "역삼점", retiredDate: null }, { x: 1 }] }), [
    { storeName: "강남점", retiredDate: "2026-12-31" },
    { storeName: "역삼점", retiredDate: null },
  ]);
  assert.deepEqual(employedStoresOf(null), []);
  assert.deepEqual(employedStoresOf({ employedStores: "x" }), []);
});
