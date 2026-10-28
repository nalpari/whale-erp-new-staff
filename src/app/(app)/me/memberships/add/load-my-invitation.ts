import { headers } from "next/headers";
import { RATE_LIMITED } from "@/lib/action-errors";
import { ApiError, NetworkError, logUnexpected, type Schemas } from "@/lib/api";
import type { AttemptLock } from "@/lib/attempt-lock";
import { clientIpFrom } from "@/lib/client-ip";
import { readMyInvitation } from "@/lib/invitation-cookie";
import { invitationProblemOf } from "@/lib/join";
import { checkMyInvitation } from "@/lib/my-invitations";
import { CONNECTION_FAILED_MESSAGE } from "@/app/(auth)/_components/auth-screen";

/**
 * 근무지 추가 확인 화면이 그릴 때 쿠키의 초대를 다시 확인한 결과(가입의 load-invitation.ts 와 같다). 서버 컴포넌트는 쿠키를 지울 수
 * 없어 끝난 초대의 쿠키는 그대로 두고(30분이면 사라진다) 안내만 한다.
 * - none: 쿠키가 없다. not-mine: 로그인한 채 연 링크의 초대가 이 계정의 번호로 온 것이 아니다.
 * - failed: 확인하지 못했다(연결 실패 · 5xx · 요청 제한) — 다시 시도.
 */
export type LoadedMyInvitation =
  | { kind: "ready"; invitation: Schemas["InvitationCheckResponseDto"] }
  | { kind: "none" }
  | { kind: "ended" | "joined" | "not-mine" }
  | { kind: "locked"; lock: AttemptLock }
  | { kind: "failed"; message: string };

export async function loadMyInvitation(): Promise<LoadedMyInvitation> {
  const lookup = await readMyInvitation();
  if (!lookup) return { kind: "none" };
  try {
    return { kind: "ready", invitation: await checkMyInvitation(lookup, clientIpFrom(await headers())) };
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      // 코드는 입력 때 맞았으니 그사이 재발송으로 바뀐 것이다 — 끝난 초대와 같은 안내.
      if (problem.kind === "not-found") return { kind: "token" in lookup ? "not-mine" : "ended" };
      if (problem.kind === "ended" || problem.kind === "joined") return { kind: problem.kind };
      if (problem.kind === "locked") return { kind: "locked", lock: problem.attemptLock };
      if (problem.kind === "rate-limited") return { kind: "failed", message: RATE_LIMITED };
      if (error.status < 500) logUnexpected("add-workplace", error);
      return { kind: "failed", message: "초대를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
    }
    if (error instanceof NetworkError) return { kind: "failed", message: CONNECTION_FAILED_MESSAGE };
    throw error;
  }
}
