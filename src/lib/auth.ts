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
