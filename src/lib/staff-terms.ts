// 직원 앱 약관 동의(운영 정책 ACC-23, WHALEERP-774) — 가입 화면의 체크 칸과 홈의 약관 동의 팝업이 같이 쓴다. 순수 계산이라 node --test 가
// 직접 읽는다(값 import 없음). 약관 본문은 1팀 공통 약관이고 `GET /public-terms-versions/:termsTypeCode` 로 받는다(lib/my-profile getStaffTerms).
import { CONNECTION_FAILED, RETRY_LATER, isHangulReason, type ApiFailure } from "./action-errors.ts";

/** 필수 둘 · 선택 하나. code 는 api 약관 유형, label 은 체크 칸 글자. */
export const STAFF_TERMS = [
  { key: "termsService", code: "STAFF_TERMS_SERVICE", label: "직원 앱 서비스 이용약관", required: true },
  { key: "privacy", code: "STAFF_PRIVACY", label: "개인정보 수집·이용 동의", required: true },
  { key: "marketing", code: "MARKETING", label: "마케팅 정보 수신", required: false },
] as const;

export type StaffTermsKey = (typeof STAFF_TERMS)[number]["key"];
export type TermsChecks = Record<StaffTermsKey, boolean>;

export const NO_TERMS_CHECKED: TermsChecks = { termsService: false, privacy: false, marketing: false };
/** 필수를 체크하지 않고 넘어가려 할 때 — api 의 400 사유와 같은 뜻이다. */
export const REQUIRED_TERMS_MISSING = "필수 약관에 동의해 주세요";

export const requiredTermsAgreed = (checks: TermsChecks) => checks.termsService && checks.privacy;
export const allTermsChecked = (checks: TermsChecks) => STAFF_TERMS.every((terms) => checks[terms.key]);
/** 「모두 동의합니다」 — 켜면 셋 다, 끄면 셋 다. */
export const checkAllTerms = (on: boolean): TermsChecks => ({ termsService: on, privacy: on, marketing: on });

/**
 * 가입 폼의 체크 칸(켠 칸만 "on")과 화면이 보인 약관 버전(숨은 칸)을 api 본문으로. 필수를 끈 채 · 버전 없이 보내지 않는 것은 액션이 먼저
 * 본다 — 여기서는 늘 싣는다. 보인 마케팅 약관이 없으면(시행 중인 것이 없음) 마케팅 버전은 null 이다. 버전이 시행 중인 것과 다르면 api 가
 * 409 TERMS_CHANGED 로 거절한다(가입 화면을 연 사이 약관이 바뀜).
 */
export function signupTermsBody(formData: FormData) {
  const on = (name: string) => formData.get(name) === "on";
  const text = (name: string) => String(formData.get(name) ?? "");
  return {
    termsServiceAgreed: on("termsServiceAgreed"),
    privacyAgreed: on("privacyAgreed"),
    marketingAgreed: on("marketingAgreed"),
    termsServiceVersion: text("termsServiceVersion"),
    privacyVersion: text("privacyVersion"),
    marketingVersion: text("marketingVersion") || null,
  };
}

export type ShownTermsVersions = { termsServiceVersion: string; privacyVersion: string; marketingVersion: string | null };

const isVersion = (value: unknown): value is string => typeof value === "string" && value !== "" && value.length <= 64;

/**
 * 홈 약관 동의(`POST /me/terms-agreement`) 본문 — 팝업이 보인 약관 버전 셋과 마케팅. 서버 액션은 누구나 아무 값으로 부를 수 있어
 * 버전 모양을 다시 본다(맞지 않으면 null). 마케팅은 시행 중인 것이 없을 수 있어 보인 것이 없으면 null 이다.
 */
export function termsAgreementBody(versions: ShownTermsVersions, marketingAgreed: boolean) {
  // 서버 액션 인자는 타입과 다르게 올 수 있다(null · 문자열) — 구조 분해 전에 객체인지 본다(PR-Agent)
  if (typeof versions !== "object" || versions === null) return null;
  const { termsServiceVersion, privacyVersion, marketingVersion } = versions;
  if (!isVersion(termsServiceVersion) || !isVersion(privacyVersion)) return null;
  if (marketingVersion !== null && !isVersion(marketingVersion)) return null;
  return { termsServiceVersion, privacyVersion, marketingVersion, marketingAgreed: marketingAgreed === true };
}

/**
 * 홈 약관 동의가 실패했을 때. refresh 면 홈을 다시 받는다 — 약관이 바뀌었으면(409 TERMS_CHANGED) 새 약관으로 팝업을 다시 그리고,
 * 이미 동의했으면(다른 기기 · 두 번 누름, 409) 다시 받아 팝업이 내려간다(문구 없음).
 */
export function termsAgreementFailure(failure: ApiFailure): { error?: string; refresh: boolean; log: boolean } {
  if (failure === "network") return { error: CONNECTION_FAILED, refresh: false, log: false };
  const { status, message } = failure;
  if (status === 409 && failure.code === "TERMS_CHANGED") return { error: message, refresh: true, log: false };
  if (status === 409) return { refresh: true, log: false };
  // 시행 중인 약관이 없으면 api 가 500 과 한글 사유(「관리자에게 문의해 주세요」)를 준다 — 그대로 보인다.
  if (status >= 500 && isHangulReason(message)) return { error: message, refresh: false, log: false };
  // 5xx 는 request() 가 남겼다. 예상 밖 4xx 는 남긴다.
  return { error: `약관 동의를 남기지 못했습니다. ${RETRY_LATER}`, refresh: false, log: status < 500 };
}

type LoadedTerms = { key: StaffTermsKey; current: { status: "ok"; terms: { version: string } } | { status: "missing" | "unavailable" } };

/**
 * 홈 약관 동의 팝업이 보일 버전 셋 — 필수 둘을 받지 못했거나(설정 · 잠시 실패) 마케팅을 잠시 받지 못했으면 null 이고, 이번에는 팝업을
 * 띄우지 않는다(다음에 홈을 열 때 다시 묻는다). 시행 중인 마케팅 약관이 없으면(404) 마케팅만 null 이다 — api 도 그 줄을 남기지 않는다.
 */
export function shownTermsVersionsOf(items: readonly LoadedTerms[]): ShownTermsVersions | null {
  const of = (key: StaffTermsKey) => items.find((item) => item.key === key)?.current;
  const service = of("termsService");
  const privacy = of("privacy");
  const marketing = of("marketing");
  if (service?.status !== "ok" || privacy?.status !== "ok") return null;
  if (marketing?.status === "unavailable" || marketing === undefined) return null;
  return {
    termsServiceVersion: service.terms.version,
    privacyVersion: privacy.terms.version,
    marketingVersion: marketing.status === "ok" ? marketing.terms.version : null,
  };
}

/**
 * 보인 약관 버전 셋의 키 — 바뀌면(409 TERMS_CHANGED 뒤 새 약관을 받음) 체크를 처음으로 돌린다. 새 약관을 다시 보고 체크하게 해,
 * 버튼만 다시 눌러 보지 않은 약관에 동의한 것으로 남지 않게 한다.
 */
export const termsVersionKey = (items: readonly LoadedTerms[]) =>
  items.map((item) => `${item.key}:${item.current.status === "ok" ? item.current.terms.version : "-"}`).join("|");

/**
 * 가입 화면이 받은 약관 셋의 상태 — missing 은 필수 약관이 등록 · 시행되지 않음(설정 문제, 새로 고쳐도 같다), unavailable 은 필수나
 * 마케팅을 잠시 받지 못함(새로 고치면 풀릴 수 있다). 시행 중인 마케팅이 없는 것(missing)은 정상 설정이라 ok 다. ok 가 아니면 가입
 * 요청을 보내지 않는다 — 보낸 버전이 시행 중인 것과 어긋나 409 TERMS_CHANGED 가 되풀이되지 않게.
 */
export function termsLoadOf(items: readonly LoadedTerms[]): "ok" | "missing" | "unavailable" {
  const required = items.filter((item) => item.key !== "marketing");
  if (required.some((item) => item.current.status === "missing")) return "missing";
  if (items.some((item) => item.current.status === "unavailable")) return "unavailable";
  return "ok";
}
