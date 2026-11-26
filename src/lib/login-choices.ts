// 로그인 화면의 「아이디 저장하기」 체크 기억. 로그인하기 전에 새로 고쳐도 고른 값이 남게 한다(2026-11-26 실기기 피드백).
// 처음에는 끔이다(2026-10-20 노영주) — 저장한 이메일(saved_email 쿠키)이 있으면 켜진 채 시작하고, 이 탭에 기억한 값이 있으면 그 값이 앞선다. 저장소를 못 쓰면(사생활 보호 모드 등) 기억하지 않는다.
// - 이 탭(sessionStorage)에만 두고 로그인을 보낼 때 지운다. 기기 전체(localStorage)에 두면 공용 기기에서 앞 사람이 켜기만 하고 떠났을 때
//   다음 사람의 화면이 이메일 칸은 빈 채 체크만 켜져, 그대로 로그인하면 그 사람의 이메일이 1년짜리 쿠키에 남았다(PR #101 재영 리뷰 1).
//   탭으로 좁혔을 뿐이라, 같은 탭(설치형 앱은 앱이 켜져 있는 동안)에서 켜기만 하고 보내지 않은 채 떠나면 다음 사람에게 남는다 —
//   재영님이 제안한 두 방법 중 이쪽을 골랐다.
// - 자동로그인은 기억하지 않는다 — 새로 고치면 꺼진 채다. 켜기만 하고 보내지 않은 채 떠나면 같은 탭에서 새로 고친 다음 사람에게 켜진 채
//   보였다(PR #101 재영 리뷰 3). 새로 고쳐도 남기는 것은 아이디 저장뿐이다.

const SAVE_EMAIL_KEY = "staff:login-choices";
/** 전에 자동로그인을 이 탭에 기억하던 키 — 이제 쓰지 않고 지우기만 한다. */
const LEGACY_AUTO_LOGIN_KEY = "staff:login-auto";

/** 저장된 「아이디 저장하기」 기억을 읽는다. 모양이 다르면(손상) 없는 것으로 본다. saveEmail 말고 다른 값은 보지 않는다. */
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
    return parseSaveEmailChoice(window.sessionStorage.getItem(SAVE_EMAIL_KEY));
  } catch {
    return null;
  }
}

export function rememberSaveEmailChoice(saveEmail: boolean): void {
  try {
    window.sessionStorage.setItem(SAVE_EMAIL_KEY, JSON.stringify({ saveEmail }));
  } catch {
    // 저장소를 못 쓰면 기억하지 않는다 — 이번 화면에서는 고른 값이 그대로 남는다.
  }
}

/** 로그인을 보낼 때 · 탈퇴한 뒤에 고른 값을 잊는다. 옛 형식(기기 전체 · 자동로그인 탭 기억)도 함께 지운다. */
export function forgetLoginChoices(): void {
  for (const remove of [
    () => window.sessionStorage.removeItem(SAVE_EMAIL_KEY),
    () => window.localStorage.removeItem(SAVE_EMAIL_KEY),
    () => window.sessionStorage.removeItem(LEGACY_AUTO_LOGIN_KEY),
  ]) {
    try {
      remove();
    } catch {
      // 저장소를 못 쓰면 지울 것도 없다.
    }
  }
}
