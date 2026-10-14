"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import { login } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { HOME_PATH, safeNextPath } from "@/lib/login-return";
import { getDeviceId, saveLogin } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

export interface LoginState {
  email: string;
  error?: string;
  /**
   * 오류를 붙일 자리. email 은 형식(400), password 는 틀림(401 — 이때만 잠금 안내를 함께 보인다),
   * form 은 서버 · 연결 · 요청 제한처럼 입력과 상관없는 오류(화면 위 안내).
   */
  field?: "email" | "password" | "form";
  /** 5번 틀려 5분 잠김. 요청 제한(429)과 메시지로 가른다. */
  locked?: boolean;
}

// api 의 잠금 메시지 앞부분(account-auth.service.ts LOCKED_MESSAGE). 요청 제한 429 는 Nest 기본 메시지다.
const LOCKED_MESSAGE_PREFIX = "로그인이 잠겼습니다";

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) return { email, error: "이메일을 넣어 주세요", field: "email" };
  if (!password) return { email, error: "비밀번호를 넣어 주세요", field: "password" };

  let result;
  try {
    result = await login({ email, password, deviceIdentifier: await getDeviceId() }, clientIpFrom(await headers()));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429 && error.message.startsWith(LOCKED_MESSAGE_PREFIX)) return { email, locked: true };
      if (error.status === 429) {
        return { email, error: "시도가 많아 잠시 막았습니다. 잠시 뒤에 다시 시도해 주세요", field: "form" };
      }
      // 400 은 이메일 형식 검증(class-validator, 영어 원문)이다.
      if (error.status === 400) return { email, error: "이메일 형식을 확인해 주세요", field: "email" };
      // 401 「이메일 또는 비밀번호가 올바르지 않습니다」 — 틀림 · 없는 계정 · 탈퇴 모두 같다.
      if (error.status === 401) return { email, error: error.message, field: "password" };
      // 5xx 는 request() 가 남겼다. 그 밖(404 등 api 버전 어긋남)은 원문이 영어일 수 있어 일반 문구로 바꾸고 남긴다.
      if (error.status < 500) logUnexpected("login", error);
      return { email, error: "로그인하지 못했습니다. 잠시 뒤 다시 시도해 주세요", field: "form" };
    }
    if (error instanceof NetworkError) return { email, error: CONNECTION_FAILED_MESSAGE, field: "form" };
    throw error;
  }
  // 저장은 try 밖이다. 여기서 나는 오류는 api 응답 모양이 바뀐 결함이라 연결 실패로 숨기지 않고 오류 화면으로 보낸다.
  await saveLogin(result);
  // 보던 화면으로 돌려보낸다(WHALEERP-166). 폼 값은 누구나 고쳐 보낼 수 있어 화면에서 거른 값도 다시 거른다.
  // 서버 액션의 redirect 는 기본이 push 다. 로그인 화면을 히스토리에 남기지 않는다.
  redirect(safeNextPath(String(formData.get("next") ?? "")) ?? HOME_PATH, RedirectType.replace);
}
