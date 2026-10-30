// 내 정보(WHALEERP-193)의 순수 계산 — 날짜 · 일시 표시, 비밀번호 권유 기간, 가맹 소속 판정, 주소 값 거르기, 동의 바꾸기 경로,
// 주소 저장 · 동의 바꾸기 실패를 화면 문구로 바꾸기. node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { CONNECTION_FAILED, RETRY_LATER, isHangulReason, type ApiFailure } from "./action-errors.ts";
import type { Schemas } from "./api";
import type { BadgeTone } from "@/components/common";
import { HQ_SHARING_TERMS_VERSION } from "./hq-sharing-terms.ts";

export type MyProfile = Schemas["MyProfileResponseDto"];
export type MyMembership = Schemas["MyMembershipDto"];
export type LocationConsentState = Schemas["LocationConsentState"];

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD → 「2025년 11월 3일」. 달력 날짜라 시간대를 따지지 않는다. */
export function dateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

const kst = (iso: string) => new Date(Date.parse(iso) + KST_OFFSET_MS);

/** ISO 시각 → 한국 날짜 「2026년 6월 2일」. 한국은 서머타임이 없어 9시간만 민다. */
export function kstDateLabel(iso: string): string {
  const k = kst(iso);
  return `${k.getUTCFullYear()}년 ${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일`;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** ISO 시각 → 한국 날짜 「9월 2일 (수)」 — 받은 초대의 받은 날 · 만료일(데모 me 의 sites, ME-8). */
export function kstMonthDayLabel(iso: string): string {
  const k = kst(iso);
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 (${WEEKDAY_KO[k.getUTCDay()]})`;
}

/** ISO 시각 → 한국 시각 「2026년 3월 15일 09:04」. */
export function kstDateTimeLabel(iso: string): string {
  const k = kst(iso);
  return `${kstDateLabel(iso)} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}

/** 비밀번호를 바꾸라고 권하는 기간(개월). api 는 마지막 변경 시각만 주고 기간은 화면이 정한다(2026-10-20 노영주, 6개월). */
export const PASSWORD_STALE_MONTHS = 6;

/**
 * 비밀번호를 바꾼 지 오래됐는지 — 마지막 변경(바꾼 적이 없으면 가입) 뒤로 6개월이 지났다. 달력 달로 센다(4월 30일 → 10월 30일,
 * 8월 31일 → 2월 말일). 안내용이라 날짜 경계는 UTC 그대로 둔다(한국 시각과 최대 9시간 차이).
 * 권하기만 하고 막지 않는다(WHALEERP-192, 주기적 변경을 강제하지 않음).
 */
export function isPasswordStale(passwordChangedAt: string, now: Date): boolean {
  const due = new Date(passwordChangedAt);
  const day = due.getUTCDate();
  due.setUTCMonth(due.getUTCMonth() + PASSWORD_STALE_MONTHS);
  // 그 달에 같은 날이 없으면(8월 31일 → 2월) 다음 달로 넘치므로 그 달 마지막 날로 맞춘다.
  if (due.getUTCDate() !== day) due.setUTCDate(0);
  return now.getTime() >= due.getTime();
}

/** 가맹 점포 소속이 하나라도 있어야 본사 제공 동의 카드를 보인다(ATT-30). 값은 공통코드 STORE_TYPE 의 상세코드다. */
export const hasFranchiseMembership = (memberships: readonly MyMembership[]) =>
  memberships.some((m) => m.store.storeTypeCode === "FRANCHISE");

/** 주소 저장에 보내는 값. api UpdateMyAddressDto 와 같은 모양이다(우편번호 · 도로명은 주소 검색 값, 상세 주소만 직원이 쓴다). */
export interface AddressInput {
  zipCode: string;
  address: string;
  addressDetail: string | null;
}

/** api UpdateMyAddressDto 의 길이 제한. */
export const ADDRESS_MAX = 200;
export const ADDRESS_DETAIL_MAX = 100;

/**
 * 서버 액션이 받은 값을 api 와 같은 규칙으로 거른다. 서버 액션은 누구나 직접 부를 수 있어 화면이 막은 것도 다시 본다.
 * 맞으면 보낼 값, 아니면 화면 문구.
 */
export function parseAddress(
  zipCode: string,
  address: string,
  addressDetail: string,
): { ok: true; value: AddressInput } | { ok: false; error: string } {
  const zip = zipCode.trim();
  const road = address.trim();
  const detail = addressDetail.trim();
  if (!/^[0-9]{5}$/.test(zip) || !road || road.length > ADDRESS_MAX) return { ok: false, error: "주소를 검색해서 다시 골라 주세요" };
  if (detail.length > ADDRESS_DETAIL_MAX) return { ok: false, error: `상세 주소는 ${ADDRESS_DETAIL_MAX}자까지 넣을 수 있습니다` };
  return { ok: true, value: { zipCode: zip, address: road, addressDetail: detail || null } };
}

/** 주소 저장 실패를 화면 문구로. 모양은 미리 걸렀으니 400 은 api 와 규칙이 어긋난 것 — 남기고 다시 고르게 한다. */
export function addressSaveFailure(failure: ApiFailure): { error: string; log: boolean } {
  if (failure === "network") return { error: CONNECTION_FAILED, log: false };
  if (failure.status === 400) return { error: "주소를 검색해서 다시 골라 주세요", log: true };
  // 5xx 는 request() 가 남겼다.
  return { error: `주소를 저장하지 못했습니다. ${RETRY_LATER}`, log: failure.status < 500 };
}

/**
 * 동의 바꾸기(ATT-23 · 26 · 30)와 그 api 경로 · 끝난 뒤 알림 문구. 모두 POST · 204, 상태가 맞지 않으면 409 다. 본문은 없고
 * 위치정보 동의만 시트에 보인 약관 버전 `{ termsVersion }` 을 늘 싣는다(보인 약관이 없으면 null, 다르면 409, api #185). 사업자 제공
 * 동의도 본 문구 버전 `{ consentVersion }` 을 늘 싣는다(앱 문구의 HQ_SHARING_TERMS_VERSION, 다르면 409, ATT-30 v252)
 * (2026-10-20 api 확정). 알림 문구는 데모 me 의 토스트를 따르되, 처음 동의하는 경우도 있어 「다시」는 뺐다(다시 켜기는 데모에 없어 지었다).
 */
export const CONSENT_CHANGES = {
  "location-agree": { path: "/me/location-consent", done: "위치정보 수집에 동의했습니다" },
  "location-pause": { path: "/me/location-consent/pause", done: "위치 수집을 일시 중지했습니다" },
  "location-resume": { path: "/me/location-consent/resume", done: "위치 수집을 다시 켰습니다" },
  "location-withdraw": { path: "/me/location-consent/withdraw", done: "위치정보 동의를 철회했습니다" },
  "hq-sharing-agree": { path: "/me/hq-sharing-consent", done: "사업자 제공에 동의했습니다" },
  "hq-sharing-withdraw": { path: "/me/hq-sharing-consent/withdraw", done: "사업자 제공 동의를 철회했습니다" },
} as const;

export type ConsentChange = keyof typeof CONSENT_CHANGES;

export const isConsentChange = (value: unknown): value is ConsentChange =>
  typeof value === "string" && Object.hasOwn(CONSENT_CHANGES, value);

/** api 가 위치정보 동의에서 「화면이 보여 준 약관 버전이 시행 중인 것과 다름」으로 409 를 줄 때의 사유 앞부분(api #185) */
const TERMS_CHANGED = "그사이 위치정보 약관이 바뀌었습니다";
/** api 가 사업자 제공 동의에서 「화면이 보여 준 문구 버전이 지금 것과 다름」으로 409 를 줄 때의 code(ATT-30 v252) */
const HQ_TERMS_CHANGED_CODE = "HQ_SHARING_TERMS_CHANGED";

/** 동의 바꾸기 실패를 화면 문구로. refresh 는 화면을 다시 받을지, log 는 계약 어긋남으로 남길지다. */
export function consentChangeFailure(failure: ApiFailure): { error: string; refresh: boolean; log: boolean; hqTermsChanged?: true } {
  if (failure === "network") return { error: CONNECTION_FAILED, refresh: false, log: false };
  const { status, message } = failure;
  // 사업자 제공 동의 문구 버전이 바뀐 409 — code 로 가른다. 앱 문구가 번들이라 다시 받아도 같은 문구다 — 사유가 새로 고치라고 말하고,
  // 홈 다시 동의 팝업은 이 탭에서 다시 띄우지 않는다(hqTermsChanged)
  if (status === 409 && failure.code === HQ_TERMS_CHANGED_CODE) return { error: message, refresh: true, log: false, hqTermsChanged: true };
  // 409 에는 가를 코드가 없다(kyoto-61, 2026-10-20). 다른 기기에서 바꿨거나 화면이 낡은 것이라 다시 받는다. 동의 시트를 연 사이
  // 위치정보 약관이 바뀐 409(api 의 한글 사유, WHALEERP-628)만은 그 사유를 보인다 — 상태가 아니라 약관이 바뀌어 새 문구를 읽어야 한다.
  if (status === 409)
    return {
      error:
        message.startsWith(TERMS_CHANGED)
          ? message
          : "그사이 동의 상태가 바뀌어 지금 상태를 다시 불러왔습니다",
      refresh: true,
      log: false,
    };
  // 시행 중인 위치정보 약관이 없으면 api 가 500 과 한글 사유(「관리자에게 문의해 주세요」)를 준다 — 그대로 보인다.
  if (status >= 500 && isHangulReason(message)) return { error: message, refresh: false, log: false };
  // 5xx 는 request() 가 남겼다. 예상 밖 4xx 는 남긴다.
  return { error: `동의 상태를 바꾸지 못했습니다. ${RETRY_LATER}`, refresh: false, log: status < 500 };
}

/**
 * 소속의 재직 표시(WHALEERP-604, 내 정보 - 소속 근무지). 퇴직일은 그날까지 일하는 날이라, 오늘(한국 날짜 YYYY-MM-DD)보다 앞이면
 * 퇴직, 오늘 · 뒤면 퇴직 예정, 없으면 근무 중이다. api 의 퇴직 묶음은 재직 상태로 가르지만(배치가 늦은 날 어긋남) 화면은 날짜로 본다.
 */
export function membershipStatusOf(retiredDate: string | null, today: string): "working" | "retiring" | "retired" {
  if (retiredDate === null) return "working";
  return retiredDate < today ? "retired" : "retiring";
}

/**
 * 내 정보의 사업자(본사) 제공 동의 카드 표시(ATT-30). 동의한 문구 버전을 더는 받아 주지 않으면(needsReconsent — 항목 · 목적이 넓어짐,
 * api #183) 계정은 동의로 남아도 본사에는 미동의로 보여 가려진다 — 「다시 동의 필요」로 보이고 내용 시트의 「동의합니다」로 새 버전에
 * 동의를 받는다(내 정보와, 앱에 들어오거나 화면으로 돌아올 때 홈의 다시 동의 팝업 — ATT-30 v252). 새 문구에 동의하지 않으려는 직원도 옛 동의를 거둘 수 있게 그때는 카드에
 * 「동의 철회」도 둔다(alsoWithdraw) — 선택 동의라 철회는 동의만큼 쉬워야 한다.
 */
export function hqSharingView(consent: Pick<Schemas["MyHqSharingConsentDto"], "isConsented" | "agreedAt" | "withdrawnAt" | "consentVersion" | "needsReconsent">): {
  badge: { tone: BadgeTone; text: string };
  line: string;
  /**
   * 내용 보기 옆 버튼 — withdraw 면 「동의 철회」, agree 면 그 글자로 내용 시트를 열고 시트의 「동의합니다」로 받는다. alsoWithdraw 면
   * 「동의 철회」 버튼을 하나 더 둔다(다시 동의 필요 — 계정은 아직 동의라 철회도 동의만큼 쉽게)
   */
  action: { kind: "withdraw" } | { kind: "agree"; label: string; alsoWithdraw: boolean };
  note: string;
} {
  const { isConsented, agreedAt, withdrawnAt, consentVersion, needsReconsent } = consent;
  const version = consentVersion ? ` · 사업자 제공 동의 ${consentVersion}` : "";
  if (isConsented && needsReconsent)
    return {
      badge: { tone: "warning", text: "다시 동의 필요" },
      line: `${agreedAt ? `${kstDateTimeLabel(agreedAt)} 동의${version} — ` : ""}동의 내용이 바뀌어 다시 동의해야 합니다`,
      action: { kind: "agree", label: "다시 동의하기", alsoWithdraw: true },
      note: "다시 동의하기 전에는 본사에 점포별 숫자로만 보입니다. 다시 동의하면 개인 단위로 보입니다.",
    };
  if (isConsented)
    return {
      badge: { tone: "success", text: "동의함" },
      line: agreedAt ? `${kstDateTimeLabel(agreedAt)} 동의${version}` : "동의했습니다",
      action: { kind: "withdraw" },
      note: "철회해도 가입과 근무는 그대로입니다. 본사에는 점포별 숫자로만 보입니다.",
    };
  return {
    badge: { tone: "plain", text: "동의하지 않음" },
    line: withdrawnAt ? `${kstDateTimeLabel(withdrawnAt)} 철회${version}` : "아직 동의하지 않았습니다",
    action: { kind: "agree", label: withdrawnAt ? "다시 동의하기" : "동의하기", alsoWithdraw: false },
    note: `지금은 본사에 점포별 숫자로만 보입니다. ${withdrawnAt ? "다시 동의하면" : "동의하면"} 개인 단위로 보입니다.`,
  };
}

/** 사업자 제공 동의 기록이 있는가(동의 중 · 철회함) — 소속을 못 받았을 때 카드를 보일지. 기록이 있으면 가맹 소속이 있던 계정이다 */
export const hasHqSharingRecord = (consent: Pick<Schemas["MyHqSharingConsentDto"], "isConsented" | "withdrawnAt">) =>
  consent.isConsented || consent.withdrawnAt !== null;

/**
 * 홈의 사업자 제공 다시 동의 팝업(ATT-30 v252)을 띄울지 — 동의 중인데 옛 문구 버전이라 다시 동의해야 하고, 지금 가맹 소속이 있을 때만.
 * api 의 needsReconsent 는 소속을 보지 않는다 — 가맹 점포에서 퇴직한 계정은 내 정보에 카드가 없어 철회할 길이 없으니 묻지 않는다(카드와 같은
 * 조건). 소속을 못 받았으면(null) 띄우지 않는다. key 는 닫을 때 기억할, 팝업이 보이는 문구 버전이다 — 문구가 바뀌면(앱이 새 버전을 보이면) 같은 탭에서도 다시 뜬다.
 */
export const hqReconsentOf = (
  consent: Pick<Schemas["MyHqSharingConsentDto"], "isConsented" | "needsReconsent" | "consentVersion">,
  memberships: readonly MyMembership[] | null,
) =>
  consent.isConsented && consent.needsReconsent && memberships !== null && hasFranchiseMembership(memberships)
    ? { key: HQ_SHARING_TERMS_VERSION }
    : null;

/** 위치정보 동의를 내 정보에서 다시 받아야 하는가 — 약관 버전이 바뀌었고(needsReconsent) 동의 · 일시 중지일 때(api 도 그때만 참이다) */
export const locationNeedsReconsent = (consent: Pick<Schemas["MyLocationConsentDto"], "state" | "needsReconsent">) =>
  consent.needsReconsent && (consent.state === "AGREED" || consent.state === "PAUSED");

/**
 * 동의 바꾸기 요청 본문. 위치정보 동의는 보인 약관이 없었어도(null) 늘 싣는다 — api 는 빠지면 400, null 이면 그사이 시행된 약관이 있을 때
 * 409 다(api #185). 사업자 제공 동의는 화면이 보인 문구 버전을 consentVersion 으로 싣는다(ATT-30 v252). 나머지는 본문이 없다.
 */
export function consentRequestBody(change: ConsentChange, version: string | null | undefined): Record<string, string | null> | undefined {
  if (change === "location-agree") return { termsVersion: version ?? null };
  if (change === "hq-sharing-agree") return { consentVersion: version ?? null };
  return undefined;
}
