// 회원 탈퇴(WHALEERP-770, api `GET /me/profile/withdrawal-eligibility` · `POST /me/profile/withdrawal`)의 순수 계산 —
// api 실패를 화면 상태로 바꾸기. api 를 부르는 쪽은 src/app/(app)/me/withdrawal/actions.ts 다.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { CONNECTION_FAILED, RATE_LIMITED, RETRY_LATER, isHangulReason, type ApiFailure, type Problem } from "./action-errors.ts";
import { isCurrentPasswordMismatch, CURRENT_PASSWORD_MISMATCH } from "./password-change.ts";

/** 재직(퇴직 예정 포함) 중인 근무지. retiredDate 가 YYYY-MM-DD 면 퇴직 예정이다. */
export interface EmployedStore {
  storeName: string;
  retiredDate: string | null;
}

/** 오류를 붙일 칸 — 지금 비밀번호가 틀리면 입력칸 아래, 그 밖은 버튼 위 안내(form). employed 가 있으면 화면이 재직 안내로 바뀐다. */
export type WithdrawalField = "currentPassword" | "form";

export interface WithdrawalState {
  problem?: Problem<WithdrawalField>;
  employed?: EmployedStore[];
}

/** api 409 의 재직 중 코드. 교착 409 에는 code 가 없다. */
export const EMPLOYED_AFFILIATION = "EMPLOYED_AFFILIATION";
export const EMPLOYED_NOTICE = "근무지 관리자에게 퇴직 처리를 요청해 주세요.";

/** 409 본문의 employedStores 를 모양을 확인하며 꺼낸다. 모양이 다르면 빈 배열(안내 문구는 그대로 보인다). */
export function employedStoresOf(body: unknown): EmployedStore[] {
  const list = (body as { employedStores?: unknown } | null)?.employedStores;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item): EmployedStore[] => {
    const { storeName, retiredDate } = (item ?? {}) as Record<string, unknown>;
    if (typeof storeName !== "string") return [];
    return [{ storeName, retiredDate: typeof retiredDate === "string" ? retiredDate : null }];
  });
}

const problem = (field: WithdrawalField, message: string): WithdrawalState => ({ problem: { field, message } });

/** 서버 액션은 누구나 직접 부를 수 있어 빈 값을 다시 거른다. 맞으면 null. 128자는 api DTO 상한이라 넘으면 지금 비밀번호일 수 없다. */
export function validateWithdrawal(currentPassword: string): WithdrawalState | null {
  if (!currentPassword) return problem("currentPassword", "현재 비밀번호를 입력해 주세요");
  if (currentPassword.length > 128) return problem("currentPassword", CURRENT_PASSWORD_MISMATCH);
  return null;
}

/**
 * api 실패를 화면 상태로. 재직 409 는 employed 를 비워 둔 채 돌려주고 목록은 부른 쪽이 본문에서 채운다(ApiFailure 에 본문이 없다).
 * log 는 계약 어긋남(영어 400 · 예상 밖 4xx)으로 남길지다. 5xx · 연결 실패는 request() 가 남겼다.
 */
export function withdrawalFailure(failure: ApiFailure): { state: WithdrawalState; log: boolean } {
  if (failure === "network") return { state: problem("form", CONNECTION_FAILED), log: false };
  const { status, message, code } = failure;
  if (status === 400) {
    if (isCurrentPasswordMismatch(message)) return { state: problem("currentPassword", CURRENT_PASSWORD_MISMATCH), log: false };
    return { state: problem("form", `탈퇴하지 못했습니다. ${RETRY_LATER}`), log: true };
  }
  if (status === 409) {
    if (code === EMPLOYED_AFFILIATION) return { state: { employed: [] }, log: false };
    // 교착 — api 가 「바뀐 것은 없으니 다시 시도」 문구를 준다. 한글일 때만 그대로 보인다.
    return { state: problem("form", isHangulReason(message) ? message : `탈퇴하지 못했습니다. ${RETRY_LATER}`), log: false };
  }
  if (status === 429) return { state: problem("form", RATE_LIMITED), log: false };
  return { state: problem("form", `탈퇴하지 못했습니다. ${RETRY_LATER}`), log: status < 500 };
}
