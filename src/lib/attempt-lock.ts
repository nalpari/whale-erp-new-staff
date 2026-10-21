import { formatLeft } from "./time-left.ts";

/**
 * 시도 잠금(로그인 계정 · 이메일 찾기 번호)의 해제 시각과, 그 결과를 받은 순간의 Next 서버 시각(둘 다 ms).
 * lockExpiresAt 은 api 서버의 시계라 두 서버의 시계가 어긋난 만큼 남은 시간이 틀리지만 안내용이라 둔다(판정은 api).
 */
export type AttemptLock = { lockExpiresAt: number; serverNow: number };

/**
 * 429 를 가른다. 잠금이면 본문에 해제 시각(lockExpiresAt, ISO)이 있고 요청 제한이면 없다 — api 계약상 두 429 는 같은 모양이다
 * (이메일 찾기 EmailFindTooManyRequestsResponseDto, 로그인은 api 머지 뒤 타입을 다시 뽑으면 생기는 LoginTooManyRequestsResponseDto).
 * 칸은 있는데 읽을 수 없으면 계약이 어긋난 것이라 malformed 로 따로 돌려준다 — 부른 쪽이 요청 제한 문구로 버티고 남긴다.
 * `ApiError` 를 그대로 넘긴다.
 */
export function lockOf(
  error: { status: number; body: unknown },
  serverNow = Date.now(),
): { kind: "locked"; attemptLock: AttemptLock } | { kind: "rate-limited" } | { kind: "malformed" } {
  const body = error.body;
  if (error.status !== 429 || typeof body !== "object" || body === null || !("lockExpiresAt" in body)) return { kind: "rate-limited" };
  const raw = body.lockExpiresAt;
  const lockExpiresAt = typeof raw === "string" ? Date.parse(raw) : NaN;
  return Number.isFinite(lockExpiresAt) ? { kind: "locked", attemptLock: { lockExpiresAt, serverNow } } : { kind: "malformed" };
}

/**
 * 잠금 화면의 남은 시간 글자와 「다시」 버튼을 막을지. now 는 `useNow` 의 값(서버 시계로 옮긴 지금, 시계가 돌기 전에는 null)이다.
 * 시계가 돌기 전(JS 없이 제출해 서버가 그린 화면 · 하이드레이션 전)은 서버가 그린 순간의 남은 시간을 보이고 버튼을 열어 둔다 —
 * 시계가 없으면 버튼을 풀어 줄 수 없어서다. 시계가 돌면 시간이 다 될 때까지 막는다.
 */
export function lockCountdown({ lockExpiresAt, serverNow }: AttemptLock, now: number | null): { text: string; waiting: boolean } {
  const left = lockExpiresAt - (now ?? serverNow);
  return { text: formatLeft(left), waiting: now !== null && left > 0 };
}
