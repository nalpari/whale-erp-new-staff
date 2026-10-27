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

/** 근무 경과 — 시간 · 분(음수는 0). 「6시간 41분」 */
export function elapsedOf(from: Date, to: Date): { hours: number; minutes: number } {
  const total = Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export const elapsedLabel = (e: { hours: number; minutes: number }) => `${e.hours}시간 ${pad(e.minutes)}분`;
