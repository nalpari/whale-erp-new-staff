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

/** account 쿠키가 읽히는 JSON 일 때만 세션으로 친다. 깨진 쿠키를 세션으로 보면 화면은 못 읽어 /home ↔ /login 을 돈다. */
function readableAccount(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return undefined;
  }
}

/**
 * 접속 유지(WHALEERP-166). 액세스 토큰(14분)이 없고 갱신 토큰이 있으면 다시 받아 굽는다.
 * 같은 요청을 처리할 서버 컴포넌트도 새 토큰을 보도록 요청 쿠키에도 넣는다.
 * 갱신이 401 이면 접속이 끝난 것이라 쿠키를 지우고 만료 안내로 보낸다.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // 만료 안내(/login?expired=1). 서버 컴포넌트가 401 을 받았거나 세션을 읽지 못하면 이리로 보낸다.
  // 주소만 보고 쿠키를 지우면 다시 로그인한 뒤 뒤로 가기 · 새로 고침, 남이 건 링크만으로 살아 있는 접속이 끊기므로
  // 갱신을 해 보고 정말 끝났을 때(401)만 지운다.
  const expiredNotice = pathname === "/login" && searchParams.has("expired");

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const rawAccount = request.cookies.get(ACCOUNT_COOKIE)?.value;
  const account = readableAccount(rawAccount);
  let refreshedUntil: Date | null = null;
  let sessionEnded = Boolean(rawAccount) && !account;

  if ((!accessToken || expiredNotice) && refreshToken && account) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.accessToken;
      refreshedUntil = new Date(refreshed.refreshTokenExpiresAt);
      request.cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) sessionEnded = true;
      // api 미기동 · 429 등은 접속이 끝난 게 아니다. 쿠키를 그대로 두고 로그인 화면으로만 보낸다.
      else if (!(error instanceof ApiError) && !(error instanceof TypeError)) throw error;
      if (expiredNotice) accessToken = undefined;
    }
  }

  if (sessionEnded) {
    const response = expiredNotice
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login?expired=1", request.url));
    clearSessionCookies(response.cookies);
    return response;
  }

  // 만료 안내에서는 방금 갱신에 성공해야 로그인된 것으로 본다(남은 액세스 토큰은 api 가 이미 거절한 것일 수 있다).
  const loggedIn = Boolean(accessToken && account) && (!expiredNotice || refreshedUntil !== null);
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
