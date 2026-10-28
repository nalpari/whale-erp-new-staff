"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { RATE_LIMITED } from "@/lib/action-errors";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import type { AttemptLock } from "@/lib/attempt-lock";
import { clientIpFrom } from "@/lib/client-ip";
import { clearMyInvitation, readMyInvitation, saveJoinedStore, saveMyInvitation } from "@/lib/invitation-cookie";
import { ADD_WORKPLACE_PATH, invitationProblemOf, isInviteCode, normalizeInviteCode } from "@/lib/join";
import { acceptMyInvitation, checkMyInvitation } from "@/lib/my-invitations";
import { CONNECTION_FAILED_MESSAGE } from "@/app/(auth)/_components/auth-screen";

// 로그인한 직원의 근무지 추가(WHALEERP-604, api 603). 가입 첫 단계의 초대 코드 입력(join/actions.ts)과 같은 판정 · 안내를 쓰고,
// 휴대전화번호는 받지 않는다(api 가 계정의 번호로 찾는다).

/** 계정 번호 + 코드에 맞는 초대가 없다. 가입과 같이 어느 쪽이 틀렸는지 알리지 않는다. */
const CODE_MISMATCH = "초대 코드를 다시 확인해 주세요. 이 계정의 휴대전화번호로 받은 초대만 더할 수 있습니다";

/**
 * 초대 코드 입력 결과. 맞으면 초대를 쿠키에 두고 초대 확인(invitations/confirm)으로 가므로 상태로 돌아오지 않는다.
 * - input: 입력 화면. field 가 code 면 칸 아래, form 이면 버튼 위 알림.
 * - locked: 계정 번호로 5번 틀려 30분 잠김. ended · joined: 끝난 초대 · 이미 가입을 마친 초대.
 */
export type AddCodeState =
  | { step: "input"; error?: string; field?: "code" | "form" }
  | ({ step: "locked" } & AttemptLock)
  | { step: "ended" | "joined" };

export async function checkMyInviteCodeAction(_previous: AddCodeState, formData: FormData): Promise<AddCodeState> {
  const code = normalizeInviteCode(String(formData.get("code") ?? ""));
  const input = (field: "code" | "form", error: string): AddCodeState => ({ step: "input", field, error });
  // 모양이 틀린 값은 api 에 보내지 않는다 — 형식 오류로는 잠금 횟수가 쌓이지 않지만 요청 제한에는 든다.
  if (!isInviteCode(code)) return input("code", "초대 코드 8자리를 확인해 주세요. 0 · O · 1 · I 는 쓰지 않습니다");

  try {
    await checkMyInvitation({ code }, clientIpFrom(await headers()));
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      if (problem.kind === "not-found") return input("form", CODE_MISMATCH);
      if (problem.kind === "ended" || problem.kind === "joined") return { step: problem.kind };
      if (problem.kind === "locked") return { step: "locked", ...problem.attemptLock };
      if (problem.kind === "rate-limited") return input("form", RATE_LIMITED);
      // 5xx 는 request() 가 남겼다. 모양은 위에서 걸렀으니 4xx 는 api 계약이 어긋난 것이다.
      if (error.status < 500) logUnexpected("add-workplace", error);
      return input("form", "초대를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
    }
    if (error instanceof NetworkError) return input("form", CONNECTION_FAILED_MESSAGE);
    // 401 의 만료 안내 redirect 도 여기서 그대로 던진다.
    throw error;
  }
  await saveMyInvitation({ code });
  redirect(`${ADD_WORKPLACE_PATH}/confirm`);
}

/**
 * 근무지 추가 확인의 「근무지 추가」 결과. 더하면 완료 화면(invitations/done)으로 가므로 상태로 돌아오지 않는다.
 * - expired: 초대 쿠키(30분)가 없다 — 처음부터 다시.
 * - not-mine: 로그인한 채 연 링크의 초대가 이 계정의 번호로 온 것이 아니다(링크의 토큰인데 404 INVITATION_NOT_FOUND).
 * 실패에서는 쿠키를 건드리지 않는다 — 지우면 Next 가 이 화면을 서버에서 다시 그려 안내가 덮인다(join/actions.ts 와 같다).
 */
export type AcceptState =
  | { step: "input"; error?: string }
  | ({ step: "locked" } & AttemptLock)
  | { step: "ended" | "joined" | "not-mine" | "expired" };

/** 근무지를 더했는지 모른다(5xx · 연결 실패 · 시간 초과). 다시 누르면 api 가 지금 상태로 답한다(더했으면 「이미 가입을 마친 초대」). */
const ACCEPT_UNKNOWN = "근무지를 더했는지 확인하지 못했습니다. 잠시 뒤 「근무지 추가」를 다시 누르면 결과를 알려 드립니다";

export async function acceptMyInvitationAction(_previous: AcceptState, formData: FormData): Promise<AcceptState> {
  const lookup = await readMyInvitation();
  if (!lookup) return { step: "expired" };
  let result;
  try {
    result = await acceptMyInvitation(
      {
        ...lookup,
        // 체크 칸은 api 가 물을 때(asksHqSharingConsent)만 그려진다. 묻지 않는 초대에 보내도 api 는 바꾸지 않는다.
        ...(formData.get("hqSharingConsented") === "on" ? { hqSharingConsented: true } : {}),
      },
      clientIpFrom(await headers()),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      // 코드면 그사이 재발송으로 코드가 바뀐 것이라 끝난 초대와 같은 안내다.
      if (problem.kind === "not-found") return { step: "token" in lookup ? "not-mine" : "ended" };
      if (problem.kind === "ended" || problem.kind === "joined") return { step: problem.kind };
      if (problem.kind === "locked") return { step: "locked", ...problem.attemptLock };
      if (problem.kind === "rate-limited") return { step: "input", error: RATE_LIMITED };
      if (error.status < 500) logUnexpected("add-workplace-accept", error);
      return { step: "input", error: error.status >= 500 ? ACCEPT_UNKNOWN : "근무지를 더하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
    }
    if (error instanceof NetworkError) return { step: "input", error: ACCEPT_UNKNOWN };
    throw error;
  }
  await clearMyInvitation();
  await saveJoinedStore(result.storeName, `${ADD_WORKPLACE_PATH}/done`);
  // 확인 화면을 히스토리에 남기지 않는다. 뒤로 가면 다 쓴 초대를 다시 확인하게 된다.
  redirect(`${ADD_WORKPLACE_PATH}/done`, RedirectType.replace);
}
