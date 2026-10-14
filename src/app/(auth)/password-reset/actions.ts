"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import {
  requestPasswordResetPin,
  resetPassword,
  resetPasswordWithLink,
  verifyPasswordResetLink,
  verifyPasswordResetPin,
} from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { PIN_RESEND_MS, clearPasswordReset, readPasswordReset, savePasswordReset } from "@/lib/password-reset";
import {
  LINK_TOKEN_MAX_LENGTH,
  clearPasswordResetLink,
  readPasswordResetLink,
  savePasswordResetLink,
} from "@/lib/password-reset-link";
import { clearSession } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

/**
 * api 오류를 폼 문구로. 한글 사유를 주는 503(발송기 없음)만 api 메시지를 그대로 쓰고,
 * 요청 제한(429) · 입력 검증(400) · 그 밖의 상태(5xx · 404 등, 원문이 영어일 수 있음)는 화면 문구로 바꾼다.
 * 401 은 단계마다 뜻이 달라 부르는 쪽이 먼저 처리한다. badInput 은 400 일 때 보일 문구다(이 단계에서 무엇을 확인하라고 할지).
 * scope 는 예상하지 못한 응답 로그의 머리 — 핀 흐름과 링크 흐름을 로그에서 가른다.
 */
function messageOf(error: unknown, badInput: string, scope = "password-reset"): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "시도가 많아 잠시 막았습니다. 잠시 뒤에 다시 시도해 주세요";
    if (error.status === 400) return badInput;
    if (error.status === 503) return error.message;
    // 5xx 는 request() 가 남겼다. 예상하지 못한 4xx 는 여기서 남긴다.
    if (error.status < 500) logUnexpected(scope, error);
    return "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
  }
  if (error instanceof NetworkError) return CONNECTION_FAILED_MESSAGE;
  throw error;
}

const BAD_EMAIL = "이메일 형식을 확인해 주세요";
const BAD_PIN = "인증번호를 확인해 주세요";

export interface RequestPinState {
  email: string;
  error?: string;
}

export async function requestPinAction(_previous: RequestPinState, formData: FormData): Promise<RequestPinState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { email, error: "이메일을 넣어 주세요" };
  // 같은 이메일로 1분 안에 다시 요청하면(뒤로 가기 뒤 다시 제출 등) api 는 보내지 않고 204 를 준다.
  // 시계를 새로 세면 실제 핀보다 늦게 끝나므로 부르지 않고 앞서 받은 핀의 화면으로 돌려보낸다.
  const previous = await readPasswordReset();
  if (previous && previous.email.toLowerCase() === email.toLowerCase() && Date.now() - previous.issuedAt < PIN_RESEND_MS) {
    redirect("/password-reset/pin");
  }
  try {
    await requestPasswordResetPin(email, clientIpFrom(await headers()));
  } catch (error) {
    return { email, error: messageOf(error, BAD_EMAIL) };
  }
  await savePasswordReset({ email, issuedAt: Date.now() });
  redirect("/password-reset/pin");
}

export interface ResendState {
  notice?: string;
  error?: string;
}

// useActionState 가 (이전 상태, 폼) 을 넘기지만 쓰지 않는다.
export async function resendPinAction(): Promise<ResendState> {
  const state = await readPasswordReset();
  if (!state) redirect("/password-reset");
  // 1분 안이면 api 가 보내지 않고 204 를 준다. 보냈다고 말하지 않도록 여기서 먼저 막는다(화면도 버튼을 막는다).
  if (Date.now() - state.issuedAt < PIN_RESEND_MS) return { error: "1분 뒤에 다시 받을 수 있습니다" };
  try {
    await requestPasswordResetPin(state.email, clientIpFrom(await headers()));
  } catch (error) {
    return { error: messageOf(error, BAD_EMAIL) };
  }
  await savePasswordReset({ email: state.email, issuedAt: Date.now() });
  return { notice: "새 인증번호를 보냈습니다. 앞서 받은 인증번호는 쓸 수 없습니다" };
}

/**
 * 핀 확인 결과. 오류에는 그 오류가 나온 핀의 발급 시각이 꼭 붙는다 — 화면은 다시 받은 뒤 앞 핀의 오류를 숨기려고
 * 발급 시각이 같을 때만 오류를 보이므로, 발급 시각 없는 오류는 아무 표시 없이 사라진다. 타입으로 빠뜨리지 못하게 묶었다.
 */
export type PinState = { pin: string } | { pin: string; error: string; issuedAt: number };

export async function verifyPinAction(_previous: PinState, formData: FormData): Promise<PinState> {
  // 앞뒤 공백 · 대소문자는 api 가 정리한다. 화면은 입력한 그대로 보낸다.
  const pin = String(formData.get("pin") ?? "");
  const state = await readPasswordReset();
  if (!state) redirect("/password-reset");
  if (!pin.trim()) return { pin, error: "인증번호를 넣어 주세요", issuedAt: state.issuedAt };
  try {
    await verifyPasswordResetPin({ email: state.email, pin }, clientIpFrom(await headers()));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return {
        pin,
        error: "인증번호가 맞지 않거나 만료되었습니다. 다섯 번 틀리면 새로 받아야 합니다",
        issuedAt: state.issuedAt,
      };
    }
    return { pin, error: messageOf(error, BAD_PIN), issuedAt: state.issuedAt };
  }
  await savePasswordReset({ ...state, pin });
  // 핀 화면을 히스토리에 남기지 않는다. 뒤로 가기로 돌아오면 처음 그린 서버 시각으로 다시 그려져 남은 시간이 틀린다.
  redirect("/password-reset/new-password", RedirectType.replace);
}

export interface NewPasswordState {
  error?: string;
  /** 오류를 붙일 칸. 규칙 위반은 새 비밀번호 칸, 두 칸이 다르거나 그 밖의 오류는 확인 칸(버튼 바로 위)이다. */
  field?: "newPassword" | "confirmation";
}

// 한글이 든 api 메시지만 그대로 보인다. 규칙 위반 사유는 한글이지만, 형식 검증(class-validator) 400 은 영어 원문이다.
const HANGUL = /[가-힣]/;

/** 새 비밀번호 400. 영어 원문(형식 검증)은 화면과 api 의 계약이 어긋난 신호라 남기고 대체 문구를 보인다. */
function ruleViolation(error: ApiError, scope: string): NewPasswordState {
  if (HANGUL.test(error.message)) return { error: error.message, field: "newPassword" };
  logUnexpected(scope, error);
  return { error: "비밀번호 조건을 확인해 주세요", field: "newPassword" };
}

export async function resetPasswordAction(_previous: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("newPasswordConfirmation") ?? "");
  const state = await readPasswordReset();
  if (!state?.pin) redirect("/password-reset");
  if (newPassword !== confirmation) return { error: "두 칸의 비밀번호가 다릅니다", field: "confirmation" };
  let timedOut = false;
  try {
    await resetPassword({ email: state.email, pin: state.pin, newPassword }, clientIpFrom(await headers()));
  } catch (error) {
    // 400: 규칙 위반. 핀은 그대로라 이 자리에서 다시 입력한다. 사유는 api 메시지(한글일 때만).
    if (error instanceof ApiError && error.status === 400) return ruleViolation(error, "password-reset");
    // 401: 10분이 지났거나 핀이 닫혔거나 이미 썼다(api 가 가르지 않음). 앞서 받은 핀은 다시 쓸 수 없어 쿠키를 지우는데,
    // 그러면 이 화면은 다시 그려질 때 /password-reset 으로 튕기므로 상태로 돌려주지 않고 「시간이 지났습니다」로 보낸다.
    if (error instanceof ApiError && error.status === 401) timedOut = true;
    else return { error: messageOf(error, "비밀번호를 확인해 주세요"), field: "confirmation" };
  }
  if (timedOut) {
    await clearPasswordReset();
    redirect("/password-reset?timeout=1");
  }
  // 모든 기기의 접속이 끊겼고 남은 재설정 링크도 닫혔다. 이 기기의 쿠키도 지운다.
  await clearPasswordReset();
  await clearPasswordResetLink();
  await clearSession();
  redirect("/login?reset=1");
}

// 관리자가 보낸 재설정 링크(WHALEERP-173). 토큰은 주소의 fragment 라 화면이 읽어 넘기고, 확인되면 httpOnly 쿠키로 옮긴다.

export type OpenLinkState = { status: "ready" } | { status: "invalid" } | { status: "error"; error: string };

/**
 * 링크를 열 때 부른다. fromHash 는 주소의 `#token=` 값(확인을 마친 뒤 새로고침하면 없다). 주소에 토큰이 있으면 그것을, 없으면 앞서
 * 쿠키에 둔 것을 확인한다 — 새 링크를 누르면 앞 링크의 쿠키보다 새 링크가 앞선다. 쓸 수 있으면 쿠키에 두고 ready, 쓸 수 없으면
 * (401 · 400 · 빈 값 · 200자 초과) 쿠키를 지우고 invalid, 확인하지 못하면(429 · 5xx · 연결 실패) 쿠키를 둔 채 error.
 */
export async function openLinkAction(fromHash: string | null): Promise<OpenLinkState> {
  // 서버 액션은 누구나 아무 값으로 부를 수 있다. 문자열이 아니면 주소에 토큰이 없는 것으로 본다.
  // `#token=` 이면 get("token") 이 빈 문자열을 준다. 이것도 문자열이라 앞 링크의 쿠키로 넘어가지 않는다(깨진 링크) — `||` 로 줄이지 않는다.
  const token = typeof fromHash === "string" ? fromHash : await readPasswordResetLink();
  // 200자를 넘으면 api 는 400(형식)이다. 쓸 수 없는 링크와 같게 본다.
  if (!token || token.length > LINK_TOKEN_MAX_LENGTH) {
    await clearPasswordResetLink();
    return { status: "invalid" };
  }
  try {
    await verifyPasswordResetLink({ token }, clientIpFrom(await headers()));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
      // 빈 값 · 200자 초과는 위에서 걸렀다. 그래도 400 이면 api 계약이 바뀐 것이라 남긴다(화면은 같은 안내).
      if (error.status === 400) logUnexpected("password-reset-link", error);
      await clearPasswordResetLink();
      return { status: "invalid" };
    }
    return { status: "error", error: messageOf(error, "링크를 확인하지 못했습니다", "password-reset-link") };
  }
  await savePasswordResetLink(token);
  return { status: "ready" };
}

/** invalid 면 링크를 더 쓸 수 없어 화면이 쓸 수 없는 링크 안내로 바뀐다. 폼 오류와 함께 오지 않는다. */
export type LinkPasswordState = NewPasswordState | { invalid: true };

export async function resetPasswordWithLinkAction(_previous: LinkPasswordState, formData: FormData): Promise<LinkPasswordState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("newPasswordConfirmation") ?? "");
  // 30분이 지나 쿠키가 없어졌으면 링크를 다시 눌러야 한다. 링크 자체는 아직 쓸 수 있을 수 있지만 토큰을 다시 얻을 길이 없다.
  // 확인 직후인데도 없으면 쿠키가 저장되지 않은 것이다(http 에서 secure 쿠키 · 쿠키 차단). 몰리면 알 수 있게 남긴다.
  const token = await readPasswordResetLink();
  if (!token) {
    console.warn("[password-reset-link] 저장할 때 링크 쿠키가 없습니다");
    return { invalid: true };
  }
  if (newPassword !== confirmation) return { error: "두 칸의 비밀번호가 다릅니다", field: "confirmation" };
  try {
    await resetPasswordWithLink({ token, newPassword }, clientIpFrom(await headers()));
  } catch (error) {
    // 400: 규칙 위반. 링크는 그대로라 이 자리에서 다시 입력한다. 사유는 api 메시지(한글일 때만).
    if (error instanceof ApiError && error.status === 400) return ruleViolation(error, "password-reset-link");
    // 401: 그사이 기한이 지났거나, 관리자가 새 링크를 보냈거나, 다른 링크 · 인증번호로 이미 정했다(api 가 가르지 않음).
    if (error instanceof ApiError && error.status === 401) {
      await clearPasswordResetLink();
      return { invalid: true };
    }
    return { error: messageOf(error, "비밀번호를 확인해 주세요", "password-reset-link"), field: "confirmation" };
  }
  // 모든 기기의 접속이 끊겼고 남은 링크 · 인증번호도 닫혔다. 이 기기의 쿠키도 지운다.
  await clearPasswordResetLink();
  await clearPasswordReset();
  await clearSession();
  redirect("/login?reset=1");
}
