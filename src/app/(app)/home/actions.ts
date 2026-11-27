"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { failureOf, logFailure } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import { authedRequest } from "@/lib/session";
import { termsAgreementBody, termsAgreementFailure, type ShownTermsVersions } from "@/lib/staff-terms";

/** 홈 약관 동의 결과. 실패 문구가 없으면(이미 동의함) 홈을 다시 받아 팝업이 내려간다. */
export type TermsAgreementResult = { ok: true } | { ok: false; error?: string };

/**
 * 홈 약관 동의(`POST /me/terms-agreement`, 운영 정책 ACC-23 · WHALEERP-774) — 약관 동의를 받기 전에 가입한 직원이 한다. 팝업이 보인 약관
 * 버전 셋을 싣는다 — 그사이 약관이 바뀌었으면 api 가 409 로 거절하고, 다시 받은 홈이 새 약관으로 팝업을 그린다(위치정보 동의와 같다).
 * 성공하면 홈을 다시 받아 「약관 동의 필요」가 풀려 팝업이 내려간다.
 */
export async function agreeTermsAction(versions: ShownTermsVersions, marketingAgreed: boolean): Promise<TermsAgreementResult> {
  // 서버 액션은 누구나 직접 부를 수 있어 값을 다시 거른다.
  const json = termsAgreementBody(versions, marketingAgreed);
  if (!json) return { ok: false, error: "잘못된 요청입니다" };
  try {
    await authedRequest("/me/terms-agreement", { method: "POST", json, clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const result = termsAgreementFailure(failure);
    if (result.log) logFailure("terms-agreement", failure);
    if (result.refresh) refresh();
    return { ok: false, error: result.error };
  }
  refresh();
  return { ok: true };
}
