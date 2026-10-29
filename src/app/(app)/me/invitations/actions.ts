"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { RedirectType, notFound, redirect } from "next/navigation";
import { RATE_LIMITED } from "@/lib/action-errors";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import { saveJoinedStore } from "@/lib/invitation-cookie";
import { invitationProblemOf } from "@/lib/join";
import { acceptMyInvitation } from "@/lib/my-invitations";
import { parseStaffMemberId } from "@/lib/tax-profile";

/**
 * 받은 초대의 「근무지 추가」 결과(WHALEERP-604). 더하면 완료 화면(invitations/done)으로 가므로 상태로 돌아오지 않는다.
 * - ended: 쓸 수 없는 초대(끝남 · 없음 · 남의 번호 — api 가 가르지 않게 404 로 답한다). joined: 이미 더한 초대.
 */
export type AcceptState = { step: "input"; error?: string } | { step: "ended" | "joined" };

/** 근무지를 더했는지 모른다(5xx · 연결 실패 · 시간 초과). 다시 누르면 api 가 지금 상태로 답한다(더했으면 「이미 더한 초대」). */
const ACCEPT_UNKNOWN = "근무지를 더했는지 확인하지 못했습니다. 잠시 뒤 「근무지 추가」를 다시 누르면 결과를 알려 드립니다";

/** invitationId 는 화면이 bind 로 붙인 값이지만 누구나 직접 부를 수 있어 다시 거른다(내 초대인지는 api 가 본다). */
export async function acceptMyInvitationAction(
  rawInvitationId: string,
  _previous: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  // 주소의 id 와 같은 모양(양의 int4)이다 — 소속 id 거르기를 같이 쓴다.
  const invitationId = parseStaffMemberId(rawInvitationId);
  if (invitationId === null) notFound();
  let result;
  try {
    result = await acceptMyInvitation(
      invitationId,
      // 체크 칸은 api 가 물을 때(asksHqSharingConsent)만 그려진다. 묻지 않는 초대에 보내도 api 는 바꾸지 않는다.
      formData.get("hqSharingConsented") === "on" ? { hqSharingConsented: true } : {},
      clientIpFrom(await headers()),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      if (problem.kind === "not-found" || problem.kind === "ended") return { step: "ended" };
      if (problem.kind === "joined") return { step: "joined" };
      if (problem.kind === "rate-limited") return { step: "input", error: RATE_LIMITED };
      if (error.status < 500) logUnexpected("invitation-accept", error);
      return { step: "input", error: error.status >= 500 ? ACCEPT_UNKNOWN : "근무지를 더하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
    }
    if (error instanceof NetworkError) return { step: "input", error: ACCEPT_UNKNOWN };
    // 401 의 만료 안내 redirect 도 여기서 그대로 던진다.
    throw error;
  }
  await saveJoinedStore(result.storeName, "/me/invitations/done");
  // 더한 초대가 남은 화면(내 정보 「요청 N건」 · 소속 근무지 「확인을 기다리는 요청」)을 무효화한다 — 소속 추가 확인의 답하기와 같다.
  revalidatePath("/", "layout");
  // 확인 화면을 히스토리에 남기지 않는다. 뒤로 가면 다 쓴 초대를 다시 열게 된다. 점포 id 는 완료 화면의 「근로계약서 보기」가
  // 그 근무지 계약서만 열 때 쓴다 — 주소로 바꿔도 내 계약서 목록을 거르는 값일 뿐이라 쿠키에 두지 않는다.
  redirect(`/me/invitations/done?store=${result.storeId}`, RedirectType.replace);
}
