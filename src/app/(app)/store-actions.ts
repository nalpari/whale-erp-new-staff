"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { CURRENT_STAFF_MEMBER_COOKIE, currentStaffMemberCookie } from "@/lib/current-store";
import { getMyMemberships } from "@/lib/my-profile";

/**
 * 앱 전역 현재 근무지 바꾸기(HOME-2 · WORK-4, 홈 선택기 · 근무 탭 근무지 카드). 내 소속인지 목록으로 확인한 뒤 쿠키에 두고 화면을 다시 받는다.
 * 목록을 못 받으면(5xx · 연결 실패) 바꾸지 않는다.
 */
export async function pickStoreAction(staffMemberId: number): Promise<{ error?: string }> {
  // 서버 액션은 누구나 직접 부를 수 있어 값을 다시 거른다.
  if (!Number.isSafeInteger(staffMemberId) || staffMemberId < 1) return { error: "잘못된 요청입니다" };
  const memberships = await getMyMemberships();
  if (!memberships) return { error: "근무지를 바꾸지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
  if (!memberships.items.some((m) => m.staffMemberId === staffMemberId)) {
    refresh();
    return { error: "이 근무지는 더 이상 고를 수 없습니다" };
  }
  (await cookies()).set(CURRENT_STAFF_MEMBER_COOKIE, String(staffMemberId), currentStaffMemberCookie());
  refresh();
  return {};
}
