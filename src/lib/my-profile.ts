import { connection } from "next/server";

import { requestsLoadFailure } from "./affiliation-requests";
import { STAFF_TERMS } from "./staff-terms";
import { ApiError, NetworkError, failureOf, logFailure, logUnexpected, request, type Schemas } from "./api";
import type { ContractListItem } from "./contracts";
import { kstToday } from "./join";
import { paperSignedMemberships, taxProfileDueOf } from "./paper-tax-profile";
import { authedRequest } from "./session";

/** 내 정보(`GET /me/profile`). 이 화면의 뼈대라 실패하면 그대로 던져 error.tsx 가 받는다. */
export const getMyProfile = () => authedRequest<Schemas["MyProfileResponseDto"]>("/me/profile");

/** 5xx · 연결 실패만 null 로 바꾼다 — 그 칸만 「불러오지 못했다」로 보이고 화면 전체를 오류로 만들지 않는다. 그 밖은 던진다. */
async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return null;
    throw error;
  }
}

/** 다른 화면(홈)이 지금 이메일 같은 값을 곁들일 때. 5xx · 연결 실패면 null — 부른 쪽이 로그인 때 값으로 대신한다. 그 밖은 던진다. */
export const getMyProfileOrNull = () => orNull(getMyProfile);

/**
 * 한 줄 곁들임(출퇴근의 일시 중지 시각, 가입 완료의 생년월일)이라 없어도 화면이 서는 곳. 401(만료 안내) 밖의 실패는 모두 null 이고
 * 그 줄만 뺀다 — 예상 밖 4xx 는 남긴다(requestsLoadFailure, 소속 추가 확인 요청과 같은 규칙).
 */
export async function getMyProfileForExtra(scope: string): Promise<Schemas["MyProfileResponseDto"] | null> {
  try {
    return await getMyProfile();
  } catch (error) {
    const failure = failureOf(error);
    const handling = requestsLoadFailure(failure);
    if (handling === "throw") throw error;
    if (handling === "log" && failure) logFailure(scope, failure);
    return null;
  }
}

/**
 * 소속 근무지(`GET /me/memberships`). 퇴직한 근무지는 빠진다 — 출퇴근 · 홈 · 근무지 선택기가 쓴다. includeRetired 면 퇴직한 근무지도
 * 지금 소속 뒤에 퇴직일 최근 순으로 받는다(내 정보 - 소속 근무지, WHALEERP-604).
 */
export const getMyMemberships = (includeRetired = false) =>
  orNull(() =>
    authedRequest<Schemas["MyMembershipListResponseDto"]>(`/me/memberships${includeRetired ? "?includeRetired=true" : ""}`),
  );

/** 소속 목록을 곁들임으로 받을 때(가입 완료 · 근무지 추가 완료의 신고 정보 안내) — 401(만료 안내) 밖의 실패는 모두 null(getMyProfileForExtra 와 같은 규칙). */
export async function getMyMembershipsForExtra(scope: string): Promise<Schemas["MyMembershipListResponseDto"] | null> {
  try {
    return await authedRequest<Schemas["MyMembershipListResponseDto"]>("/me/memberships");
  } catch (error) {
    const failure = failureOf(error);
    const handling = requestsLoadFailure(failure);
    if (handling === "throw") throw error;
    if (handling === "log" && failure) logFailure(scope, failure);
    return null;
  }
}

/**
 * 살아 있는 소속 추가 확인 요청(`GET /me/affiliation-requests`, WHALEERP-144). 없으면 빈 배열. 401(만료 안내로 보냄) 밖의 실패는
 * 모두 null 이다(requestsLoadFailure) — 다른 조회와 달리 4xx 도 화면을 깨지 않는다.
 */
export async function getMyAffiliationRequests(): Promise<Schemas["AffiliationRequestDto"][] | null> {
  try {
    return await authedRequest<Schemas["AffiliationRequestDto"][]>("/me/affiliation-requests");
  } catch (error) {
    const failure = failureOf(error);
    const handling = requestsLoadFailure(failure);
    if (handling === "throw") throw error;
    if (handling === "log" && failure) logFailure("affiliation-requests", failure);
    return null;
  }
}

/**
 * 그 소속의 신고 정보(`GET /me/memberships/:staffMemberId/tax-profile`). 미제출이면 `taxProfile: null`(200)이다.
 * 내 소속이 아니면(퇴직 · 남의 id 등) 404 — 부른 쪽이 notFound 로 바꾼다. 키가 없거나(503) 풀 수 없으면(500) null.
 */
export const getMyTaxProfile = (staffMemberId: number) =>
  orNull(() => authedRequest<Schemas["MyTaxProfileResponseDto"]>(`/me/memberships/${staffMemberId}/tax-profile`));

/**
 * 서명 완료 종이 계약이 있는 지금 소속 중 신고 정보를 아직 내지 않은 것(WHALEERP-775, paperSignedMemberships). 소속마다 신고 정보를
 * 나란히 조회한다(판정은 taxProfileDueOf). 잠시 조회하지 못한 소속(5xx · 연결 실패)은 keepUnknown 이면 넣는다 — 완료 화면은 버튼을 그대로
 * 두고 입력 화면이 이미 낸 소속을 보기 화면으로 보낸다(전자계약 서명 완료 화면과 같다). 홈 카드는 빼서 이미 낸 직원에게 잘못 띄우지 않는다.
 * 4xx(그사이 퇴직해 404 등)는 남기고 뺀다 — 입력 화면도 같은 응답에 404 라 버튼이 없는 화면으로 간다.
 * 401 의 만료 안내 redirect 와 결함은 그대로 던진다. scope 는 남길 때 어느 화면인지다.
 */
export async function paperTaxProfileDue<M extends Schemas["MyMembershipDto"]>(
  memberships: readonly M[],
  contracts: readonly Pick<ContractListItem, "staffMemberId" | "status" | "contractMethod" | "awaitingSignature">[],
  keepUnknown: boolean,
  scope: string,
): Promise<M[]> {
  const candidates = paperSignedMemberships(memberships, contracts, kstToday());
  const due = await Promise.all(
    candidates.map(async (m) => {
      try {
        return taxProfileDueOf(await getMyTaxProfile(m.staffMemberId), keepUnknown);
      } catch (error) {
        const failure = failureOf(error);
        if (!failure) throw error;
        // 5xx · 연결 실패는 getMyTaxProfile 이 null 로 바꿔 여기 오지 않는다 — 남는 것은 4xx 다
        logFailure(scope, failure);
        return false;
      }
    }),
  );
  return candidates.filter((_, i) => due[i]);
}

export type CurrentTerms =
  | { status: "ok"; terms: Schemas["TermsVersionDetailResponseDto"] }
  | { status: "missing" }
  | { status: "unavailable" };

/**
 * 지금 시행 중인 약관(`GET /public-terms-versions/:termsTypeCode`).
 * - missing: 404 — 운영자가 그 약관을 끄거나 시행본이 없다. 다시 해도 풀리지 않는 설정 문제라 남긴다.
 * - unavailable: 5xx · 연결 실패(request() 가 남겼다). 잠시 뒤 다시 열면 된다.
 * 캐시하지 않는다 — 시트에 보인 버전과 「동의합니다」 때 api 가 기록하는 시행본이 어긋나지 않게(고지 후 동의).
 */
export async function getCurrentTerms(termsTypeCode: string): Promise<CurrentTerms> {
  // 쿠키를 쓰지 않는 공개 조회라, 같은 화면이 쿠키를 읽어도 빌드 프리렌더에서 먼저 api 를 부른다(빌드에는 API_BASE_URL 이 없다).
  await connection();
  try {
    const terms = await request<Schemas["TermsVersionDetailResponseDto"]>(`/public-terms-versions/${encodeURIComponent(termsTypeCode)}`);
    return { status: "ok", terms };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // 선택 약관(마케팅)은 운영자가 꺼 두는 것이 정상 설정이라 남기지 않는다 — 가입 · 홈 약관 동의가 그 줄을 빼고 그린다
      if (termsTypeCode !== "MARKETING") logUnexpected(`terms:${termsTypeCode}`, error);
      return { status: "missing" };
    }
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return { status: "unavailable" };
    throw error;
  }
}

/** 직원 앱 약관 한 가지와 지금 시행 중인 본문(ACC-23). */
export type StaffTermsItem = (typeof STAFF_TERMS)[number] & { current: CurrentTerms };

/**
 * 직원 앱 약관 셋(서비스 이용약관 · 개인정보 수집·이용 · 마케팅 정보 수신)의 지금 시행본 — 가입 화면의 체크 칸과 홈 약관 동의 팝업이
 * 「보기」로 보이고, 팝업은 보인 버전을 api 에 싣는다(WHALEERP-774). 캐시하지 않는 것은 getCurrentTerms 와 같다.
 */
export const getStaffTerms = (): Promise<StaffTermsItem[]> =>
  Promise.all(STAFF_TERMS.map(async (terms) => ({ ...terms, current: await currentTermsOrUnavailable(terms.code) })));

/**
 * getCurrentTerms 가 던지는 나머지 실패(429 · 403 · 응답 모양 결함)도 「잠시 못 받음」으로 바꾼다 — 가입 화면 · 홈 팝업이 약관 하나 때문에
 * 화면 전체 오류가 되지 않게(api 계약이 어긋난 신호라 남긴다). 그 약관은 [보기] 에 안내가 뜨고, 가입은 보내지 않는다(termsLoadOf).
 */
async function currentTermsOrUnavailable(termsTypeCode: string): Promise<CurrentTerms> {
  try {
    return await getCurrentTerms(termsTypeCode);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    logUnexpected(`terms:${termsTypeCode}`, error);
    return { status: "unavailable" };
  }
}
