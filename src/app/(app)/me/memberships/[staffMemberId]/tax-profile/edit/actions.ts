"use server";

import { headers } from "next/headers";
import { RedirectType, notFound, redirect } from "next/navigation";
import { failureOf, logFailure, type Schemas } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import {
  parseStaffMemberId,
  readTaxProfileForm,
  taxProfileEditBlocked,
  taxProfileSaveFailure,
  validateTaxProfileEdit,
  type TaxProfileEditState,
} from "@/lib/tax-profile";
import { authedRequest } from "@/lib/session";

/**
 * 신고 정보 고치기(WHALEERP-333, api `PUT /me/memberships/:staffMemberId/tax-profile` 334). 주민등록번호만 · 급여 계좌만 · 둘 다를
 * 보낸다 — 비워 둔 쪽은 본문에 넣지 않아 그대로다. 먼저 조회해 신고 정보가 없으면 보내지 않는다(첫 입력은 150 몫). 성공하면 보기 화면으로 돌아가 새 가린 값과 알림을 띄운다.
 * staffMemberId 는 화면이 bind 로 붙인 값이지만 누구나 직접 부를 수 있어 다시 거른다(내 소속인지는 api 가 본다).
 * 주민등록번호 원문은 api 로만 보낸다 — 돌려주는 상태 · 로그 · 주소에 싣지 않는다.
 */
export async function saveTaxProfileAction(
  rawStaffMemberId: string,
  _previous: TaxProfileEditState,
  formData: FormData,
): Promise<TaxProfileEditState> {
  const staffMemberId = parseStaffMemberId(rawStaffMemberId);
  if (staffMemberId === null) notFound();
  const checked = validateTaxProfileEdit(readTaxProfileForm(formData));
  if (!("body" in checked)) return checked;
  const path = `/me/memberships/${staffMemberId}/tax-profile`;
  try {
    // WHALEERP-333 첫 입력은 날인 뒤 흐름 150 몫(2026-10-23 노영주) — 이미 낸 신고 정보가 있을 때만 고친다. 없으면 PUT 하지 않는다(셋 다 보내면 api 는 처음 작성으로 받는다).
    const blocked = taxProfileEditBlocked(await authedRequest<Schemas["MyTaxProfileResponseDto"]>(path));
    if (blocked) return blocked;
    await authedRequest<Schemas["MyTaxProfileResponseDto"]>(path, {
      method: "PUT",
      json: checked.body,
      clientIp: clientIpFrom(await headers()),
    });
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const { state, log } = taxProfileSaveFailure(failure);
    // 남기는 것은 상태 코드와 api 의 사유뿐이다(api 는 사유에 넣은 값을 싣지 않는다).
    if (log) logFailure("tax-profile", failure);
    return state;
  }
  // replace — 뒤로 가기로 입력 칸에 다시 들르지 않게 한다. 보기 화면은 캐시하지 않아 새 가린 값을 다시 받는다.
  redirect(`/me/memberships/${staffMemberId}/tax-profile?changed=1`, RedirectType.replace);
}
