import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, request, type RequestOptions, type Schemas } from "./api";
import { CURRENT_PATH_HEADER, withNext } from "./login-return";
import {
  ACCESS_TOKEN_COOKIE,
  ACCOUNT_COOKIE,
  DEVICE_ID_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SAVED_EMAIL_COOKIE,
  accessTokenCookie,
  clearSessionCookies,
  deviceIdCookie,
  parseAccountCookie,
  savedEmailCookie,
  untilCookie,
  type Account,
} from "./session-cookies";

export type { Account };

export interface Session {
  readonly accessToken: string;
  readonly account: Account;
}

/**
 * 접속이 끝났을 때 가는 곳. 서버 컴포넌트는 쿠키를 지울 수 없어, proxy 가 이 경로에서 갱신을 해 보고
 * 정말 끝났으면(401 · 400) 쿠키를 지우고 안내를 보인다. 살아 있으면 쿠키를 다시 굽고 next(없으면 /home)로 돌려보낸다.
 */
export const EXPIRED_LOGIN_PATH = "/login?expired=1";

/** 만료 안내 주소에 지금 경로(proxy 가 넘긴 헤더)를 next 로 붙인다 — 다시 로그인하면 보던 화면으로 돌아간다(WHALEERP-166). */
async function expiredLoginPath(): Promise<string> {
  return withNext(EXPIRED_LOGIN_PATH, (await headers()).get(CURRENT_PATH_HEADER));
}

/** 로그인에 성공하면 서버 액션에서 부른다. */
export async function saveLogin(result: Schemas["LoginResponseDto"]): Promise<void> {
  const jar = await cookies();
  const until = untilCookie(new Date(result.refreshTokenExpiresAt));
  jar.set(ACCESS_TOKEN_COOKIE, result.accessToken, accessTokenCookie());
  jar.set(REFRESH_TOKEN_COOKIE, result.refreshToken, until);
  jar.set(ACCOUNT_COOKIE, JSON.stringify(result.account), until);
}

/** 「아이디 저장」. 이메일이 있으면 1년 동안 두고, null 이면 지운다. 서버 액션에서만 부른다. */
export async function saveLoginEmail(email: string | null): Promise<void> {
  const jar = await cookies();
  if (email) jar.set(SAVED_EMAIL_COOKIE, email, savedEmailCookie());
  else jar.delete(SAVED_EMAIL_COOKIE);
}

/** 로그인 화면이 이메일 칸을 채울 저장된 이메일. */
export async function getSavedLoginEmail(): Promise<string | null> {
  return (await cookies()).get(SAVED_EMAIL_COOKIE)?.value || null;
}

/**
 * 로그인 흔적(account 쿠키)이 있는지. 액세스 토큰이 만료되고 갱신을 확인하지 못했어도(5xx · 연결 실패 · 429) 로그인한 것으로 본다 —
 * proxy 가 가입 화면을 막는 판정(signedIn)과 같다. 갱신이 401 · 400 으로 끝난 접속은 proxy 가 요청 쿠키에서도 지운다.
 */
export async function hasLoginTrace(): Promise<boolean> {
  return parseAccountCookie((await cookies()).get(ACCOUNT_COOKIE)?.value) !== null;
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  // 손상된 쿠키는 로그아웃으로 취급한다. 판정은 proxy 와 같은 parseAccountCookie 다.
  const account = parseAccountCookie(jar.get(ACCOUNT_COOKIE)?.value);
  if (!accessToken || !account) return null;
  return { accessToken, account };
}

/**
 * 로그인이 필요한 화면 · 액션의 첫 줄. proxy 가 먼저 막지만 proxy 만 믿지 않는다.
 * proxy 는 통과시켰는데 여기서 세션이 없으면(proxy 를 거치지 않은 경로 등, 방어용) 쿠키를 지우는 만료 경로로 보낸다.
 * /login 으로만 보내면 proxy 가 남은 쿠키를 보고 /home 으로 되돌려 끝없이 돈다.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(await expiredLoginPath());
  return session;
}

/** 서버 액션 · 라우트 핸들러에서만 부른다. device_id · saved_email(아이디 저장)은 남긴다. */
export async function clearSession(): Promise<void> {
  clearSessionCookies(await cookies());
}

/** 서버 액션에서만 부른다(없으면 만들어 굽는다). */
export async function getDeviceId(): Promise<string> {
  const existing = await readDeviceId();
  if (existing) return existing;
  const created = crypto.randomUUID();
  await saveDeviceId(created);
  return created;
}

/** 굽지 않고 읽기만 한다. 실패할 수 있는 요청 뒤에 굽고 싶을 때(가입) — 쿠키를 바꾼 액션 뒤에는 Next 가 화면을 서버에서 다시 그린다. */
export async function readDeviceId(): Promise<string | null> {
  return (await cookies()).get(DEVICE_ID_COOKIE)?.value || null;
}

/** 서버 액션에서만 부른다. */
export async function saveDeviceId(deviceId: string): Promise<void> {
  (await cookies()).set(DEVICE_ID_COOKIE, deviceId, deviceIdCookie());
}

/**
 * 로그인한 직원으로 부르는 API. 401 이면 접속이 끝난 것이다 — 비밀번호를 재설정했거나 같은 기기로 다시 로그인해
 * 이 접속이 끊기면, 액세스 토큰이 남은 시간과 상관없이 바로 401 이 된다.
 */
export async function authedRequest<T>(
  path: string,
  options: Omit<RequestOptions, "accessToken"> = {},
): Promise<T> {
  const { accessToken } = await requireSession();
  try {
    return await request<T>(path, { ...options, accessToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(await expiredLoginPath());
    throw error;
  }
}
