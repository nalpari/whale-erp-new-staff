"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { requestPasswordResetPin, resetPassword, verifyPasswordResetPin } from "@/lib/auth";
import { PIN_RESEND_MS, clearPasswordReset, readPasswordReset, savePasswordReset } from "@/lib/password-reset";
import { clearSession } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

/** api 오류를 폼 문구로. 503(발송기 없음) · 400(형식)은 api 메시지를 그대로 쓴다. */
function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return CONNECTION_FAILED_MESSAGE;
  throw error;
}

export interface RequestPinState {
  email: string;
  error?: string;
}

export async function requestPinAction(_previous: RequestPinState, formData: FormData): Promise<RequestPinState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { email, error: "이메일을 넣어 주세요" };
  try {
    await requestPasswordResetPin(email);
  } catch (error) {
    return { email, error: messageOf(error) };
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
    await requestPasswordResetPin(state.email);
  } catch (error) {
    return { error: messageOf(error) };
  }
  await savePasswordReset({ email: state.email, issuedAt: Date.now() });
  return { notice: "새 인증번호를 보냈습니다. 앞서 받은 인증번호는 쓸 수 없습니다" };
}

export interface PinState {
  pin: string;
  error?: string;
  /** 이 결과가 나온 핀의 발급 시각. 다시 받은 뒤에는 앞 핀의 오류를 숨기는 데 쓴다. */
  issuedAt?: number;
}

export async function verifyPinAction(_previous: PinState, formData: FormData): Promise<PinState> {
  // 앞뒤 공백 · 대소문자는 api 가 정리한다. 화면은 입력한 그대로 보낸다.
  const pin = String(formData.get("pin") ?? "");
  const state = await readPasswordReset();
  if (!state) redirect("/password-reset");
  if (!pin.trim()) return { pin, error: "인증번호를 넣어 주세요" };
  try {
    await verifyPasswordResetPin({ email: state.email, pin });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return {
        pin,
        error: "인증번호가 맞지 않거나 만료되었습니다. 다섯 번 틀리면 새로 받아야 합니다",
        issuedAt: state.issuedAt,
      };
    }
    return { pin, error: messageOf(error), issuedAt: state.issuedAt };
  }
  await savePasswordReset({ ...state, pin });
  redirect("/password-reset/new-password");
}

export interface NewPasswordState {
  error?: string;
}

export async function resetPasswordAction(_previous: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("newPasswordConfirmation") ?? "");
  const state = await readPasswordReset();
  if (!state?.pin) redirect("/password-reset");
  if (newPassword !== confirmation) return { error: "두 칸의 비밀번호가 다릅니다" };
  let timedOut = false;
  try {
    await resetPassword({ email: state.email, pin: state.pin, newPassword });
  } catch (error) {
    // 400: 규칙 위반. 핀은 그대로라 이 자리에서 다시 입력한다. 사유는 api 메시지.
    if (error instanceof ApiError && error.status === 400) return { error: error.message };
    // 401: 10분이 지났거나 핀이 닫혔다. 앞서 받은 핀은 다시 쓸 수 없어 핀 요청의 「시간이 지났습니다」로 보낸다.
    // (쿠키를 지운 뒤 이 화면에 머물면 다시 그려지면서 쿠키가 없어 /password-reset 으로 튕긴다.)
    if (error instanceof ApiError && error.status === 401) timedOut = true;
    else return { error: messageOf(error) };
  }
  if (timedOut) {
    await clearPasswordReset();
    redirect("/password-reset?timeout=1");
  }
  // 모든 기기의 접속이 끊겼다. 이 기기의 쿠키도 지운다.
  await clearPasswordReset();
  await clearSession();
  redirect("/login?reset=1");
}
