"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { requestPasswordResetPin, resetPassword, verifyPasswordResetPin } from "@/lib/auth";
import { PIN_RESEND_MS, clearPasswordReset, readPasswordReset, savePasswordReset } from "@/lib/password-reset";
import { clearSession } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

/**
 * api 오류를 폼 문구로. 한글 사유를 주는 503(발송기 없음)과 401 은 api 메시지를 그대로 쓰고,
 * 영어 원문이 나오는 요청 제한(429) · 입력 검증(400) · 서버 오류(5xx)는 화면 문구로 바꾼다.
 * badInput 은 400 일 때 보일 문구다(이 단계에서 무엇을 확인하라고 할지).
 */
function messageOf(error: unknown, badInput: string): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "시도가 많아 잠시 막았습니다. 잠시 뒤에 다시 시도해 주세요";
    if (error.status === 400) return badInput;
    if (error.status >= 500 && error.status !== 503) return "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
    return error.message;
  }
  if (error instanceof TypeError) return CONNECTION_FAILED_MESSAGE;
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
    await requestPasswordResetPin(email);
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
    await requestPasswordResetPin(state.email);
  } catch (error) {
    return { error: messageOf(error, BAD_EMAIL) };
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
  if (!pin.trim()) return { pin, error: "인증번호를 넣어 주세요", issuedAt: state.issuedAt };
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
    return { pin, error: messageOf(error, BAD_PIN), issuedAt: state.issuedAt };
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
    else return { error: messageOf(error, "비밀번호를 확인해 주세요") };
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
