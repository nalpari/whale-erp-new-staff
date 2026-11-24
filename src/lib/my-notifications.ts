import { cache } from "react";
import { requestsLoadFailure } from "./affiliation-requests";
import { ApiError, NetworkError, failureOf, logFailure, type Schemas } from "./api";
import { authedRequest } from "./session";

/** 5xx · 연결 실패만 null — 그 칸만 「불러오지 못했다」로 보인다. 그 밖(4xx 등 결함)은 던진다. */
async function orNull<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return null;
    throw error;
  }
}

/** 내 알림함(`GET /me/notifications`, #265) — 받은 지 14일 안, 모든 근무지, 새것부터. 종 배지는 pageSize=1 로 미확인 건수만 본다 */
export const getMyNotifications = (query: string) =>
  orNull(() => authedRequest<Schemas["MyNotificationListResponseDto"]>(`/me/notifications?${query}`));

/**
 * 머리줄 종의 미확인 건수 — 한 요청에 한 번만 받는다. 종 점 하나 때문에 화면이 오류가 되지 않게, 예상 밖 4xx 도 남기고 0 으로 둔다
 * (만료 이동 같은 api 밖 오류는 다시 던진다 — 홈 팝업 조회와 같은 규칙).
 */
export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  try {
    return (await getMyNotifications("pageSize=1"))?.unreadCount ?? 0;
  } catch (error) {
    const failure = failureOf(error);
    const handling = requestsLoadFailure(failure);
    if (handling === "throw") throw error;
    if (handling === "log" && failure) logFailure("notifications-badge", failure);
    return 0;
  }
});

/** 알림 수신 설정(`GET /me/notification-preferences`, #268) — 네 묶음, 바꾼 적 없으면 켜짐 */
export const getMyNotificationPreferences = () =>
  orNull(() => authedRequest<Schemas["MyNotificationPreferenceListResponseDto"]>("/me/notification-preferences"));
