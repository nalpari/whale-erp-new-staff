// 출퇴근 등록(WHALEERP-214 · 215)의 순수 계산. node --test 가 직접 읽으므로 값 import 를 두지 않는다.
// 위치 판정은 휴대전화 안에서 한다 — 좌표는 이 파일 밖(서버)으로 나가지 않고, 서버에는 확인 필요 사유만 보낸다(ATT-05 · ATT-19).
import type { ApiFailure } from "./action-errors";

const EARTH_RADIUS_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** 두 좌표 사이 거리(미터, 하버사인). 근무지 반경(100m)을 가르는 데는 충분히 정확하다. */
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 시행 중인 위치정보 약관이 탭 진입 때 읽기 · 카카오 지도에 내 위치 그리기를 담은 버전(LOCATION v1.1, 2026-10-28 재영)
 * 이상인가. 다시 동의가 필요 없으면 동의한 버전 = 시행 중인 버전이므로, 이것이 거짓이면 직원이 그 두 가지에 동의하지 않은 것이다 —
 * 참이라고 동의한 것은 아니다(동의 없음 · 철회일 수 있다) — 동의 상태(canLocate)와 함께 쓴다.
 * api 가 아직 v1.1 을 시행하지 않았거나(배포 순서 · 롤백) 버전 모양을 모르면 거짓 — 「v주.부」 꼴만 읽는다.
 */
export function termsCoverMap(termsVersion: string | null): boolean {
  const match = termsVersion ? /^v(\d+)\.(\d+)$/.exec(termsVersion) : null;
  if (!match) return false;
  const [major, minor] = [Number(match[1]), Number(match[2])];
  return major > 1 || (major === 1 && minor >= 1);
}

export type AttendanceKind = "CHECK_IN" | "CHECK_OUT";
export type ReviewReason = "OUT_OF_RADIUS_CHECKIN" | "OUT_OF_RADIUS_CHECKOUT" | "MOCK_LOCATION";

/**
 * 보낼 확인 필요 사유. 반경 밖이면 출근 · 퇴근 모두 사유를 붙여 받는다(ATT-11). 위치 조작 감지면 출근은 막고(blocked),
 * 퇴근은 「위치 조작 감지」로 받는다(ATT-21). 위치 오차는 따로 판정하지 않는다(ATT-4). 둘 다 아니면 null.
 */
export function reviewReasonOf(kind: AttendanceKind, judged: { inRange: boolean; mocked: boolean }): ReviewReason | null | "blocked" {
  if (judged.mocked) return kind === "CHECK_IN" ? "blocked" : "MOCK_LOCATION";
  if (judged.inRange) return null;
  return kind === "CHECK_IN" ? "OUT_OF_RADIUS_CHECKIN" : "OUT_OF_RADIUS_CHECKOUT";
}

export const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
  OUT_OF_RADIUS_CHECKIN: "반경 밖 출근",
  OUT_OF_RADIUS_CHECKOUT: "반경 밖 퇴근",
  MOCK_LOCATION: "위치 조작 감지",
};

/** 등록된 기록의 확인 필요 사유 — 앱이 보내는 셋에 api 가 붙이는 「근무 12시간 초과」(LONG_SHIFT, 2026-10-27 재영)까지. 모르는 값은 null */
export function recordedReasonLabel(reason: string): string | null {
  if (reason === "LONG_SHIFT") return "근무 12시간 초과";
  return reason in REVIEW_REASON_LABELS ? REVIEW_REASON_LABELS[reason as ReviewReason] : null;
}

/** 등록이 막힌 까닭 — 화면이 띄울 시트 · 상태. message 는 화면에 그대로 보이는 한 줄이다 */
export type RegisterProblem =
  | { kind: "already-checked-in"; message: string }
  | { kind: "no-open-check-in"; message: string }
  | { kind: "contract-pending"; message: string; contractId: number | null }
  | { kind: "no-contract"; message: string }
  | { kind: "consent-required"; message: string }
  | { kind: "paused"; message: string }
  | { kind: "stale"; message: string }
  | { kind: "error"; message: string; log: boolean };

const RETRY = "등록하지 못했습니다. 잠시 뒤 다시 시도해 주세요";

/**
 * 출근 · 퇴근 api 실패를 화면의 갈래로 바꾼다. 409 · 422 · 403 은 api 의 code 로 가른다(본문 그대로 넘겨받는다). 404 는 그사이
 * 소속이 바뀐 것이라 화면을 다시 받게 한다(stale). 연결 실패와 5xx 는 다시 하게 한다(211 「실패하면 알리고 다시 하게」).
 */
export function registerProblemOf(failure: ApiFailure, body: unknown): RegisterProblem {
  if (failure === "network") return { kind: "error", message: RETRY, log: false };
  const code = (body as { code?: unknown } | null)?.code;
  const message = failure.message;
  if (failure.status === 409 && code === "ALREADY_CHECKED_IN") return { kind: "already-checked-in", message };
  if (failure.status === 409 && code === "NO_OPEN_CHECK_IN") return { kind: "no-open-check-in", message };
  // 출근한 다음 날이 지난 열린 출근 — 다시 해도 안 되니 api 문구(관리자 보정 요청)를 그대로 보인다
  if (failure.status === 409 && code === "CHECK_OUT_EXPIRED") return { kind: "error", message, log: false };
  if (failure.status === 422 && code === "CONTRACT_PENDING_SIGNATURE") {
    const contractId = (body as { contractId?: unknown }).contractId;
    return { kind: "contract-pending", message, contractId: typeof contractId === "number" ? contractId : null };
  }
  if (failure.status === 422 && code === "NO_CONTRACT") return { kind: "no-contract", message };
  // 화면을 연 뒤 근무지 좌표가 지워졌다 — 다시 해도 안 되니 api 문구(관리자 문의)를 그대로 보이고 화면을 다시 받는다
  if (failure.status === 422 && code === "STORE_LOCATION_MISSING") return { kind: "stale", message };
  // 화면을 연 뒤 근무지 좌표가 생겨 위치 없이 보냈다 — 화면을 다시 받으면 위치를 읽고 등록한다
  if (failure.status === 400 && code === "LOCATION_READ_REQUIRED") return { kind: "stale", message };
  if (failure.status === 403 && code === "LOCATION_CONSENT_REQUIRED") return { kind: "consent-required", message };
  if (failure.status === 403 && code === "LOCATION_PAUSED") return { kind: "paused", message };
  if (failure.status === 404) return { kind: "stale", message: "근무지가 바뀌었습니다. 화면을 다시 불러왔습니다" };
  return { kind: "error", message: RETRY, log: failure.status < 500 };
}

const pad = (n: number) => String(n).padStart(2, "0");
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국 시각 HH:mm */
export function kstTime(at: Date): string {
  const k = new Date(at.getTime() + KST_OFFSET_MS);
  return `${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}

/** 한국 날짜 · 시각 「10/24 09:02」 — 며칠 전 출근을 오늘 것으로 읽지 않게 */
export function kstMonthDayTime(at: Date): string {
  const k = new Date(at.getTime() + KST_OFFSET_MS);
  return `${pad(k.getUTCMonth() + 1)}/${pad(k.getUTCDate())} ${kstTime(at)}`;
}

/** 근무 경과 — 시간 · 분(음수는 0). 「6시간 41분」 */
export function elapsedOf(from: Date, to: Date): { hours: number; minutes: number } {
  const total = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export const elapsedLabel = (e: { hours: number; minutes: number }) => `${e.hours}시간 ${pad(e.minutes)}분`;

/** 홈 오늘 근무 카드의 출퇴근 버튼 — 출근하기 · 퇴근하기 · 없음(null). */
export type HomeAttendanceAction = "check-in" | "check-out" | null;

/**
 * 홈 오늘 근무 카드에 둘 출퇴근 버튼(HOME-3). 누르면 출퇴근 화면(/check-in)으로 가고 등록은 거기서 한다 — 홈에서는 위치를 읽지 않는다(ATT-22).
 * 거기서 등록할 수 없는 상태면 버튼을 두지 않는다(2026-10-23 재영 — 누를 수 없는 버튼을 두지 않는다):
 * - 위치를 보는 근무지의 위치 수집 일시 중지(ATT-26) — 출근 · 퇴근 모두 앱으로 못 한다. 미동의 · 철회 · 다시 동의 필요는 출퇴근 화면이
 *   동의부터 받으므로 버튼을 둔다(ATT-06 · ATT-32, HOME-12 2026-10-28 재영)
 * - 이 근무지의 열린 출근이 있으면 퇴근하기, 퇴근 기한이 지났거나 다른 근무지의 열린 출근이면 없음(보정 · 근무지 바꾸기는 출퇴근 화면 몫)
 * - 출근을 막는 까닭(서명 대기 · 체결 계약 없음)이 있거나, 위치를 보는 근무지인데 좌표가 없거나(운영 정책 ATT-36 — api 는 출근 때 422
 *   STORE_LOCATION_MISSING), 오늘 근무스케줄이 없으면 출근하기 없음. 퇴근은 좌표와 상관없이 둔다
 */
export function homeAttendanceAction(
  attendance: {
    staffMemberId: number;
    store: { isLocationApplied: boolean; latitude: number | null; longitude: number | null };
    locationConsent: { state: string };
    checkInBlock: object | null;
    openCheckIn: { staffMemberId: number; isCheckOutExpired: boolean } | null;
  },
  hasTodaySchedule: boolean,
): HomeAttendanceAction {
  if (attendance.store.isLocationApplied && attendance.locationConsent.state === "PAUSED") return null;
  const open = attendance.openCheckIn;
  if (open) return open.staffMemberId === attendance.staffMemberId && !open.isCheckOutExpired ? "check-out" : null;
  const { store } = attendance;
  const noLocation = store.isLocationApplied && (store.latitude === null || store.longitude === null);
  return attendance.checkInBlock || noLocation || !hasTodaySchedule ? null : "check-in";
}
