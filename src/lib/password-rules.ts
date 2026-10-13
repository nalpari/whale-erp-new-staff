// 비밀번호 규칙 안내(WHALEERP-192). api 의 validateNewPassword(src/auth/password-policy.ts)와 같은 규칙으로
// 화면에 맞음 · 아직을 보이는 데만 쓴다. 통과 여부는 api 가 정한다(400 + 사유).
// 대문자 · 소문자 · 숫자 · 그 밖(특수문자, 공백 · 한글 포함) 중 3종 이상이면 8자↑, 2종이면 10자↑, 1종 불가, 20자 이하,
// 이메일이나 @ 앞부분과 같으면 불가(대소문자 무시).

export interface PasswordRuleCheck {
  kinds: boolean;
  length: boolean;
  notEmail: boolean;
}

export function checkPasswordRules(password: string, email: string): PasswordRuleCheck {
  const kinds = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password)).length;
  // 사용자가 보는 글자 수로 센다(api 와 같다). length 는 이모지 하나를 두 글자로 센다.
  const length = [...password].length;
  const minimum = kinds >= 3 ? 8 : 10;
  const lowered = password.toLowerCase();
  const loweredEmail = email.trim().toLowerCase();
  return {
    kinds: kinds >= 2,
    length: length >= minimum && length <= 20,
    notEmail: password.length > 0 && lowered !== loweredEmail && lowered !== loweredEmail.split("@")[0],
  };
}
