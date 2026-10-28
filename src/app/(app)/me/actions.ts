"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { ApiError, NetworkError, failureOf, logFailure, logUnexpected } from "@/lib/api";
import { logout } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { CONSENT_CHANGES, addressSaveFailure, consentChangeFailure, isConsentChange, parseAddress, type ConsentChange } from "@/lib/profile";
import { authedRequest, clearSession, getSession } from "@/lib/session";

/** 주소 저장 결과 — 오류와 저장함 중 하나만. savedAt 은 성공할 때마다 바뀌어 화면이 토스트를 다시 띄운다. */
export type AddressSaveState = { error?: never; savedAt?: never } | { error: string; savedAt?: never } | { savedAt: number; error?: never };

/** 주소 저장(WHALEERP-189 · 193, `PUT /me/profile/address`). 실패해도 넣은 값은 화면이 들고 있다. */
export async function saveAddressAction(_previous: AddressSaveState, formData: FormData): Promise<AddressSaveState> {
  const input = parseAddress(
    String(formData.get("zipCode") ?? ""),
    String(formData.get("address") ?? ""),
    String(formData.get("addressDetail") ?? ""),
  );
  if (!input.ok) return { error: input.error };
  try {
    await authedRequest("/me/profile/address", { method: "PUT", json: input.value, clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const { error: message, log } = addressSaveFailure(failure);
    if (log) logFailure("address", failure);
    return { error: message };
  }
  refresh();
  return { savedAt: Date.now() };
}

/** 동의 바꾸기 결과. 끝난 뒤 알림 문구는 화면이 CONSENT_CHANGES 에서 읽는다(출처 한 곳). */
export type ConsentChangeResult = { ok: true } | { ok: false; error: string };

/** 위치정보 동의 · 일시 중지 · 다시 켜기 · 철회, 본사 제공 동의 · 철회(ATT-23 · 26 · 30). 성공하거나 상태가 낡았으면(409) 화면을 다시 받는다. */
export async function changeConsentAction(change: ConsentChange): Promise<ConsentChangeResult> {
  // 서버 액션은 누구나 직접 부를 수 있어 값을 다시 거른다.
  if (!isConsentChange(change)) return { ok: false, error: "잘못된 요청입니다" };
  try {
    await authedRequest(CONSENT_CHANGES[change].path, { method: "POST", clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    const result = consentChangeFailure(failure);
    if (result.log) logFailure(`consent:${change}`, failure);
    if (result.refresh) refresh();
    return { ok: false, error: result.error };
  }
  refresh();
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    try {
      await logout(session.accessToken, clientIpFrom(await headers()));
    } catch (error) {
      // api 가 어떤 오류를 내도 이 기기에서는 로그아웃해야 한다. 쿠키는 finally 에서 지운다.
      if (!(error instanceof ApiError) && !(error instanceof NetworkError)) throw error;
      // 401 은 이미 끝난 접속이다. 그 밖(429 · 4xx)이면 api 쪽 접속(갱신 토큰)이 남았을 수 있어 남긴다
      // (5xx · 연결 실패는 request() 가 남겼다).
      if (error instanceof ApiError && error.status !== 401 && error.status < 500) logUnexpected("logout", error);
    } finally {
      // 설정 오류처럼 다시 던지는 오류여도 이 기기의 쿠키는 지운다(공용 기기에서 로그인이 남지 않게).
      await clearSession();
    }
  } else {
    await clearSession();
  }
  // 로그인과 같이 replace — 뒤로 가기로 로그인한 화면에 다시 들르지 않게 한다.
  redirect("/login", RedirectType.replace);
}
