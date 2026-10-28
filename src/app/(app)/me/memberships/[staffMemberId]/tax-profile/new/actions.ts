"use server";

import { headers } from "next/headers";
import { RedirectType, notFound, redirect } from "next/navigation";
import { failureOf, logFailure, type Schemas } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import {
  TAX_PROFILE_ALREADY_SUBMITTED,
  parseStaffMemberId,
  readTaxProfileForm,
  taxProfileCreateFailure,
  validateTaxProfileCreate,
  type TaxProfileEditState,
} from "@/lib/tax-profile";
import { authedRequest } from "@/lib/session";

/** 그사이 신고 정보가 생겼는지(동시에 두 번 보낸 처음 작성의 앞쪽이 저장됨). 다시 읽지 못하면 모른다 — false. */
async function savedMeanwhile(path: string): Promise<boolean> {
  try {
    return Boolean((await authedRequest<Schemas["MyTaxProfileResponseDto"]>(path)).taxProfile);
  } catch (error) {
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (failureOf(error)) return false;
    throw error;
  }
}

/**
 * 날인 뒤 신고 정보 처음 넣기(WHALEERP-150, api `PUT /me/memberships/:staffMemberId/tax-profile`). 주민등록번호 · 급여 계좌를 함께
 * 보내고 지금 비밀번호는 보내지 않는다(api #138 — 처음 작성은 비교하지 않고, 빈 문자열은 형식 400). 처음 작성을 두 번 동시에 보내
 * 뒤쪽이 400 CURRENT_PASSWORD_MISMATCH 를 받으면 다시 읽어 저장됐으면 완료로 간다. 이미 낸 신고 정보가 있는 소속에서 이 액션을
 * 부르면 먼저 조회해 보내지 않는다 — 비밀번호가 없어 api 도 고치지 않지만, 400 을 다시 읽기로 풀면 이번 값이 버려졌는데 완료로 보인다
 * (PR #42 리뷰). 그래서 다시 읽기는 조회와 저장 사이에 다른 제출이 먼저 저장된 경우에만 쓰인다.
 * staffMemberId 는 화면이 bind 로 붙인 값이지만 누구나 직접 부를 수 있어 다시 거른다. 주민등록번호 원문은 api 로만 보낸다.
 */
export async function createTaxProfileAction(
  rawStaffMemberId: string,
  _previous: TaxProfileEditState,
  formData: FormData,
): Promise<TaxProfileEditState> {
  const staffMemberId = parseStaffMemberId(rawStaffMemberId);
  if (staffMemberId === null) notFound();
  const checked = validateTaxProfileCreate(readTaxProfileForm(formData));
  if (!("body" in checked)) return checked;
  const path = `/me/memberships/${staffMemberId}/tax-profile`;
  try {
    if ((await authedRequest<Schemas["MyTaxProfileResponseDto"]>(path)).taxProfile)
      return { problem: { field: "form", message: TAX_PROFILE_ALREADY_SUBMITTED } };
    await authedRequest<Schemas["MyTaxProfileResponseDto"]>(path, {
      method: "PUT",
      json: checked.body,
      clientIp: clientIpFrom(await headers()),
    });
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    const { state, log, alreadySaved } = taxProfileCreateFailure(failure);
    if (!alreadySaved || !(await savedMeanwhile(path))) {
      // 남기는 것은 상태 코드와 api 의 사유뿐이다(api 는 사유에 넣은 값을 싣지 않는다). 처음 작성에 비밀번호 400 이 왔는데 다시 읽어도
      // 신고 정보가 없으면(또는 읽지 못하면) 예상 밖이라 남긴다.
      if (log || alreadySaved) logFailure("tax-profile-create", failure);
      return state;
    }
  }
  // replace — 뒤로 가기로 입력 칸에 다시 들르지 않게 한다.
  redirect(`${path}/new/done`, RedirectType.replace);
}
