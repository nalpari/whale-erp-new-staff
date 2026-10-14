import { cookies } from "next/headers";

// 관리자가 보낸 재설정 링크의 토큰(WHALEERP-173). 메일 링크는 `/password-reset/link#token=…` 이라 토큰이 서버로 오지 않는다 —
// 화면이 처음 열릴 때 주소의 fragment 에서 읽어 서버 액션으로 넘기고, 확인되면 여기 httpOnly 쿠키에 두고 주소에서 지운다.
// 토큰은 비밀번호를 정할 때까지 24시간 동안 다시 쓸 수 있는 열쇠다. localStorage 는 지울 때까지 남아 공용 · 매장 기기에서 다음 사람이
// 이어서 바꿀 수 있고, 브라우저 저장소는 스크립트가 읽는다. 쿠키는 스크립트가 못 읽고 30분 · 이 경로로 범위가 좁다(핀 흐름의 쿠키와 같은 방식).

const PASSWORD_RESET_LINK_COOKIE = "password_reset_link";
/** 링크 화면 밖으로는 쿠키를 보내지 않는다. */
const PASSWORD_RESET_LINK_PATH = "/password-reset/link";
/** 새로고침 · 잠깐 다른 앱에 다녀오는 동안만 이어 준다. 링크의 기한(24시간)은 api 가 판정한다. */
const COOKIE_SECONDS = 30 * 60;
/** api 가 받는 토큰 길이 상한. 넘으면 api 는 400 이다 — 쓸 수 없는 링크로 본다. */
export const LINK_TOKEN_MAX_LENGTH = 200;

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: PASSWORD_RESET_LINK_PATH,
  maxAge,
});

/** 모양이 다르면(비었거나 너무 긺) 없는 것으로 본다. */
export async function readPasswordResetLink(): Promise<string | null> {
  const token = (await cookies()).get(PASSWORD_RESET_LINK_COOKIE)?.value;
  return token && token.length <= LINK_TOKEN_MAX_LENGTH ? token : null;
}

/** 서버 액션에서만 부른다. */
export async function savePasswordResetLink(token: string): Promise<void> {
  (await cookies()).set(PASSWORD_RESET_LINK_COOKIE, token, cookieOptions(COOKIE_SECONDS));
}

/** 서버 액션에서만 부른다. 구운 쿠키와 같은 path 를 줘야 지워진다. */
export async function clearPasswordResetLink(): Promise<void> {
  (await cookies()).delete({ name: PASSWORD_RESET_LINK_COOKIE, ...cookieOptions(0) });
}
