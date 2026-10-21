import { NextResponse, type NextRequest } from "next/server";
import { ApiError, NetworkError } from "@/lib/api";
import { refreshAccessToken } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { CURRENT_PATH_HEADER, HOME_PATH, NEXT_PARAM, isPublic, safeNextPath, withNext } from "@/lib/login-return";
import {
  ACCESS_TOKEN_COOKIE,
  ACCOUNT_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookie,
  clearSessionCookies,
  parseAccountCookie,
  untilCookie,
} from "@/lib/session-cookies";

/** 갱신이 필요한 화면 요청(액세스 토큰 쿠키가 없을 때 등)은 응답 전에 갱신을 기다리므로 api 가 멈춰도 오래 붙잡지 않는다. */
const REFRESH_TIMEOUT_MS = 5_000;

/** 갱신이 401 · 400 아닌 이유(연결 실패 · 시간 초과 · 429 · 5xx)로 실패해 접속이 끝났는지 확인하지 못했을 때 가는 곳. 만료 안내와 달리 쿠키를 지우지 않는다. */
const UNAVAILABLE_LOGIN_PATH = "/login?unavailable=1";

/**
 * 접속 유지(WHALEERP-166). 액세스 토큰 쿠키(14분)가 없고 갱신 토큰이 있으면 다시 받아 굽는다.
 * 같은 요청을 처리할 서버 컴포넌트도 새 토큰을 보도록 요청 쿠키에도 넣는다.
 * 갱신이 401 · 400 이면 접속이 끝난 것이라 쿠키를 지우고 만료 안내로 보낸다(로그인 없이 여는 화면은 쿠키만 지우고 그대로 연다).
 * 그 밖의 실패(api 미기동 · 시간 초과 · 429 · 5xx)는 쿠키를 두고 「확인하지 못했다」 안내로 보낸다.
 * 로그인 화면으로 보낼 때는 보던 경로를 next 로 싣고, 로그인돼 있으면 next 로 보낸다(login-return.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // 만료 안내(/login?expired=1). 서버 컴포넌트가 401 을 받았거나 세션을 읽지 못하면 이리로 보낸다.
  // 주소만 보고 쿠키를 지우면 다시 로그인한 뒤 뒤로 가기 · 새로 고침, 남이 건 링크만으로 살아 있는 접속이 끊기므로
  // 갱신을 해 보고 정말 끝났을 때(401 · 400)만 지운다.
  // 「확인하지 못했다」 안내(/login?unavailable=1)도 같이 다시 확인한다 — 남은 액세스 토큰만 보고 로그인으로 치면
  // api 가 이미 거절한 토큰으로 /home 에 갔다가 401 로 다시 만료 안내 → 확인 실패 → /home 을 돈다.
  const expiredNotice = pathname === "/login" && searchParams.has("expired");
  const recheck = expiredNotice || (pathname === "/login" && searchParams.has("unavailable"));
  // 로그인 화면으로 보낼 때 실을 돌아갈 곳. 로그인이 필요한 화면이면 지금 경로, 로그인 화면이면 이미 실린 next 를 이어 간다.
  const returnTo = isPublic(pathname) ? searchParams.get(NEXT_PARAM) : pathname + request.nextUrl.search;

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const rawAccount = request.cookies.get(ACCOUNT_COOKIE)?.value;
  // 화면의 getSession 과 같은 판정이어야 한다. 읽히지 않는 account 쿠키는 세션으로 치지 않고 지운다.
  const account = parseAccountCookie(rawAccount) ? rawAccount : undefined;
  let refreshedUntil: Date | null = null;
  let sessionEnded = Boolean(rawAccount) && !account;
  let unavailable = false;

  if ((!accessToken || recheck) && refreshToken && account) {
    try {
      const refreshed = await refreshAccessToken(refreshToken, {
        clientIp: clientIpFrom(request.headers),
        timeoutMs: REFRESH_TIMEOUT_MS,
      });
      accessToken = refreshed.accessToken;
      refreshedUntil = new Date(refreshed.refreshTokenExpiresAt);
      request.cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
    } catch (error) {
      // 401 은 끝난 접속, 400 은 쓸 수 없는 토큰(형식 검증)이라 다시 해도 낫지 않는다.
      if (error instanceof ApiError && (error.status === 401 || error.status === 400)) sessionEnded = true;
      else if (error instanceof ApiError || error instanceof NetworkError) {
        // 5xx · 연결 실패는 request() 가 이미 남겼다. 429 등 4xx 는 여기서 남긴다.
        if (error instanceof ApiError && error.status < 500) console.error("[proxy] 갱신 실패", error.status, error.message);
        unavailable = true;
      } else throw error;
      if (recheck) accessToken = undefined;
    }
  }

  if (sessionEnded) {
    // 로그인 없이 여는 화면(만료 안내 · 비밀번호 재설정 · 이메일 찾기)은 쿠키만 지우고 그대로 연다. 다른 기기에서 비밀번호를 바꿔
    // 접속이 끝난 직원이 「비밀번호를 잊으셨나요」를 눌렀을 때 만료 안내로 한 번 튕기지 않게 한다.
    const response = expiredNotice || isPublic(pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL(withNext("/login?expired=1", returnTo), request.url));
    clearSessionCookies(response.cookies);
    return response;
  }

  // 갱신이 401 · 400 아닌 이유로 실패했으면 끝났다고 단정하지 않고 「확인하지 못했다」 안내로 보낸다. 로그인이 필요한
  // 화면과 만료 안내만 해당하고, 그 밖의 공개 화면(/login · /password-reset · /email-find)은 그대로 연다.
  if (unavailable && (expiredNotice || !isPublic(pathname))) {
    return NextResponse.redirect(new URL(withNext(UNAVAILABLE_LOGIN_PATH, returnTo), request.url));
  }

  // 만료 · 확인 실패 안내에서는 방금 갱신에 성공해야 로그인된 것으로 본다(남은 액세스 토큰은 api 가 이미 거절한 것일 수 있다).
  const loggedIn = Boolean(accessToken && account) && (!recheck || refreshedUntil !== null);
  let response: NextResponse;
  if (!loggedIn && !isPublic(pathname)) response = NextResponse.redirect(new URL(withNext("/login", returnTo), request.url));
  else if (loggedIn && pathname === "/login") {
    response = NextResponse.redirect(new URL(safeNextPath(searchParams.get(NEXT_PARAM)) ?? HOME_PATH, request.url));
  } else {
    // 화면 · 액션이 만료 안내의 next 를 만들 수 있게 지금 경로를 넘긴다. 브라우저가 보낸 같은 이름의 헤더는 덮어쓴다.
    const headers = new Headers(request.headers);
    headers.set(CURRENT_PATH_HEADER, pathname + request.nextUrl.search);
    response = NextResponse.next({ request: { headers } });
  }

  if (accessToken && refreshedUntil && refreshToken && account) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookie());
    // 갱신 토큰은 회전하지 않는다. 값은 그대로, 만료만 api 가 준 새 시각으로 민다(자동 로그인이면 30일, 아니면 7일).
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, untilCookie(refreshedUntil));
    response.cookies.set(ACCOUNT_COOKIE, account, untilCookie(refreshedUntil));
  }
  return response;
}

export const config = {
  // 정적 파일 · 디자인 견본은 뺀다(점이 든 경로 = public 파일). design 은 /design 과 그 아래만 — /designer 같은 경로는 돈다.
  matcher: ["/((?!_next/|design/|design$|.*\\..*).*)"],
};
