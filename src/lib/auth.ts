import { request, type Schemas } from "./api";

// 직원 계정(3팀 accounts) 인증 API. 상태 코드와 메시지의 뜻은 api 의 openapi.json 설명을 따른다.

export function login(body: Schemas["LoginDto"]) {
  return request<Schemas["LoginResponseDto"]>("/auth/account/login", { method: "POST", json: body });
}

/** 갱신 토큰은 회전하지 않는다 — 응답에 새 갱신 토큰이 없고, 쓰던 것을 계속 쓴다. 401 이면 접속이 끝났다. */
export function refreshAccessToken(refreshToken: string) {
  return request<Schemas["RefreshResponseDto"]>("/auth/account/refresh", {
    method: "POST",
    json: { refreshToken },
  });
}

/** 이 기기의 접속만 끝낸다. 204. */
export function logout(accessToken: string) {
  return request<void>("/auth/account/logout", { method: "POST", accessToken });
}

/** 계정이 없어도 · 1분 안에 다시 불러도 · 하루 10번을 넘어도 204 다(가입 여부를 드러내지 않는다). 503 은 발송기가 없는 환경. */
export function requestPasswordResetPin(email: string) {
  return request<void>("/auth/account/password-reset-pins", { method: "POST", json: { email } });
}

/** 204 면 맞다. 틀림 · 만료 · 5회로 닫힘 · 없음은 모두 같은 401. */
export function verifyPasswordResetPin(body: Schemas["VerifyPasswordResetPinDto"]) {
  return request<void>("/auth/account/password-reset-pins/verify", { method: "POST", json: body });
}

/** 204 면 바꾸고 모든 기기 접속을 끊는다. 400 은 규칙 위반(핀은 그대로), 401 은 핀이 틀렸거나 닫혔다. */
export function resetPassword(body: Schemas["ResetPasswordDto"]) {
  return request<void>("/auth/account/password-reset", { method: "POST", json: body });
}
