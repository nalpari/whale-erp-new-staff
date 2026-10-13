import type { Schemas } from "./api";

// 세션 쿠키 이름과 옵션. proxy(NextResponse.cookies)와 서버 액션(next/headers cookies) 양쪽이 쓰므로
// 여기서는 next/headers 를 가져오지 않는다.

export type Account = Schemas["LoginAccountResponseDto"];

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
/**
 * 로그인 응답의 account({ accountId, email, realName, status }) JSON. **로그인한 순간의 값**이다 — 갱신 응답에는 계정이
 * 없고 api 에 계정 조회도 없어, 관리자가 상태를 바꾸거나 이메일이 바뀌어도 다시 로그인할 때까지 그대로다. 상태처럼 바뀌는
 * 값으로 화면 동작을 가르려면 그 화면의 API 로 다시 읽는다.
 */
export const ACCOUNT_COOKIE = "account";
/** 로그인의 deviceIdentifier. 같은 기기로 다시 로그인하면 그 기기의 이전 접속만 끊긴다. 로그아웃해도 남긴다. */
export const DEVICE_ID_COOKIE = "device_id";

/**
 * 액세스 토큰 쿠키 수명. 토큰(JWT)은 api 가 낸 때부터 15분인데 쿠키는 브라우저가 받은 때부터 세므로,
 * 같은 15분이면 쿠키는 살았는데 토큰은 죽은 틈이 생긴다. 그 틈의 요청은 401 → 접속 종료로 읽히므로
 * 1분 먼저 쿠키를 끝내 proxy 가 미리 갱신하게 한다.
 */
const ACCESS_TOKEN_SECONDS = 15 * 60 - 60;
const DEVICE_ID_SECONDS = 365 * 24 * 60 * 60;

const BASE = {
  httpOnly: true, // 브라우저 JS 가 토큰을 읽지 못하게 한다
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const accessTokenCookie = () => ({ ...BASE, maxAge: ACCESS_TOKEN_SECONDS });
/** 갱신 토큰 · account 쿠키. 갱신할 때마다 api 가 알려 주는 새 만료 시각까지 민다. */
export const untilCookie = (expires: Date) => ({ ...BASE, expires });
export const deviceIdCookie = () => ({ ...BASE, maxAge: DEVICE_ID_SECONDS });

/**
 * account 쿠키를 읽는다. 읽히지 않거나 모양이 다르면(손상 · `"null"` · 필드 이름이 바뀐 배포 전의 옛 쿠키) null.
 * proxy 와 getSession 이 이 함수 하나로 판정해야 한다 — 둘이 다르게 보면 proxy 는 로그인으로, 화면은 로그아웃으로 보고
 * /home ↔ /login 을 끝없이 돈다.
 */
export function parseAccountCookie(raw: string | undefined): Account | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { accountId, email, realName, status } = value as Record<string, unknown>;
  if (typeof accountId !== "number" || typeof email !== "string" || typeof realName !== "string" || typeof status !== "string") {
    return null;
  }
  // status 는 api enum 이다. 새 값이 더해져도 막지 않고 labelOf 가 값 그대로 보이게 둔다.
  return { accountId, email, realName, status: status as Account["status"] };
}

export function clearSessionCookies(jar: { delete(name: string): unknown }) {
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  jar.delete(ACCOUNT_COOKIE);
}
