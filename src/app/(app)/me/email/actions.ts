"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { failureOf, logFailure } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import {
  badEmailShape,
  confirmPinFailure,
  intentOf,
  invalidPin,
  isEmailShape,
  normalizeNewEmail,
  pinStep,
  requestPinFailure,
  type EmailChangeState,
  type PinState,
} from "@/lib/email-change";
import { getMyProfile } from "@/lib/my-profile";
import { authedRequest, getSavedLoginEmail, saveLoginEmail } from "@/lib/session";

/** 새 이메일로 인증번호 보내기(`POST /me/profile/email-change-pins`). 성공하면 인증번호 단계로. 실패 처리는 lib/email-change.ts. */
async function requestPin(newEmail: string, previous: EmailChangeState): Promise<EmailChangeState> {
  if (!isEmailShape(newEmail)) return badEmailShape(newEmail);
  try {
    // api 의 요청 한도는 계정과 IP 로 센다 — 직원의 실제 IP 를 넘긴다.
    await authedRequest("/me/profile/email-change-pins", { method: "POST", json: { newEmail }, clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const { state, log } = requestPinFailure(failure, previous, newEmail);
    if (log) logFailure("email-change", failure);
    return state;
  }
  return pinStep(newEmail, Date.now(), previous.step === "pin");
}

/** 인증번호로 바꾸기(`POST /me/profile/email-change`). 바꾸면 내 정보로 돌아가 알림을 띄운다. 지금 접속은 이어진다. */
async function confirmPin(pin: string, previous: PinState): Promise<EmailChangeState> {
  const invalid = invalidPin(pin, previous);
  if (invalid) return invalid;
  try {
    await authedRequest("/me/profile/email-change", { method: "POST", json: { pin }, clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    const { state, log } = confirmPinFailure(failure, previous);
    if (log) logFailure("email-change", failure);
    return state;
  }
  // 「아이디 저장」을 켜 두었으면 저장된 아이디도 새 이메일로 바꾼다 — 남겨 두면 다음 로그인 화면에 옛 이메일이 채워진다.
  // api 는 바꾼 이메일을 돌려주지 않아(204) 내 정보에서 다시 읽는다(화면이 보낸 이전 상태의 값은 믿지 않는다).
  // 읽기 전에 먼저 지운다 — 다시 읽다 401 로 만료 안내로 빠져도 옛 이메일이 남지 않는다. 옛 이메일이 채워지는 것보다 빈 칸이 낫다.
  // 그 밖의 실패는 삼킨다 — 이메일은 이미 바뀌었으니 오류 화면 대신 바꿨다는 알림으로 간다.
  if (await getSavedLoginEmail()) {
    await saveLoginEmail(null);
    try {
      await saveLoginEmail((await getMyProfile()).email);
    } catch (error) {
      const failure = failureOf(error);
      if (!failure) throw error;
      // 5xx · 연결 실패는 request() 가 이미 남겼다.
      if (failure !== "network" && failure.status < 500) logFailure("email-change", failure);
    }
  }
  // replace — 뒤로 가기로 인증번호 칸에 다시 들르지 않게 한다.
  redirect("/me?changed=email", RedirectType.replace);
}

/**
 * 이메일 변경 화면의 서버 액션 하나. intent 로 가른다 — request(인증번호 받기) · resend(다시 받기) · confirm(확인) ·
 * edit(이메일 다시 입력, api 를 부르지 않음).
 */
export async function emailChangeAction(previous: EmailChangeState, formData: FormData): Promise<EmailChangeState> {
  const intent = intentOf(formData.get("intent"), previous);
  if (intent === "edit") return { step: "email", newEmail: previous.newEmail };
  if (previous.step === "pin" && intent === "confirm") return confirmPin(String(formData.get("pin") ?? "").trim(), previous);
  if (previous.step === "pin" && intent === "resend") return requestPin(previous.newEmail, previous);
  return requestPin(normalizeNewEmail(String(formData.get("newEmail") ?? "")), { step: "email", newEmail: "" });
}
