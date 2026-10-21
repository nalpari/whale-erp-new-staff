// 비밀번호 변경(WHALEERP-194)의 순수 계산 — 넣은 값 거르기, api 실패를 화면 상태로 바꾸기. api 를 부르는 쪽은
// src/app/(app)/me/password/actions.ts 다. node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { CONNECTION_FAILED, RATE_LIMITED, RETRY_LATER, isHangulReason, type ApiFailure, type Problem } from "./action-errors.ts";

/**
 * 오류를 붙일 칸. 지금 비밀번호가 틀리면 첫 칸, 규칙 위반은 새 비밀번호 칸, 두 칸이 다르거나 그 밖의 오류(요청 한도 · 서버 ·
 * 연결)는 「새 비밀번호 확인」 칸 아래다.
 */
export type PasswordField = "currentPassword" | "newPassword" | "confirmation";

export interface PasswordChangeState {
  problem?: Problem<PasswordField>;
}

/** api 의 지금 비밀번호 불일치 400 사유(MyPasswordService). 규칙 위반 사유와 같은 400 이라 글자로 가른다. */
export const CURRENT_PASSWORD_MISMATCH = "지금 비밀번호가 맞지 않습니다";

const problem = (field: PasswordField, message: string): PasswordChangeState => ({ problem: { field, message } });

/**
 * api 에 보내기 전에 칸 순서대로 거른다. 맞으면 null. 서버 액션은 누구나 직접 부를 수 있어 화면이 막은 것도 다시 본다.
 * 지금 비밀번호는 api ChangeMyPasswordDto 의 128자 상한, 새 비밀번호는 api 규칙의 20자(사용자가 보는 글자 수)다.
 */
export function validatePasswordChange(current: string, next: string, confirmation: string): PasswordChangeState | null {
  if (!current) return problem("currentPassword", "지금 비밀번호를 넣어 주세요");
  // 128자를 넘는 값은 지금 비밀번호일 수 없다(api 가 그보다 긴 값을 받지 않는다).
  if (current.length > 128) return problem("currentPassword", CURRENT_PASSWORD_MISMATCH);
  if (!next) return problem("newPassword", "새 비밀번호를 넣어 주세요");
  if ([...next].length > 20) return problem("newPassword", "비밀번호는 20자까지 쓸 수 있습니다");
  if (next !== confirmation) return problem("confirmation", "두 칸의 새 비밀번호가 다릅니다");
  return null;
}

/** api 실패를 화면 상태로. log 는 계약 어긋남(영어 400 · 예상 밖 4xx)으로 남길지다. 5xx · 연결 실패는 request() 가 남겼다. */
export function passwordChangeFailure(failure: ApiFailure): { state: PasswordChangeState; log: boolean } {
  if (failure === "network") return { state: problem("confirmation", CONNECTION_FAILED), log: false };
  const { status, message } = failure;
  if (status === 400) {
    if (message === CURRENT_PASSWORD_MISMATCH) return { state: problem("currentPassword", message), log: false };
    if (isHangulReason(message)) return { state: problem("newPassword", message), log: false };
    // 영어 원문(형식 검증)은 화면과 api 의 계약이 어긋난 신호라 남기고 대체 문구를 보인다.
    return { state: problem("newPassword", "비밀번호 조건을 확인해 주세요"), log: true };
  }
  if (status === 429) return { state: problem("confirmation", RATE_LIMITED), log: false };
  return { state: problem("confirmation", `비밀번호를 바꾸지 못했습니다. ${RETRY_LATER}`), log: status < 500 };
}
