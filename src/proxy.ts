import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { refreshAccessToken } from "@/lib/auth";
import {
  ACCESS_TOKEN_COOKIE,
  ACCOUNT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookie,
  clearSessionCookies,
  untilCookie,
} from "@/lib/session-cookies";

// 로그인 없이 여는 화면.
const PUBLIC_PATHS = ["/login", "/password-reset"];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * 접속 유지(WHALEERP-166). 액세스 토큰(15분)이 없고 갱신 토큰이 있으면 다시 받아 굽는다.
 * 같은 요청을 처리할 서버 컴포넌트도 새 토큰을 보도록 요청 쿠키에도 넣는다.
 * 갱신이 401 이면 접속이 끝난 것이라 쿠키를 지우고 만료 안내로 보낸다.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 서버 컴포넌트는 쿠키를 지울 수 없어 401 을 받으면 여기로 보낸다. 남은 쿠키를 지워야 /home ↔ /login 을 돌지 않는다.
  if (pathname === "/login" && searchParams.has("expired")) {
    const response = NextResponse.next();
    clearSessionCookies(response.cookies);
    return response;
  }

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const account = request.cookies.get(ACCOUNT_COOKIE)?.value;
  let refreshedUntil: Date | null = null;

  if (!accessToken && refreshToken && account) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.accessToken;
      refreshedUntil = new Date(refreshed.refreshTokenExpiresAt);
      request.cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const response = NextResponse.redirect(new URL("/login?expired=1", request.url));
        clearSessionCookies(response.cookies);
        return response;
      }
      // api 미기동 · 429 등은 접속이 끝난 게 아니다. 쿠키를 그대로 두고 로그인 화면으로만 보낸다.
      if (!(error instanceof ApiError) && !(error instanceof TypeError)) throw error;
    }
  }

  const loggedIn = Boolean(accessToken && account);
  let response: NextResponse;
  if (!loggedIn && !isPublic(pathname)) response = NextResponse.redirect(new URL("/login", request.url));
  else if (loggedIn && pathname === "/login") response = NextResponse.redirect(new URL("/home", request.url));
  else response = NextResponse.next({ request: { headers: request.headers } });

  if (accessToken && refreshedUntil && refreshToken && account) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookie());
    // 갱신 토큰은 회전하지 않는다. 값은 그대로, 만료만 api 가 준 새 시각으로 민다.
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, untilCookie(refreshedUntil));
    response.cookies.set(ACCOUNT_COOKIE, account, untilCookie(refreshedUntil));
  }
  return response;
}

export const config = {
  // 정적 파일 · 디자인 견본 · 데모는 뺀다(점이 든 경로 = public 파일).
  matcher: ["/((?!_next/|design|demo|.*\\..*).*)"],
};
