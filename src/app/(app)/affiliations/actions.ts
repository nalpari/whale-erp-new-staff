"use server";

import { headers } from "next/headers";
import { failureOf, logFailure, type Schemas } from "@/lib/api";
import { answerFailure, parseRejectReason, type AnswerState } from "@/lib/affiliation-requests";
import { clientIpFrom } from "@/lib/client-ip";
import { authedRequest } from "@/lib/session";

// 소속 추가 확인 요청에 답하기(WHALEERP-144, api #164). 화면이 invitationId 를 bind 해 부른다.
// 답한 뒤 화면을 다시 받지(refresh) 않는다 — 다시 받으면 답한 요청이 목록에서 빠져 완료 화면이 사라진다. 완료 화면은 액션 상태로 그린다.

/** 서버 액션은 누구나 직접 부를 수 있어 id 를 다시 거른다. */
const isInvitationId = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

async function answer(kind: "accept" | "reject", run: () => Promise<AnswerState>): Promise<AnswerState> {
  try {
    return await run();
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const { state, log } = answerFailure(failure, kind);
    if (log) logFailure(`affiliation:${kind}`, failure);
    return state;
  }
}

/** 수락(`POST /me/affiliation-requests/:id/accept`). 본사 제공 동의는 켰을 때만 싣는다(가입과 같다). */
export async function acceptAffiliationAction(invitationId: number, _previous: AnswerState, formData: FormData): Promise<AnswerState> {
  if (!isInvitationId(invitationId)) return { step: "input", error: "잘못된 요청입니다" };
  const json = formData.get("hqSharingConsented") === "on" ? { hqSharingConsented: true } : {};
  const clientIp = clientIpFrom(await headers());
  return answer("accept", async () => {
    const result = await authedRequest<Schemas["AcceptAffiliationResponseDto"]>(`/me/affiliation-requests/${invitationId}/accept`, {
      method: "POST",
      json,
      clientIp,
    });
    return { step: "accepted", storeName: result.storeName, contractCount: result.contractIds.length };
  });
}

/** 거절(`POST /me/affiliation-requests/:id/reject`, 204). 사유는 선택이고, 함께 온 근로계약서는 서버가 같은 사유로 거부한다. */
export async function rejectAffiliationAction(invitationId: number, _previous: AnswerState, formData: FormData): Promise<AnswerState> {
  if (!isInvitationId(invitationId)) return { step: "input", error: "잘못된 요청입니다" };
  const parsed = parseRejectReason(String(formData.get("reason") ?? ""));
  if (!parsed.ok) return { step: "input", error: parsed.error };
  const json = parsed.reason === undefined ? {} : { reason: parsed.reason };
  const clientIp = clientIpFrom(await headers());
  return answer("reject", async () => {
    await authedRequest(`/me/affiliation-requests/${invitationId}/reject`, { method: "POST", json, clientIp });
    return { step: "rejected" };
  });
}
