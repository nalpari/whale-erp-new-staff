import { ApiError, NetworkError, logUnexpected, type Schemas } from "./api";
import type { ClientIp } from "./client-ip";
import { authedRequest } from "./session";

// 가입한 직원에게 온 다른 근무지의 가입 초대(WHALEERP-604, api 603). 초대 코드는 받지 않는다 — api 가 계정의 휴대전화번호로 온
// 살아 있는 초대를 보낸 때 최신순으로 준다. 수락 실패는 가입의 초대 확인과 같은 code 다(invitationProblemOf): 404
// INVITATION_NOT_FOUND(없는 초대 · 남의 번호로 온 초대) · INVITATION_ENDED, 409 INVITATION_ALREADY_JOINED, 429 요청 한도.

export type MyInvitation = Schemas["MyInvitationDto"];

/**
 * 받은 초대 목록. 실패하면 null — 소속 근무지에 덧붙인 칸이라, 이것 하나 때문에 소속 목록까지 오류 화면으로 넘기지 않는다(PR #40 리뷰).
 * 요청 한도(429) 같은 4xx 도 null 로 받고, 예상 밖 4xx 는 남긴다(5xx · 연결 실패는 request() 가 남겼다). 401 의 만료 안내 redirect 는 던진다.
 */
export async function getMyInvitations(): Promise<MyInvitation[] | null> {
  try {
    return (await authedRequest<Schemas["MyInvitationListResponseDto"]>("/me/invitations")).items;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status < 500 && error.status !== 429) logUnexpected("my-invitations", error);
      return null;
    }
    if (error instanceof NetworkError) return null;
    throw error;
  }
}

/** 근무지 더하기 — 그 초대의 직원 레코드를 이 계정에 잇는다. 가입을 기다리던 근로계약서는 서명 대기가 된다. */
export function acceptMyInvitation(invitationId: number, body: Schemas["AcceptMyInvitationDto"], clientIp: ClientIp | undefined) {
  return authedRequest<Schemas["AcceptMyInvitationResponseDto"]>(`/me/invitations/${invitationId}/accept`, {
    method: "POST",
    json: body,
    clientIp,
  });
}
