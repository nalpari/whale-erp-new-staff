// 앱 전역 현재 근무지(WORK-4 · HOME-2, 2026-10-22 재영). 고른 소속(직원 레코드)의 staffMemberId 를 쿠키에 둔다.
// 홈 · 근무 · 출퇴근 화면이 같은 값을 읽는다. node --test 가 직접 읽으므로 next/headers 는 가져오지 않는다.

/** 고른 소속의 staffMemberId. 로그아웃해도 남긴다 — 다음에 읽을 때 내 소속이 아니면 무시한다 */
export const CURRENT_STAFF_MEMBER_COOKIE = "current_staff_member";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export const currentStaffMemberCookie = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
});

/**
 * 내 소속 근무지 목록(`GET /me/memberships`)에서 지금 근무지를 고른다. 쿠키 값과 같은 소속이 없으면(처음 · 퇴직 · 망가진 값)
 * 첫 소속, 소속이 없으면 null.
 */
export function pickCurrentMembership<T extends { staffMemberId: number }>(items: readonly T[], raw: string | undefined): T | null {
  const id = raw && /^[1-9][0-9]*$/.test(raw) ? Number(raw) : null;
  return items.find((m) => m.staffMemberId === id) ?? items[0] ?? null;
}
