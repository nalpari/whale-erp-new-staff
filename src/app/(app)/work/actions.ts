"use server";

import { refresh } from "next/cache";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import { authedRequest } from "@/lib/session";
import { isTodoStatus, knownStatusError, type TodoStatus } from "@/lib/todos";

export interface TodoStatusResult {
  error?: string;
}

/** TO-DO 상태 바꾸기(근무 탭 목록 · 상세 시트 · 홈 카드). 성공하거나 목록이 낡았으면(409 · 404) 화면을 다시 받는다. */
export async function changeTodoStatusAction(todoId: number, status: TodoStatus): Promise<TodoStatusResult> {
  // 서버 액션은 누구나 직접 부를 수 있어 값을 다시 거른다.
  if (!Number.isSafeInteger(todoId) || todoId < 1 || !isTodoStatus(status)) return { error: "잘못된 요청입니다" };
  try {
    await authedRequest(`/me/todos/${todoId}/status`, { method: "PATCH", json: { status } });
  } catch (error) {
    if (error instanceof ApiError) {
      const known = knownStatusError(error.status, error.body);
      if (known) {
        refresh();
        return { error: known };
      }
      // 5xx 는 request() 가 남겼다.
      if (error.status < 500) logUnexpected("todo-status", error);
      return { error: "상태를 바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
    }
    if (error instanceof NetworkError) return { error: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
    // 401 의 만료 안내 redirect 도 여기로 지나간다.
    throw error;
  }
  refresh();
  return {};
}

