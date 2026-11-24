// 로그인 폼 값 읽기(WHALEERP-165 · 아이디 저장 · 자동 로그인). 순수 계산이라 node --test 가 직접 읽는다(값 import 없음).

export interface LoginInput {
  /** 앞뒤 공백을 뗀 이메일. 대소문자는 api 가 가리지 않는다. */
  email: string;
  password: string;
  /** 「아이디 저장」 — 켜면 이 값(소문자)을 저장한다. */
  saveEmail: boolean;
  /** 「자동 로그인」 = api rememberMe. 켜면 마지막 사용 후 30일, 끄면 7일. */
  autoLogin: boolean;
  /**
   * 설치형 앱이 준 기기 식별자(64자 소문자 16진수, 앱 브리지 deviceId). 앱 밖 · 옛 앱 · 아직 못 받았으면 null —
   * 그때는 지금처럼 쿠키 UUID 를 쓴다. 폼에서 오는 값이라 형식이 아니면 버린다.
   */
  appDeviceId: string | null;
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
    appDeviceId: appDeviceIdOf(form.get("appDeviceId")),
  };
}

/** 앱 기기 식별자 칸을 읽는다. native-bridge 의 APP_DEVICE_ID_PATTERN 과 같은 모양만 받는다(이 파일은 값 import 를 하지 않는다). */
export function appDeviceIdOf(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value) ? value : null;
}
