"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { logout } from "@/lib/auth";
import { clearSession, getSession } from "@/lib/session";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    try {
      await logout(session.accessToken);
    } catch (error) {
      // 이미 끝난 접속(401)이나 api 미기동이어도 이 기기에서는 로그아웃해야 한다. 쿠키는 아래에서 지운다.
      if (!(error instanceof ApiError) && !(error instanceof TypeError)) throw error;
    }
  }
  await clearSession();
  redirect("/login");
}
