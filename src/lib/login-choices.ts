// 로그인 화면의 「아이디 저장하기」 · 「자동로그인」 체크 기억. 로그인하기 전에 새로 고쳐도 고른 값이 남게 한다(2026-11-26 실기기 피드백).
// 처음에는 둘 다 끔이다(2026-10-20 노영주). 저장소를 못 쓰면(사생활 보호 모드 등) 기억하지 않는다.
// - 아이디 저장하기: 이 기기(localStorage)에 둔다 — 저장한 이메일(saved_email 쿠키)과 같이 다음 로그인에도 남는다.
// - 자동로그인: 이 탭(sessionStorage)에만 두고 로그인을 보낼 때 지운다(실패해도 다시 두지 않고 화면 상태로만 남긴다). 공용 기기에서 앞 사람이 켠 자동로그인이
//   다음 사람의 로그인 화면에 켜진 채 넘어가지 않게(PR #101 pr-agent 리뷰).

const SAVE_EMAIL_KEY = "staff:login-choices";
const AUTO_LOGIN_KEY = "staff:login-auto";

/** 저장된 「아이디 저장하기」 기억을 읽는다. 모양이 다르면(손상 · 옛 형식) 없는 것으로 본다. 옛 형식에 함께 있던 autoLogin 은 읽지 않는다. */
export function parseSaveEmailChoice(raw: string | null): boolean | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { saveEmail } = value as Record<string, unknown>;
    return typeof saveEmail === "boolean" ? saveEmail : null;
  } catch {
    return null;
  }
}

export function readSaveEmailChoice(): boolean | null {
  try {
    return parseSaveEmailChoice(window.localStorage.getItem(SAVE_EMAIL_KEY));
  } catch {
    return null;
  }
}

export function rememberSaveEmailChoice(saveEmail: boolean): void {
  try {
    window.localStorage.setItem(SAVE_EMAIL_KEY, JSON.stringify({ saveEmail }));
  } catch {
    // 저장소를 못 쓰면 기억하지 않는다 — 이번 화면에서는 고른 값이 그대로 남는다.
  }
}

/** 이 탭에서 로그인을 보내기 전에 켜 둔 자동로그인인지. */
export function readAutoLoginChoice(): boolean {
  try {
    return window.sessionStorage.getItem(AUTO_LOGIN_KEY) === "1";
  } catch {
    return false;
  }
}

/** 켜면 이 탭에 기억하고, 끄면 지운다. */
export function rememberAutoLoginChoice(autoLogin: boolean): void {
  try {
    if (autoLogin) window.sessionStorage.setItem(AUTO_LOGIN_KEY, "1");
    else window.sessionStorage.removeItem(AUTO_LOGIN_KEY);
  } catch {
    // 위와 같다.
  }
}

/** 탈퇴한 뒤에는 고른 값을 모두 잊는다(저장한 이메일과 함께). */
export function forgetLoginChoices(): void {
  try {
    window.localStorage.removeItem(SAVE_EMAIL_KEY);
  } catch {
    // 위와 같다.
  }
  rememberAutoLoginChoice(false);
}
