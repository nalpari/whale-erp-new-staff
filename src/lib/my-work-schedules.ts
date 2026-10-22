import { ApiError, NetworkError, type Schemas } from "./api";
import { authedRequest } from "./session";

/**
 * 내 소속 하나의 한 달 근무스케줄(`GET /me/work-schedules`, #205). api 가 잠시 실패하면(5xx · 연결 실패) null 을 주어
 * 그 탭만 「불러오지 못했다」로 보인다. 404 도 null 이다 — 소속 목록을 받은 뒤 그사이 퇴직 처리된 경우라 다시 열면 맞는다.
 * 그 밖(400 등 결함)은 던진다.
 */
export async function getMyWorkSchedules(staffMemberId: number, month: string): Promise<Schemas["MyWorkScheduleListResponseDto"] | null> {
  try {
    return await authedRequest<Schemas["MyWorkScheduleListResponseDto"]>(`/me/work-schedules?staffMemberId=${staffMemberId}&month=${month}`);
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && (error.status >= 500 || error.status === 404))) return null;
    throw error;
  }
}
