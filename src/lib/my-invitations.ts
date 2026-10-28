import type { Schemas } from "./api";
import type { ClientIp } from "./client-ip";
import type { MyInvitationLookup } from "./join";
import { authedRequest } from "./session";

// 로그인한 뒤 다른 근무지의 초대로 그 근무지를 더한다(WHALEERP-604, api 603). 휴대전화번호는 보내지 않는다 — api 가 계정의
// 번호로 찾는다. 오류는 가입의 초대 확인과 같은 code 다(invitationProblemOf): 404 INVITATION_NOT_FOUND(코드가 틀림 · 링크의 초대
// 번호가 계정 번호와 다름) · INVITATION_ENDED, 409 INVITATION_ALREADY_JOINED, 429 INVITATION_CODE_LOCKED(계정 번호로 5번 틀려 30분).

/** 초대 확인 — 근무지 · 고용 형태 · 기한, 본사 제공 동의를 물을지. */
export function checkMyInvitation(lookup: MyInvitationLookup, clientIp: ClientIp | undefined) {
  return authedRequest<Schemas["InvitationCheckResponseDto"]>("/me/invitations/check", { method: "POST", json: lookup, clientIp });
}

/** 근무지 더하기 — 초대를 다시 확인하고 그 근무지의 직원 레코드를 이 계정에 잇는다. 가입을 기다리던 근로계약서는 서명 대기가 된다. */
export function acceptMyInvitation(body: Schemas["AcceptMyInvitationDto"], clientIp: ClientIp | undefined) {
  return authedRequest<Schemas["AcceptMyInvitationResponseDto"]>("/me/invitations/accept", { method: "POST", json: body, clientIp });
}
