// 로그인 뒤 보던 화면으로 돌려보내기(WHALEERP-166). 로그인 화면으로 보낼 때 보던 경로를 주소의 next 로 싣고,
// 로그인에 성공하면 그리로 보낸다. proxy(next/server)와 서버 액션 · 서버 컴포넌트(next/headers) 양쪽이 쓰므로
// 여기서는 next/headers 를 가져오지 않는다.

/** 로그인 없이 여는 화면. 폴더((auth))가 아니라 이 경로 목록으로 판정한다 — (auth) 에 화면을 더하면 여기에도 더한다. */
export const PUBLIC_PATHS = ["/login", "/password-reset", "/email-find", "/join", "/invite"];

export const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/** 로그인 화면 주소의 돌아갈 곳 파라미터. */
export const NEXT_PARAM = "next";

/**
 * proxy 가 화면 · 액션에 넘기는 지금 경로(경로 + 쿼리). 서버 컴포넌트는 자기 주소를 모르므로 requireSession 이 이 값으로
 * 만료 안내의 next 를 만든다. 로그인이 필요한 화면 요청에서는 proxy 가 덮어쓰므로 브라우저가 보낸 같은 이름의 헤더는 닿지 않는다.
 */
export const CURRENT_PATH_HEADER = "x-staff-path";

/** 로그인한 뒤 기본으로 가는 곳. 돌아갈 곳이 이 화면이면 주소에 next 를 붙이지 않는다. */
export const HOME_PATH = "/home";

const MAX_NEXT_LENGTH = 2048;
const ORIGIN = "http://next.invalid";

/**
 * 돌아갈 곳으로 받을 수 있는 값이면 경로 + 쿼리를, 아니면 null 을 돌려준다. next 는 주소에 실리는 값이라 남이 만든 링크로도
 * 들어온다 — 이 사이트의 경로만 받는다. `/` 로 시작하지 않거나 `//` · `\` · 제어 문자가 들었거나 다른 출처로 풀리거나
 * 정규화한 뒤 `//` 로 시작하면 버리고, 로그인 없이 여는 화면(로그인 · 재설정 · 이메일 찾기 · 가입)도 버린다(로그인한 뒤 갈 곳이
 * 아니다). 해시는 서버에 오지 않아 다루지 않는다.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > MAX_NEXT_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // 브라우저는 `\` 를 `/` 로 읽어 `/\evil.com` 이 다른 출처가 된다. 제어 문자(탭 · 줄바꿈)는 URL 파서가 지우고 읽는다.
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(raw, ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== ORIGIN || isPublic(url.pathname)) return null;
  // `/.//evil.com` · `/a/..//evil.com` · `/%2e//evil.com` 은 위 검사를 지나도 정규화하면 `//evil.com`(다른 출처)이 된다.
  const path = url.pathname + url.search;
  if (path.startsWith("//")) return null;
  return path;
}

/** 로그인 화면 주소(`/login`, `/login?expired=1` …)에 돌아갈 곳을 붙인다. 받을 수 없는 값이거나 홈이면 붙이지 않는다. */
export function withNext(loginPath: string, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  if (!safe || safe === HOME_PATH || safe === "/") return loginPath;
  return `${loginPath}${loginPath.includes("?") ? "&" : "?"}${NEXT_PARAM}=${encodeURIComponent(safe)}`;
}
