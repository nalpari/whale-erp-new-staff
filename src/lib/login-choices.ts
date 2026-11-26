// 로그인 화면의 「아이디 저장하기」 · 「자동로그인」 체크 기억. 로그인하기 전에 새로 고쳐도 고른 값이 남게 이 기기(localStorage)에 둔다
// (2026-11-26 실기기 피드백). 처음에는 둘 다 끔이다(2026-10-20 노영주). 저장소를 못 쓰면(사생활 보호 모드 등) 기억하지 않는다.

export type LoginChoices = { saveEmail: boolean; autoLogin: boolean };

const KEY = "staff:login-choices";

/** 저장된 글자를 읽는다. 모양이 다르면(손상 · 옛 형식) 없는 것으로 본다. */
export function parseLoginChoices(raw: string | null): LoginChoices | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { saveEmail, autoLogin } = value as Record<string, unknown>;
    if (typeof saveEmail !== "boolean" || typeof autoLogin !== "boolean") return null;
    return { saveEmail, autoLogin };
  } catch {
    return null;
  }
}

export function readLoginChoices(): LoginChoices | null {
  try {
    return parseLoginChoices(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function rememberLoginChoices(choices: LoginChoices): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(choices));
  } catch {
    // 저장소를 못 쓰면 기억하지 않는다 — 이번 화면에서는 고른 값이 그대로 남는다.
  }
}

/** 탈퇴한 뒤에는 고른 값도 잊는다(저장한 이메일과 함께). */
export function forgetLoginChoices(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 위와 같다.
  }
}
