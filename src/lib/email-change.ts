// 이메일 변경(WHALEERP-195) 화면의 상태와 순수 계산 — 단계 전환, 실패를 화면 상태로 바꾸기. api 를 부르는 쪽은
// src/app/(app)/me/email/actions.ts 다. node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import {
  CONNECTION_FAILED,
  RATE_LIMITED,
  REPORT_IF_REPEATED,
  RETRY_LATER,
  isHangulReason,
  type ApiFailure,
  type Problem,
} from "./action-errors.ts";
import { CURRENT_PASSWORD_MISMATCH } from "./password-change.ts";

/** api 의 이메일 변경 핀 유효 시간(MyEmailChangeService PIN_LIFETIME_MS)과 다시 받기 간격(REISSUE_INTERVAL_MS). 안내용이고 판정은 api 가 한다. */
export const PIN_VALID_MS = 15 * 60 * 1000;
export const PIN_RESEND_MS = 60 * 1000;

/** 인증번호 단계의 알림. 오류(붙일 자리와 함께)와 안내(다시 받음)는 함께 오지 않는다. */
export type PinFeedback = ({ kind: "error" } & Problem<"pin" | "form">) | { kind: "notice"; message: string };

/**
 * 이메일 변경 화면 상태. 넣은 새 이메일은 쿠키에 두지 않고 이 상태로만 들고 있다 — 새로 고치면 처음부터 다시 받는다
 * (새 번호를 받으면 앞서 받은 번호는 더 쓸 수 없다).
 * - email: 새 이메일 · 지금 비밀번호 입력. problem 은 이메일 칸 아래(newEmail) · 비밀번호 칸 아래(currentPassword) 또는 버튼 위 알림(form).
 * 지금 비밀번호는 이 상태에 두지 않는다 — 서버 액션 상태는 화면으로 되돌아가므로, 화면이 들고 있다가 보낼 때마다 붙인다(WHALEERP-607).
 * - pin: 인증번호 입력. deadline · resendAt · serverNow 는 이 Next 서버의 시각이다(남은 시간 · 다시 받기 시계).
 */
export type EmailChangeState =
  | { step: "email"; newEmail: string; problem?: Problem<"newEmail" | "currentPassword" | "form"> }
  | { step: "pin"; newEmail: string; serverNow: number; deadline: number; resendAt: number; feedback?: PinFeedback };

export type PinState = Extract<EmailChangeState, { step: "pin" }>;

/** 실패를 바꾼 화면 상태와, 계약 어긋남으로 남길지. */
export interface FailureResult {
  state: EmailChangeState;
  log: boolean;
}

export const INITIAL_EMAIL_STATE: EmailChangeState = { step: "email", newEmail: "" };

const BAD_PIN = "인증번호가 맞지 않거나 만료되었습니다. 맞지 않으면 다시 받아 주세요";

/** 넣은 새 이메일. 대소문자는 api 가 가리지 않고 소문자로 저장하므로 보일 때도 같은 값이 되게 맞춘다. */
export const normalizeNewEmail = (raw: string) => raw.trim().toLowerCase();

/** api 에 보내기 전에 거를 모양 — 공백 없는 `x@y.z`, 254자 이하(RequestEmailChangePinDto). 판정은 api 의 IsEmail 이 한다. */
export const isEmailShape = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** 인증번호를 보냈다 — 시계는 지금부터 다시 센다. 다시 받았으면 안내를 단다. */
export function pinStep(newEmail: string, now: number, resent: boolean): PinState {
  return {
    step: "pin",
    newEmail,
    serverNow: now,
    deadline: now + PIN_VALID_MS,
    resendAt: now + PIN_RESEND_MS,
    feedback: resent ? { kind: "notice", message: "새 인증번호를 보냈습니다. 앞서 받은 번호는 더 쓸 수 없습니다" } : undefined,
  };
}

/** api 사유가 한글이면 그대로, 아니면 대체 문구. 429 는 요청 한도 가드의 영어 원문이 정상이라 남기지 않는다. */
function reasonOf(failure: { status: number; message: string }, fallback: string): { message: string; log: boolean } {
  if (isHangulReason(failure.message)) return { message: failure.message, log: false };
  return { message: fallback, log: failure.status !== 429 };
}

/**
 * 인증번호 받기(`POST /me/profile/email-change-pins`)의 실패. previous 가 인증번호 단계면 다시 받기다 — 그때는 시계를 그대로 두고
 * 버튼 위에 알린다(칸의 값이 틀린 것이 아니다). 400 형식 · 지금 이메일과 같음, 409 다른 계정이 씀은 이메일 단계의 칸으로 돌려보낸다.
 * 지금 비밀번호가 틀리면(400, 비밀번호 변경과 같은 사유) 이메일 단계의 비밀번호 칸이다. api 는 비밀번호를 이메일보다 먼저 본다.
 * 다시 받기 중이어도 같다 — 그 사이 다른 곳에서 비밀번호를 바꿨으면 다시 넣어야 한다.
 */
export function requestPinFailure(failure: ApiFailure, previous: EmailChangeState, newEmail: string): FailureResult {
  const form = (message: string, log: boolean): FailureResult => ({
    state:
      previous.step === "pin"
        ? { ...previous, feedback: { kind: "error", field: "form", message } }
        : { step: "email", newEmail, problem: { field: "form", message } },
    log,
  });
  if (failure === "network") return form(CONNECTION_FAILED, false);
  const { status } = failure;
  if (status === 400 && failure.message === CURRENT_PASSWORD_MISMATCH) {
    return { state: { step: "email", newEmail, problem: { field: "currentPassword", message: CURRENT_PASSWORD_MISMATCH } }, log: false };
  }
  if (status === 400 || status === 409) {
    const reason = reasonOf(failure, "이메일을 확인해 주세요");
    return { state: { step: "email", newEmail, problem: { field: "newEmail", message: reason.message } }, log: reason.log };
  }
  // 1분 간격 · 하루 10회 · 요청 한도(429), 메일 일시 장애(503)는 한글 사유를 그대로.
  if (status === 429) {
    const reason = reasonOf(failure, RATE_LIMITED);
    return form(reason.message, reason.log);
  }
  if (status === 503) {
    const reason = reasonOf(failure, `지금은 인증 메일을 보낼 수 없습니다. ${RETRY_LATER}`);
    return form(reason.message, reason.log);
  }
  // 503 을 뺀 5xx — api 는 보내기 전에 막히면(템플릿 꺼짐 등) 500 과 한글 사유(「…관리자에게 문의해 주세요」)를 준다(2026-10-20).
  // 그 사유는 그대로, 그 밖(Nest 기본 본문 · 게이트웨이)은 다시 해도 풀리지 않는다고 알린다. 5xx 는 request() 가 남겼다.
  if (status >= 500) return form(isHangulReason(failure.message) ? failure.message : `인증번호를 보내지 못했습니다. ${REPORT_IF_REPEATED}`, false);
  return form(`인증번호를 보내지 못했습니다. ${RETRY_LATER}`, true);
}

/**
 * 인증번호 확인(`POST /me/profile/email-change`)의 실패. 400 은 틀림 · 만료 · 5회로 닫힘 · 새 번호로 대체를 api 가 가르지 않는다
 * (401 이 아니라 400). 409 는 그 사이 다른 계정이 그 이메일을 쓰기 시작한 것이라 다른 이메일로 처음부터다.
 */
export function confirmPinFailure(failure: ApiFailure, previous: PinState): FailureResult {
  const form = (message: string, log: boolean): FailureResult => ({
    state: { ...previous, feedback: { kind: "error", field: "form", message } },
    log,
  });
  if (failure === "network") return form(CONNECTION_FAILED, false);
  const { status } = failure;
  if (status === 400) return { state: { ...previous, feedback: { kind: "error", field: "pin", message: BAD_PIN } }, log: false };
  if (status === 409) {
    const reason = reasonOf(failure, "이미 쓰고 있는 이메일입니다");
    return { state: { step: "email", newEmail: previous.newEmail, problem: { field: "newEmail", message: reason.message } }, log: reason.log };
  }
  if (status === 429) {
    const reason = reasonOf(failure, RATE_LIMITED);
    return form(reason.message, reason.log);
  }
  // 5xx(트랜잭션 · DB)는 핀 유효 시간 안에 되풀이해도 풀리지 않는다 — 인증번호 받기와 같이 알리게 한다.
  if (status >= 500) return form(`이메일을 바꾸지 못했습니다. ${REPORT_IF_REPEATED}`, false);
  return form(`이메일을 바꾸지 못했습니다. ${RETRY_LATER}`, true);
}

/** 넣은 인증번호를 거른다. 맞으면 null, 아니면 인증번호 칸 오류 상태. */
export function invalidPin(pin: string, previous: PinState): PinState | null {
  if (pin && pin.length <= 20) return null;
  return { ...previous, feedback: { kind: "error", field: "pin", message: "받은 인증번호를 넣어 주세요" } };
}

/**
 * 넣은 지금 비밀번호를 거른다. 맞으면 null, 아니면 비밀번호 칸 오류 상태. 128자는 api RequestEmailChangePinDto 의 상한이고,
 * 그보다 긴 값은 지금 비밀번호일 수 없어 틀렸다고 알린다(비밀번호 변경과 같다).
 */
export function invalidCurrentPassword(currentPassword: string, newEmail: string): EmailChangeState | null {
  if (currentPassword && currentPassword.length <= 128) return null;
  const message = currentPassword ? CURRENT_PASSWORD_MISMATCH : "지금 비밀번호를 넣어 주세요";
  return { step: "email", newEmail, problem: { field: "currentPassword", message } };
}

/** 형식이 틀린 새 이메일 — api 를 부르지 않고 이메일 칸에 알린다. */
export const badEmailShape = (newEmail: string): EmailChangeState => ({
  step: "email",
  newEmail,
  problem: { field: "newEmail", message: "이메일 형식을 확인해 주세요" },
});

/**
 * 폼의 intent 를 고른다. 인증번호 단계가 아닌데 온 confirm · resend(손으로 만든 요청)는 request 로 떨어진다 — 그러면 넣은
 * 새 이메일 칸(비었으면 형식 오류)을 다시 본다.
 */
export function intentOf(raw: FormDataEntryValue | null, previous: EmailChangeState): "edit" | "confirm" | "resend" | "request" {
  if (raw === "edit") return "edit";
  if ((raw === "confirm" || raw === "resend") && previous.step === "pin") return raw;
  return "request";
}
