import { headers } from "next/headers";
import { RATE_LIMITED } from "@/lib/action-errors";
import { ApiError, NetworkError, logUnexpected, type Schemas } from "@/lib/api";
import type { AttemptLock } from "@/lib/attempt-lock";
import { checkInvitation } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { readInvitation } from "@/lib/invitation-cookie";
import { invitationProblemOf } from "@/lib/join";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";
import type { InvitationEnd } from "./actions";
import type { JoinVia } from "./screens";

/**
 * 초대 확인 · 계정 등록 화면이 그릴 때 쿠키의 초대를 다시 확인한 결과. 쿠키는 확인을 마친 값이지만 그사이 끝났을 수 있다(재발송 ·
 * 기한 · 다른 기기에서 가입). 서버 컴포넌트는 쿠키를 지울 수 없어 끝난 초대의 쿠키는 그대로 두고(30분이면 사라진다) 안내만 한다.
 * - none: 쿠키가 없다(바로 들어왔거나 30분이 지남).
 * - ended: 끝난 초대. 번호 + 코드가 그사이 맞지 않게 됐어도(재발송으로 코드가 바뀜) 같은 안내다.
 * - failed: 확인하지 못했다(연결 실패 · 5xx · 요청 제한) — 다시 시도.
 */
export type LoadedInvitation =
  | { kind: "ready"; via: JoinVia; invitation: Schemas["InvitationCheckResponseDto"] }
  | { kind: "none" }
  | { kind: InvitationEnd }
  | { kind: "locked"; lock: AttemptLock }
  | { kind: "failed"; message: string };

export async function loadInvitation(): Promise<LoadedInvitation> {
  const lookup = await readInvitation();
  if (!lookup) return { kind: "none" };
  try {
    const invitation = await checkInvitation(lookup, clientIpFrom(await headers()));
    return { kind: "ready", via: "token" in lookup ? "link" : "code", invitation };
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      if (problem.kind === "not-found" || problem.kind === "ended") return { kind: "ended" };
      if (problem.kind === "joined" || problem.kind === "has-account") return { kind: problem.kind };
      if (problem.kind === "locked") return { kind: "locked", lock: problem.attemptLock };
      if (problem.kind === "rate-limited") return { kind: "failed", message: RATE_LIMITED };
      // 5xx 는 request() 가 남겼다. 쿠키의 값은 모양을 거른 것이라 4xx 는 api 계약이 어긋난 것이다.
      if (error.status < 500) logUnexpected("join", error);
      return { kind: "failed", message: "초대를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
    }
    if (error instanceof NetworkError) return { kind: "failed", message: CONNECTION_FAILED_MESSAGE };
    throw error;
  }
}
