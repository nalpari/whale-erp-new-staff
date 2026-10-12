"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { ApiError, NetworkError } from "@/lib/api";
import { logout } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { clearSession, getSession } from "@/lib/session";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    try {
      await logout(session.accessToken, clientIpFrom(await headers()));
    } catch (error) {
      // api 가 어떤 오류를 내도 이 기기에서는 로그아웃해야 한다. 쿠키는 아래에서 지운다.
      if (!(error instanceof ApiError) && !(error instanceof NetworkError)) throw error;
      // 401 은 이미 끝난 접속이다. 그 밖(429 · 4xx)이면 api 쪽 접속(갱신 토큰)이 남았을 수 있어 남긴다
      // (5xx · 연결 실패는 request() 가 남겼다).
      if (error instanceof ApiError && error.status !== 401 && error.status < 500) {
        console.error("[logout] 서버 접속을 끝내지 못했습니다", error.status, error.message);
      }
    }
  }
  await clearSession();
  // 로그인과 같이 replace — 뒤로 가기로 로그인한 화면에 다시 들르지 않게 한다.
  redirect("/login", RedirectType.replace);
}
