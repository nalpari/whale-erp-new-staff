"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, NetworkError, logUnexpected, type Schemas } from "@/lib/api";
import { CURRENT_STAFF_MEMBER_COOKIE, currentStaffMemberCookie } from "@/lib/current-store";
import { isPreferenceCategory, targetHref, type PreferenceCategory } from "@/lib/notifications";
import { authedRequest } from "@/lib/session";

export interface NotificationActionResult {
  error?: string;
  /** 눌렀지만 열 곳이 없다 — 관련 업무가 지워졌거나 닿을 수 없다(「열 수 없습니다」) */
  unavailable?: boolean;
}

const isId = (id: number) => Number.isSafeInteger(id) && id >= 1;

/** api 실패를 화면 문구로. 401 의 만료 안내 redirect 등 그 밖은 던진다 */
function failure(where: string, error: unknown, notFound: string): NotificationActionResult {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      refresh();
      return { error: notFound };
    }
    // 5xx 는 request() 가 남겼다.
    if (error.status < 500) logUnexpected(where, error);
    return { error: "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
  }
  if (error instanceof NetworkError) return { error: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
  throw error;
}

/**
 * 알림을 눌렀을 때(#267) — 읽음으로 바꾸고 관련 화면으로 간다. 그 업무가 속한 소속을 앱 전역 근무지로 맞춘 뒤 연다(WORK-4).
 * 열 곳이 없으면 읽음만 바꾸고 「열 수 없습니다」를 알린다. 읽음 바꾸기에 실패하면 이동하지 않는다.
 */
export async function openNotificationAction(id: number): Promise<NotificationActionResult> {
  // 서버 액션은 누구나 직접 부를 수 있어 값을 다시 거른다.
  if (!isId(id)) return { error: "잘못된 요청입니다" };
  let item: Schemas["MyNotificationItemDto"];
  try {
    item = await authedRequest<Schemas["MyNotificationItemDto"]>(`/me/notifications/${id}/read`, { method: "POST" });
  } catch (error) {
    return failure("notification-open", error, "이 알림은 더 이상 볼 수 없습니다");
  }
  const href = targetHref(item.target);
  if (!href || !item.target) {
    refresh();
    return { unavailable: true };
  }
  (await cookies()).set(CURRENT_STAFF_MEMBER_COOKIE, String(item.target.staffMemberId), currentStaffMemberCookie());
  redirect(href);
}

/** 한 줄 읽음 · 안 읽음(NOTI-7). 실패하면 이전 상태 그대로 두고 문구를 준다 */
export async function markNotificationAction(id: number, isRead: boolean): Promise<NotificationActionResult> {
  if (!isId(id) || typeof isRead !== "boolean") return { error: "잘못된 요청입니다" };
  try {
    await authedRequest(`/me/notifications/${id}/${isRead ? "read" : "unread"}`, { method: "POST" });
  } catch (error) {
    return failure("notification-mark", error, "이 알림은 더 이상 볼 수 없습니다");
  }
  refresh();
  return {};
}

/** 모두 읽음(NOTI-7) */
export async function readAllNotificationsAction(): Promise<NotificationActionResult> {
  try {
    await authedRequest("/me/notifications/read-all", { method: "POST" });
  } catch (error) {
    return failure("notification-read-all", error, "알림을 찾을 수 없습니다");
  }
  refresh();
  return {};
}

/** 수신 설정 묶음 하나 켜고 끄기(#269). 그 뒤에 생기는 알림부터 든다 */
export async function setPreferenceAction(category: PreferenceCategory, isEnabled: boolean): Promise<NotificationActionResult> {
  if (!isPreferenceCategory(category) || typeof isEnabled !== "boolean") return { error: "잘못된 요청입니다" };
  try {
    await authedRequest(`/me/notification-preferences/${category}`, { method: "PUT", json: { isEnabled } });
  } catch (error) {
    return failure("notification-preference", error, "설정을 찾을 수 없습니다");
  }
  refresh();
  return {};
}
