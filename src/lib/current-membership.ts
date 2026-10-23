import { cookies } from "next/headers";
import { cache } from "react";
import { CURRENT_STAFF_MEMBER_COOKIE, pickCurrentMembership } from "./current-store";
import { getMyMemberships } from "./my-profile";

/**
 * 앱 전역 현재 근무지(HOME-2 · WORK-4) — 내 소속 목록과 쿠키 `current_staff_member` 를 함께 읽는다. 한 요청에 한 번만 받는다.
 * 목록을 못 받으면(5xx · 연결 실패) null, 소속이 없으면 `current: null`.
 */
export const getCurrentMembership = cache(async () => {
  const memberships = await getMyMemberships();
  if (!memberships) return null;
  return { items: memberships.items, current: pickCurrentMembership(memberships.items, (await cookies()).get(CURRENT_STAFF_MEMBER_COOKIE)?.value) };
});
