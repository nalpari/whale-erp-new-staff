"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { ApiError, failureOf, logFailure } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import { employedStoresOf, validateWithdrawal, withdrawalFailure, type WithdrawalState } from "@/lib/withdrawal";
import { authedRequest, clearSession, saveLoginEmail } from "@/lib/session";

/**
 * 회원 탈퇴(WHALEERP-770, api `POST /me/profile/withdrawal`). 204 면 api 가 접속을 모두 끝냈으니 이 기기의 쿠키만 지우고
 * 로그인 화면으로 보낸다. 거르기와 실패 처리는 lib/withdrawal.ts.
 */
export async function withdrawAction(_previous: WithdrawalState, formData: FormData): Promise<WithdrawalState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const invalid = validateWithdrawal(currentPassword);
  if (invalid) return invalid;
  try {
    await authedRequest("/me/profile/withdrawal", { method: "POST", json: { currentPassword }, clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    // 401(접속 종료 · 탈퇴 계정)의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const { state, log } = withdrawalFailure(failure);
    if (log) logFailure("withdrawal", failure);
    // 재직 근무지 목록은 409 본문에 있다.
    if (state.employed && error instanceof ApiError) return { employed: employedStoresOf(error.body) };
    return state;
  }
  await clearSession();
  // 아이디 저장 쿠키도 지운다 — 탈퇴한 이메일이 로그인 칸에 채워지지 않게(「지워지는 것: 이메일」 안내와 맞춘다). 로그아웃은 남긴다.
  await saveLoginEmail(null);
  // replace — 뒤로 가기로 탈퇴 화면에 다시 들르지 않게 한다.
  redirect("/login?withdrawn=1", RedirectType.replace);
}
