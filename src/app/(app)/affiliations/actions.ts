"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { RedirectType, redirect } from "next/navigation";
import { failureOf, logFailure, type Schemas } from "@/lib/api";
import { answerFailure, parseRejectReason, resultHref, type AnswerResult, type AnswerState } from "@/lib/affiliation-requests";
import { clientIpFrom } from "@/lib/client-ip";
import { authedRequest } from "@/lib/session";

// 소속 추가 확인 요청에 답하기(WHALEERP-144, api #164). 서버 화면이 invitationId 를 bind 해 넘긴다.
// 답했거나 더 답할 수 없으면 결과 경로(/affiliations/done)로 보낸다 — 액션 상태로만 그리면 액션 요청에서 proxy 가 토큰을 갱신해 쿠키를
// 쓸 때 Next 가 화면을 다시 그려(답한 요청이 목록에서 빠져) 결과가 사라진다. 다시 누를 수 있는 실패만 확인 화면에 상태로 남긴다.

/** 서버 액션은 누구나 직접 부를 수 있어 id 를 다시 거른다. */
const isInvitationId = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

async function answer(kind: "accept" | "reject", run: () => Promise<AnswerResult>): Promise<AnswerState> {
  let result: AnswerResult;
  try {
    result = await run();
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const handled = answerFailure(failure, kind);
    if (handled.log) logFailure(`affiliation:${kind}`, failure);
    if ("state" in handled) return handled.state;
    result = handled.result;
  }
  // 답한 요청이 남은 화면(확인 · 홈 팝업 · 내 정보 배지 · 소속 근무지 요청 줄)을 무효화한다 — 뒤로 가기로 캐시된 확인 화면이 버튼이 산 채
  // 돌아오지 않게. 결과 화면은 기록을 바꿔 넣어(replace) 뒤로 가기가 확인 화면에 들르지 않는다.
  for (const path of ["/affiliations", "/home", "/me", "/me/memberships"]) revalidatePath(path);
  // redirect 는 던져서 알리므로 try 밖에서 부른다.
  redirect(resultHref(result), RedirectType.replace);
}

/** 수락(`POST /me/affiliation-requests/:id/accept`). 본사 제공 동의는 켰을 때만 싣는다(가입과 같다). */
export async function acceptAffiliationAction(invitationId: number, _previous: AnswerState, formData: FormData): Promise<AnswerState> {
  if (!isInvitationId(invitationId)) return { error: "잘못된 요청입니다" };
  const json = formData.get("hqSharingConsented") === "on" ? { hqSharingConsented: true } : {};
  const clientIp = clientIpFrom(await headers());
  return answer("accept", async () => {
    const result = await authedRequest<Schemas["AcceptAffiliationResponseDto"]>(`/me/affiliation-requests/${invitationId}/accept`, {
      method: "POST",
      json,
      clientIp,
    });
    return { kind: "accepted", contractCount: result.contractIds.length };
  });
}

/** 거절(`POST /me/affiliation-requests/:id/reject`, 204). 사유는 선택이고, 함께 온 근로계약서는 서버가 같은 사유로 거부한다. */
export async function rejectAffiliationAction(invitationId: number, _previous: AnswerState, formData: FormData): Promise<AnswerState> {
  if (!isInvitationId(invitationId)) return { error: "잘못된 요청입니다" };
  const parsed = parseRejectReason(String(formData.get("reason") ?? ""));
  if (!parsed.ok) return { error: parsed.error };
  const json = parsed.reason === undefined ? {} : { reason: parsed.reason };
  const clientIp = clientIpFrom(await headers());
  return answer("reject", async () => {
    await authedRequest(`/me/affiliation-requests/${invitationId}/reject`, { method: "POST", json, clientIp });
    return { kind: "rejected" };
  });
}
