// 세션 쿠키 이름과 옵션. proxy(NextResponse.cookies)와 서버 액션(next/headers cookies) 양쪽이 쓰므로
// 여기서는 next/headers 를 가져오지 않는다.

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
/** 로그인 응답의 account({ accountId, email, realName, status }) JSON. */
export const ACCOUNT_COOKIE = "account";
/** 로그인의 deviceIdentifier. 같은 기기로 다시 로그인하면 그 기기의 이전 접속만 끊긴다. 로그아웃해도 남긴다. */
export const DEVICE_ID_COOKIE = "device_id";

/** 액세스 토큰 수명(api: 15분). */
const ACCESS_TOKEN_SECONDS = 15 * 60;
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

export function clearSessionCookies(jar: { delete(name: string): unknown }) {
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  jar.delete(ACCOUNT_COOKIE);
}
