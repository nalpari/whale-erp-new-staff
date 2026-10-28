import { ApiError, NetworkError, logUnexpected, request, type Schemas } from "./api";
import { authedRequest } from "./session";

/** 내 정보(`GET /me/profile`). 이 화면의 뼈대라 실패하면 그대로 던져 error.tsx 가 받는다. */
export const getMyProfile = () => authedRequest<Schemas["MyProfileResponseDto"]>("/me/profile");

/** 5xx · 연결 실패만 null 로 바꾼다 — 그 칸만 「불러오지 못했다」로 보이고 화면 전체를 오류로 만들지 않는다. 그 밖은 던진다. */
export async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return null;
    throw error;
  }
}

/** 다른 화면(홈)이 지금 이메일 같은 값을 곁들일 때. 5xx · 연결 실패면 null — 부른 쪽이 로그인 때 값으로 대신한다. */
export const getMyProfileOrNull = () => orNull(getMyProfile);

/**
 * 소속 근무지(`GET /me/memberships`). 퇴직한 근무지는 빠진다 — 출퇴근 · 홈 · 근무지 선택기가 쓴다. includeRetired 면 퇴직한 근무지도
 * 지금 소속 뒤에 퇴직일 최근 순으로 받는다(내 정보 - 소속 근무지, WHALEERP-604).
 */
export const getMyMemberships = (includeRetired = false) =>
  orNull(() =>
    authedRequest<Schemas["MyMembershipListResponseDto"]>(`/me/memberships${includeRetired ? "?includeRetired=true" : ""}`),
  );

/**
 * 그 소속의 신고 정보(`GET /me/memberships/:staffMemberId/tax-profile`). 미제출이면 `taxProfile: null`(200)이다.
 * 내 소속이 아니면(퇴직 · 남의 id 등) 404 — 부른 쪽이 notFound 로 바꾼다. 키가 없거나(503) 풀 수 없으면(500) null.
 */
export const getMyTaxProfile = (staffMemberId: number) =>
  orNull(() => authedRequest<Schemas["MyTaxProfileResponseDto"]>(`/me/memberships/${staffMemberId}/tax-profile`));

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
  try {
    const terms = await request<Schemas["TermsVersionDetailResponseDto"]>(`/public-terms-versions/${encodeURIComponent(termsTypeCode)}`);
    return { status: "ok", terms };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      logUnexpected(`terms:${termsTypeCode}`, error);
      return { status: "missing" };
    }
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return { status: "unavailable" };
    throw error;
  }
}
