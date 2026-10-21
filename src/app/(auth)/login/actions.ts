"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import { type AttemptLock, lockOf } from "@/lib/attempt-lock";
import { login } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { HOME_PATH, safeNextPath } from "@/lib/login-return";
import { readLoginForm } from "@/lib/login-input";
import { getDeviceId, saveLogin, saveLoginEmail } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

/**
 * 로그인 결과 — 넣은 이메일은 늘 들고, 그 위에 잠김 · 오류(붙일 자리와 함께) 중 하나만 온다.
 * - field: email 은 형식(400), password 는 틀림(401 — 이때만 잠금 안내를 함께 보인다), form 은 서버 · 연결 · 요청 제한처럼
 *   입력과 상관없는 오류(화면 위 안내).
 * - locked: 5번 틀려 5분 잠김. 해제 시각(lockExpiresAt, ms)과 그때의 서버 시각(serverNow)을 함께 든다. 요청 제한(429)과는
 *   본문의 lockExpiresAt 이 있는지로 가른다(메시지는 api 가 고칠 수 있어 보지 않는다).
 */
export type LoginState = { email: string } & (
  | { locked?: never; error?: never; field?: never }
  | ({ locked: true; error?: never; field?: never } & AttemptLock)
  | { locked?: never; error: string; field: "email" | "password" | "form" }
);

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const { email, password, saveEmail, autoLogin } = readLoginForm(formData);
  if (!email) return { email, error: "이메일을 넣어 주세요", field: "email" };
  if (!password) return { email, error: "비밀번호를 넣어 주세요", field: "password" };

  let result;
  try {
    // 자동 로그인 = rememberMe. 켜면 세션이 마지막 사용 후 30일, 끄면 7일이고 갱신도 그 길이로만 민다(api, 2026-10-20 노영주).
    result = await login({ email, password, deviceIdentifier: await getDeviceId(), rememberMe: autoLogin }, clientIpFrom(await headers()));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        const lock = lockOf(error);
        if (lock.kind === "locked") return { email, locked: true, ...lock.attemptLock };
        // 해제 시각 칸이 있는데 읽지 못하면 api 계약이 어긋난 것이다. 요청 제한 문구로 버티고 남긴다.
        if (lock.kind === "malformed") logUnexpected("login", error);
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
  // 쿠키 만료는 api 가 준 refreshTokenExpiresAt(30일 · 7일)을 그대로 쓴다.
  await saveLogin(result);
  // 아이디 저장 — api 와 같이 소문자로 둔다.
  await saveLoginEmail(saveEmail ? email.toLowerCase() : null);
  // 보던 화면으로 돌려보낸다(WHALEERP-166). 폼 값은 누구나 고쳐 보낼 수 있어 화면에서 거른 값도 다시 거른다.
  // 서버 액션의 redirect 는 기본이 push 다. 로그인 화면을 히스토리에 남기지 않는다.
  redirect(safeNextPath(String(formData.get("next") ?? "")) ?? HOME_PATH, RedirectType.replace);
}
