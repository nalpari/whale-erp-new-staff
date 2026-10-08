import { cookies } from "next/headers";

// 비밀번호 재설정 단계(핀 요청 → 핀 입력 → 새 비밀번호) 사이에 들고 다니는 값.
// 핀은 새 비밀번호 요청에 다시 보내야 하지만 URL · 로그에 남기면 안 되므로 httpOnly 쿠키에 둔다.

const PASSWORD_RESET_COOKIE = "password_reset";
/** 재설정 화면 밖으로는 쿠키를 보내지 않는다. */
const PASSWORD_RESET_PATH = "/password-reset";
/** 핀 입력과 새 비밀번호를 합쳐 핀을 낸 시각부터 10분(api 한 시계). */
export const PIN_VALID_MS = 10 * 60 * 1000;
/** api 는 직전 발급 뒤 1분 안의 요청을 보내지 않고도 204 로 답한다. 그동안 「다시 받기」를 막는다. */
export const PIN_RESEND_MS = 60 * 1000;
/** 쿠키는 10분보다 길게 둔다. 10분이 지난 뒤 들어와도 「시간이 지났습니다」를 보여 주려는 것이다. */
const COOKIE_SECONDS = 30 * 60;

export interface PasswordReset {
  email: string;
  /** 핀을 요청한 시각(ms). 서버가 실제로 낸 시각과 몇 초 다를 수 있어 시계는 안내용이다 — 판정은 api 가 한다. */
  issuedAt: number;
  /** 확인을 마친 핀. 있으면 새 비밀번호 단계다. */
  pin?: string;
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: PASSWORD_RESET_PATH,
  maxAge,
});

export async function readPasswordReset(): Promise<PasswordReset | null> {
  const raw = (await cookies()).get(PASSWORD_RESET_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PasswordReset;
  } catch {
    return null;
  }
}

/** 서버 액션에서만 부른다. */
export async function savePasswordReset(state: PasswordReset): Promise<void> {
  (await cookies()).set(PASSWORD_RESET_COOKIE, JSON.stringify(state), cookieOptions(COOKIE_SECONDS));
}

/** 서버 액션에서만 부른다. delete(name) 은 path 를 받지 않아, 같은 path 로 빈 값을 0초 수명으로 굽는다. */
export async function clearPasswordReset(): Promise<void> {
  (await cookies()).set(PASSWORD_RESET_COOKIE, "", cookieOptions(0));
}

export const isPinExpired = (state: PasswordReset, now = Date.now()) => now - state.issuedAt >= PIN_VALID_MS;

/**
 * 화면에 보일 이메일(LOGIN-9, 앱 안 이메일 가림 한 규칙). @ 앞은 처음 2글자 + 마지막 1글자만 두고 나머지는 글자 수만큼
 * `*` 로 가린다. 3글자 이하면 첫 글자만 둔다. 도메인은 그대로. haeun.lee@gmail.com → ha******e@gmail.com
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = [...email.slice(0, at)];
  const masked =
    local.length <= 3
      ? local[0] + "*".repeat(local.length - 1)
      : local.slice(0, 2).join("") + "*".repeat(local.length - 3) + local[local.length - 1];
  return masked + email.slice(at);
}
