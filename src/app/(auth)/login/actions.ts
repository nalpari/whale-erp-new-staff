"use server";

import { RedirectType, redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth";
import { getDeviceId, saveLogin } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

export interface LoginState {
  email: string;
  error?: string;
  /** 5번 틀려 5분 잠김. 요청 제한(429)과 메시지로 가른다. */
  locked?: boolean;
}

// api 의 잠금 메시지 앞부분(account-auth.service.ts LOCKED_MESSAGE). 요청 제한 429 는 Nest 기본 메시지다.
const LOCKED_MESSAGE_PREFIX = "로그인이 잠겼습니다";

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { email, error: "이메일과 비밀번호를 넣어 주세요" };

  try {
    const result = await login({ email, password, deviceIdentifier: await getDeviceId() });
    await saveLogin(result);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429 && error.message.startsWith(LOCKED_MESSAGE_PREFIX)) return { email, locked: true };
      if (error.status === 429) return { email, error: "시도가 많아 잠시 막았습니다. 잠시 뒤에 다시 시도해 주세요" };
      // 5xx 의 api 원문(Internal server error 등)은 보이지 않는다.
      if (error.status >= 500) return { email, error: "로그인하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
      // 400 은 이메일 형식 검증(class-validator, 영어 원문)이다.
      if (error.status === 400) return { email, error: "이메일 형식을 확인해 주세요" };
      // 401 「이메일 또는 비밀번호가 올바르지 않습니다」 — 틀림 · 없는 계정 · 탈퇴 모두 같다.
      return { email, error: error.message };
    }
    if (error instanceof TypeError) return { email, error: CONNECTION_FAILED_MESSAGE };
    throw error;
  }
  // 서버 액션의 redirect 는 기본이 push 다. 로그인 화면을 히스토리에 남기지 않는다.
  redirect("/home", RedirectType.replace);
}
