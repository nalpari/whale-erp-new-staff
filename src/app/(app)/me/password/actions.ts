"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { failureOf, logFailure } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import { passwordChangeFailure, validatePasswordChange, type PasswordChangeState } from "@/lib/password-change";
import { authedRequest } from "@/lib/session";

/**
 * 비밀번호 변경(WHALEERP-194, api `POST /me/profile/password-change` 192). 바꾸면 이 기기의 로그인은 이어지고 다른 기기는
 * 다시 로그인한다. 성공하면 내 정보로 돌아가 알림을 띄운다. 거르기와 실패 처리는 lib/password-change.ts.
 */
export async function changePasswordAction(_previous: PasswordChangeState, formData: FormData): Promise<PasswordChangeState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const invalid = validatePasswordChange(currentPassword, newPassword, String(formData.get("newPasswordConfirmation") ?? ""));
  if (invalid) return invalid;
  try {
    // api 의 요청 한도는 계정과 IP 로 센다. 직원의 실제 IP 를 넘기지 않으면 모든 직원이 Next 서버 IP 하나의 한도를 나눠 쓴다.
    await authedRequest("/me/profile/password-change", {
      method: "POST",
      json: { currentPassword, newPassword },
      clientIp: clientIpFrom(await headers()),
    });
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const { state, log } = passwordChangeFailure(failure);
    if (log) logFailure("password-change", failure);
    return state;
  }
  // replace — 뒤로 가기로 비밀번호 칸에 다시 들르지 않게 한다.
  redirect("/me?changed=password", RedirectType.replace);
}
