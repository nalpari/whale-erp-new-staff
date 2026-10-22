import { ApiError, NetworkError, type Schemas } from "./api";
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

/** 알림 수신 설정(`GET /me/notification-preferences`, #268) — 네 묶음, 바꾼 적 없으면 켜짐 */
export const getMyNotificationPreferences = () =>
  orNull(() => authedRequest<Schemas["MyNotificationPreferenceListResponseDto"]>("/me/notification-preferences"));
