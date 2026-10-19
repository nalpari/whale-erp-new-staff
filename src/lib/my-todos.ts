import { ApiError, NetworkError, type Schemas } from "./api";
import { authedRequest } from "./session";

/**
 * 내 TO-DO(`GET /me/todos`) — 근무 탭과 홈 카드가 같이 쓴다. api 가 잠시 실패하면(5xx · 연결 실패) null 을 주어
 * 그 칸만 「불러오지 못했다」로 보이고 화면 전체를 오류로 만들지 않는다. 그 밖(4xx 등 결함)은 던진다.
 */
export async function getMyTodos(query: string): Promise<Schemas["TodoItemListResponseDto"] | null> {
  try {
    return await authedRequest<Schemas["TodoItemListResponseDto"]>(`/me/todos?${query}`);
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return null;
    throw error;
  }
}
