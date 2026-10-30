import { request, type Schemas } from "./api";
import type { ClientIp } from "./client-ip";

// 직원 계정 인증 API. 상태 코드와 메시지의 뜻은 api 의 openapi.json 설명을 따른다.
// clientIp 는 직원의 실제 접속 IP(client-ip.ts의 ClientIp) — api 가 로그인 · 갱신 · 비밀번호 재설정의 요청 제한을 IP 로도
// 세므로 넘긴다(로그아웃은 api 가 IP 로 세지 않지만 모양을 맞춰 같이 넘긴다).

export function login(body: Schemas["LoginDto"], clientIp: ClientIp | undefined) {
  return request<Schemas["LoginResponseDto"]>("/auth/account/login", { method: "POST", json: body, clientIp });
}

/**
 * 갱신 토큰은 회전하지 않는다 — 응답에 새 갱신 토큰이 없고, 쓰던 것을 계속 쓴다. 401 이면 접속이 끝났다.
 * proxy 는 액세스 토큰 쿠키가 없는 화면 요청에서 응답 전에 이것을 기다리므로 timeoutMs 를 짧게 준다.
 */
export function refreshAccessToken(refreshToken: string, { clientIp, timeoutMs }: { clientIp: ClientIp | undefined; timeoutMs?: number }) {
  return request<Schemas["RefreshResponseDto"]>("/auth/account/refresh", {
    method: "POST",
    json: { refreshToken },
    clientIp,
    timeoutMs,
  });
}

/** 이 기기의 접속만 끝낸다. 204. */
export function logout(accessToken: string, clientIp: ClientIp | undefined) {
  return request<void>("/auth/account/logout", { method: "POST", accessToken, clientIp });
}

/** 계정이 없어도 · 1분 안에 다시 불러도 · 하루 10번을 넘어도 204 다(가입 여부를 드러내지 않는다). 503 은 발송기가 없는 환경. */
export function requestPasswordResetPin(email: string, clientIp: ClientIp | undefined) {
  return request<void>("/auth/account/password-reset-pins", { method: "POST", json: { email }, clientIp });
}

/** 204 면 맞다. 틀림 · 만료 · 5회로 닫힘 · 없음은 모두 같은 401. */
export function verifyPasswordResetPin(body: Schemas["VerifyPasswordResetPinDto"], clientIp: ClientIp | undefined) {
  return request<void>("/auth/account/password-reset-pins/verify", { method: "POST", json: body, clientIp });
}

/** 204 면 바꾸고 모든 기기 접속을 끊는다. 400 은 규칙 위반(핀은 그대로), 401 은 틀림 · 만료 · 5회로 닫힘 · 이미 씀(api 가 가르지 않음). */
export function resetPassword(body: Schemas["ResetPasswordDto"], clientIp: ClientIp | undefined) {
  return request<void>("/auth/account/password-reset", { method: "POST", json: body, clientIp });
}

/** 관리자가 보낸 재설정 링크를 쓸 수 있으면 204. 없음 · 만료 · 사용 · 대체 · 탈퇴는 모두 같은 401, 토큰이 비었거나 200자를 넘으면 400. 링크를 소진하지 않는다. */
export function verifyPasswordResetLink(body: Schemas["VerifyPasswordResetLinkDto"], clientIp: ClientIp | undefined) {
  return request<void>("/auth/account/password-reset-links/verify", { method: "POST", json: body, clientIp });
}

/**
 * 링크로 새 비밀번호를 정한다. 204 면 남은 링크 · 핀을 닫고 모든 기기 접속을 끊고 잠금을 푼다. 400 은 규칙 위반(링크는 그대로),
 * 401 은 쓸 수 없는 링크.
 */
export function resetPasswordWithLink(body: Schemas["ResetPasswordWithLinkDto"], clientIp: ClientIp | undefined) {
  return request<void>("/auth/account/password-reset-links/reset", { method: "POST", json: body, clientIp });
}

/**
 * 이름 · 휴대전화번호 · 생년월일로 로그인 이메일을 찾는다. 200 이면 가린 이메일 목록(탈퇴 계정 제외). 맞는 계정이 없으면 어느 값이
 * 틀렸든 404. 같은 번호로 5번 틀리면 5분 막혀 429 와 본문 lockExpiresAt(요청 제한의 429 에는 없음). 찾은 이메일을 보내지는 않는다.
 */
export function findEmails(body: Schemas["EmailFindDto"], clientIp: ClientIp | undefined) {
  return request<Schemas["EmailFindResponseDto"]>("/auth/account/email-find-attempts", { method: "POST", json: body, clientIp });
}

/**
 * 초대 확인(WHALEERP-141). 링크의 토큰, 또는 번호 + 초대 코드 가운데 하나로 살아 있는 가입 초대를 찾는다. 오류는 본문의 code 로
 * 가른다(join.ts invitationProblemOf) — 404 틀림 · 끝남, 409 가입 마침 · 계정 있음, 같은 번호로 5번 틀리면 30분 잠겨 429 와 lockExpiresAt.
 */
export function checkInvitation(body: Schemas["InvitationLookupDto"], clientIp: ClientIp | undefined) {
  return request<Schemas["InvitationCheckResponseDto"]>("/auth/account/invitations/check", { method: "POST", json: body, clientIp });
}

/**
 * 가입(WHALEERP-142). 초대를 다시 확인하고 계정을 만들어 로그인 응답과 같은 모양을 준다. 계정 번호는 초대의 번호다(보내지 않는다).
 * 초대 확인의 오류에 더해 400 만 19세 미만(SIGNUP_UNDER_AGE, 초대는 가입 불가가 됨) · 생년월일이 오늘 뒤 · 비밀번호 규칙, 409 이미 쓰는 이메일.
 * 응답의 hqSharingConsentRecorded 가 false 면 가입은 마쳤지만 사업자 제공 동의를 남기지 못했다(본 문구 버전이 달라, ATT-30 v253).
 */
export function signup(body: Schemas["StaffSignupDto"], clientIp: ClientIp | undefined) {
  return request<Schemas["StaffSignupResponseDto"]>("/auth/account/signup", { method: "POST", json: body, clientIp });
}
