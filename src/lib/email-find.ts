import { ApiError } from "./api";

/**
 * 생년월일 칸의 값을 api 모양(YYYY-MM-DD)으로. 숫자 8자리(19990412)도 받는다 — 휴대폰에서는 숫자 키보드로 넣는 편이 빨라서다.
 * 점 · 빗금 · 공백으로 나눈 흔한 모양(1999.04.12 · 1999/4/12 · 1999. 4. 12.)도 월 · 일을 두 자리로 맞춰 받는다.
 * 그 밖의 모양은 그대로 넘기고 판정은 api 가 한다(있는 날짜인지까지 본다).
 */
export function normalizeBirthDate(raw: string): string {
  const value = raw.trim();
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  const parts = /^(\d{4})[-./\s]+(\d{1,2})[-./\s]+(\d{1,2})\.?$/.exec(value);
  return parts ? `${parts[1]}-${parts[2].padStart(2, "0")}-${parts[3].padStart(2, "0")}` : value;
}

/** 휴대전화번호에서 하이픈 · 공백을 지운 값. api 도 같은 정리를 한 뒤 숫자 10~11자리만 받는다. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

/**
 * 이메일 찾기 429 가 번호 잠금이면 해제 시각(ms), 요청 제한이면 null. 둘은 본문의 lockExpiresAt 이 있는지로 가른다
 * (api EmailFindTooManyRequestsResponseDto).
 */
export function lockExpiresAtOf(error: ApiError): number | null {
  if (error.status !== 429) return null;
  const raw = (error.body as { lockExpiresAt?: unknown } | null)?.lockExpiresAt;
  const at = typeof raw === "string" ? Date.parse(raw) : NaN;
  return Number.isFinite(at) ? at : null;
}
