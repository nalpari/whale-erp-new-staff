// node --test src/lib/email-change.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INITIAL_EMAIL_STATE,
  PIN_RESEND_MS,
  PIN_VALID_MS,
  confirmPinFailure,
  intentOf,
  invalidPin,
  isEmailShape,
  normalizeNewEmail,
  pinStep,
  requestPinFailure,
  type PinState,
} from "./email-change.ts";

const NOW = 1_700_000_000_000;
const pin: PinState = pinStep("new@test.invalid", NOW, false);

test("pinStep 은 지금부터 시계를 다시 세고, 다시 받았을 때만 안내를 단다", () => {
  assert.deepEqual(pin, {
    step: "pin",
    newEmail: "new@test.invalid",
    serverNow: NOW,
    deadline: NOW + PIN_VALID_MS,
    resendAt: NOW + PIN_RESEND_MS,
    feedback: undefined,
  });
  assert.equal(pinStep("a@b.co", NOW, true).feedback?.kind, "notice");
});

test("이메일 모양 · 정규화", () => {
  assert.equal(normalizeNewEmail("  A@B.COM "), "a@b.com");
  assert.equal(isEmailShape("a@b.co"), true);
  assert.equal(isEmailShape("a b@c.d"), false);
  assert.equal(isEmailShape("ab.cd"), false);
  const local = "a".repeat(242);
  assert.equal(isEmailShape(`${local}@example.com`), true); // 254자
  assert.equal(isEmailShape(`${local}a@example.com`), false); // 255자
});

test("intentOf — 인증번호 단계가 아닌데 온 confirm · resend 는 request 로 떨어진다", () => {
  assert.equal(intentOf("edit", INITIAL_EMAIL_STATE), "edit");
  assert.equal(intentOf("confirm", INITIAL_EMAIL_STATE), "request");
  assert.equal(intentOf("resend", INITIAL_EMAIL_STATE), "request");
  assert.equal(intentOf("confirm", pin), "confirm");
  assert.equal(intentOf("resend", pin), "resend");
  assert.equal(intentOf(null, pin), "request");
});

test("인증번호 받기 실패 — 처음이면 이메일 단계, 다시 받기면 시계를 그대로 두고 버튼 위에", () => {
  const first = requestPinFailure({ status: 429, message: "1분 뒤에 다시 받을 수 있습니다" }, INITIAL_EMAIL_STATE, "x@y.z");
  assert.deepEqual(first, {
    state: { step: "email", newEmail: "x@y.z", problem: { field: "form", message: "1분 뒤에 다시 받을 수 있습니다" } },
    log: false,
  });
  const noticed = pinStep("x@y.z", NOW, true);
  const resent = requestPinFailure({ status: 503, message: "지금은 인증 메일을 보낼 수 없습니다" }, noticed, "x@y.z");
  assert.equal(resent.state.step, "pin");
  assert.equal(resent.state.step === "pin" && resent.state.deadline, noticed.deadline);
  // 오류가 오면 「새 인증번호를 보냈습니다」 안내는 사라진다(한 자리에 하나).
  assert.deepEqual(resent.state.step === "pin" && resent.state.feedback, {
    kind: "error",
    field: "form",
    message: "지금은 인증 메일을 보낼 수 없습니다",
  });
});

test("인증번호 받기 실패 — 400 · 409 는 다시 받기 중이어도 이메일 칸으로", () => {
  const taken = requestPinFailure({ status: 409, message: "이미 쓰고 있는 이메일입니다" }, pin, pin.newEmail);
  assert.deepEqual(taken.state, { step: "email", newEmail: pin.newEmail, problem: { field: "newEmail", message: "이미 쓰고 있는 이메일입니다" } });
  // 영어 원문(형식 검증)은 대체 문구로 바꾸고 남긴다.
  const english = requestPinFailure({ status: 400, message: "newEmail must be an email" }, INITIAL_EMAIL_STATE, "x");
  assert.equal(english.log, true);
  assert.equal(english.state.step === "email" && english.state.problem?.message, "이메일을 확인해 주세요");
});

test("인증번호 받기 실패 — 429 영어 원문은 남기지 않고, 500 은 다시 해도 안 풀린다고 알린다", () => {
  const throttled = requestPinFailure({ status: 429, message: "ThrottlerException: Too Many Requests" }, INITIAL_EMAIL_STATE, "x@y.z");
  assert.equal(throttled.log, false);
  const mailSetup = "메일 설정 문제로 인증 메일을 보내지 못했습니다. 관리자에게 문의해 주세요";
  const blocked = requestPinFailure({ status: 500, message: mailSetup }, INITIAL_EMAIL_STATE, "x@y.z");
  assert.equal(blocked.state.step === "email" && blocked.state.problem?.message, mailSetup);
  const broken = requestPinFailure({ status: 500, message: "Internal server error" }, INITIAL_EMAIL_STATE, "x@y.z");
  assert.match(broken.state.step === "email" ? (broken.state.problem?.message ?? "") : "", /근무지 점포에 알려 주세요/);
  // 다시 받기가 연결 실패면 인증번호 단계에 남아 버튼 위에 알린다.
  const offline = requestPinFailure("network", pin, pin.newEmail);
  assert.equal(offline.state.step, "pin");
  assert.equal(offline.state.step === "pin" && offline.state.feedback?.kind === "error" && offline.state.feedback.field, "form");
});

test("인증번호 확인 실패 — 400 은 인증번호 칸, 409 는 이메일 단계, 5xx 는 알리게, 429 는 버튼 위", () => {
  const wrong = confirmPinFailure({ status: 400, message: "핀이 올바르지 않거나 만료되었습니다" }, pin);
  assert.equal(wrong.state.step === "pin" && wrong.state.feedback?.kind === "error" && wrong.state.feedback.field, "pin");
  const taken = confirmPinFailure({ status: 409, message: "이미 쓰고 있는 이메일입니다" }, pin);
  assert.deepEqual(taken.state, { step: "email", newEmail: pin.newEmail, problem: { field: "newEmail", message: "이미 쓰고 있는 이메일입니다" } });
  const broken = confirmPinFailure({ status: 500, message: "Internal server error" }, pin);
  assert.match(broken.state.step === "pin" && broken.state.feedback?.kind === "error" ? broken.state.feedback.message : "", /근무지 점포에 알려 주세요/);
  const limited = confirmPinFailure({ status: 429, message: "ThrottlerException: Too Many Requests" }, pin);
  assert.equal(limited.state.step === "pin" && limited.state.feedback?.kind === "error" && limited.state.feedback.field, "form");
});

test("invalidPin — 비었거나 20자를 넘으면 인증번호 칸 오류", () => {
  assert.equal(invalidPin("123456", pin), null);
  assert.equal(invalidPin("", pin)?.feedback?.kind, "error");
  assert.notEqual(invalidPin("1".repeat(21), pin), null);
});
