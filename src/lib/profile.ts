// 내 정보(WHALEERP-193)의 순수 계산 — 날짜 · 일시 표시, 비밀번호 권유 기간, 가맹 소속 판정, 주소 값 거르기, 동의 바꾸기 경로,
// 주소 저장 · 동의 바꾸기 실패를 화면 문구로 바꾸기. node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { CONNECTION_FAILED, RETRY_LATER, isHangulReason, type ApiFailure } from "./action-errors.ts";
import type { Schemas } from "./api";

export type MyProfile = Schemas["MyProfileResponseDto"];
export type MyMembership = Schemas["MyMembershipDto"];
export type LocationConsentState = Schemas["LocationConsentState"];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
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
 * 동의 바꾸기(ATT-23 · 26 · 30)와 그 api 경로 · 끝난 뒤 알림 문구. 모두 POST · 본문 없음 · 204, 상태가 맞지 않으면 409 다
 * (2026-10-20 api 확정). 알림 문구는 데모 me 의 토스트를 따르되, 처음 동의하는 경우도 있어 「다시」는 뺐다(다시 켜기는 데모에 없어 지었다).
 */
export const CONSENT_CHANGES = {
  "location-agree": { path: "/me/location-consent", done: "위치정보 수집에 동의했습니다" },
  "location-pause": { path: "/me/location-consent/pause", done: "위치 수집을 멈췄습니다" },
  "location-resume": { path: "/me/location-consent/resume", done: "위치 수집을 다시 켰습니다" },
  "location-withdraw": { path: "/me/location-consent/withdraw", done: "위치정보 동의를 철회했습니다" },
  "hq-sharing-agree": { path: "/me/hq-sharing-consent", done: "본사 제공에 동의했습니다" },
  "hq-sharing-withdraw": { path: "/me/hq-sharing-consent/withdraw", done: "본사 제공 동의를 철회했습니다" },
} as const;

export type ConsentChange = keyof typeof CONSENT_CHANGES;

export const isConsentChange = (value: unknown): value is ConsentChange =>
  typeof value === "string" && Object.hasOwn(CONSENT_CHANGES, value);

/** 동의 바꾸기 실패를 화면 문구로. refresh 는 화면을 다시 받을지, log 는 계약 어긋남으로 남길지다. */
export function consentChangeFailure(failure: ApiFailure): { error: string; refresh: boolean; log: boolean } {
  if (failure === "network") return { error: CONNECTION_FAILED, refresh: false, log: false };
  const { status, message } = failure;
  // 409 에는 가를 코드가 없다(kyoto-61, 2026-10-20). 다른 기기에서 바꿨거나 화면이 낡은 것이라 다시 받는다.
  if (status === 409) return { error: "그사이 동의 상태가 바뀌어 지금 상태를 다시 불러왔습니다", refresh: true, log: false };
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
