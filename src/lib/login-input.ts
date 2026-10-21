// 로그인 폼 값 읽기(WHALEERP-165 · 아이디 저장 · 자동 로그인). 순수 계산이라 node --test 가 직접 읽는다(값 import 없음).

export interface LoginInput {
  /** 앞뒤 공백을 뗀 이메일. 대소문자는 api 가 가리지 않는다. */
  email: string;
  password: string;
  /** 「아이디 저장」 — 켜면 이 값(소문자)을 저장한다. */
  saveEmail: boolean;
  /** 「자동 로그인」 = api rememberMe. 켜면 마지막 사용 후 30일, 끄면 7일. */
  autoLogin: boolean;
}

/**
 * 로그인 폼을 읽는다. 체크 박스는 켜졌을 때만 숨은 칸이 "on" 으로 실린다(공통 CheckBox). 값이 없거나 그 밖이면 끔이다 —
 * 기본은 둘 다 끔(2026-10-20 노영주).
 */
export function readLoginForm(form: Pick<FormData, "get">): LoginInput {
  return {
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
    saveEmail: form.get("saveEmail") === "on",
    autoLogin: form.get("autoLogin") === "on",
  };
}
