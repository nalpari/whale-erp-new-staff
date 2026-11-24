import { getCurrentMembership } from "@/lib/current-membership";
import { getMyNotifications } from "@/lib/my-notifications";
import { getMyMemberships } from "@/lib/my-profile";
import { NotificationBell } from "./notification-bell";
import { StoreTopBar } from "./home/store-top-bar";

/**
 * 하단 메뉴 탭 화면(홈 · 근무 · 출퇴근) 맨 위 머리줄 — 로고 · 지금 근무지(누르면 근무지 시트) · 알림 종.
 * 근무지는 앱 전체가 함께 쓰는 값이라 화면마다 근무지 상자를 따로 두지 않고 이 머리줄 한 곳에서 보이고 바꾼다(2026-11-24 사용자 지정).
 * 소속 목록을 못 받으면 선택기만 감추고 종만 둔다 — 화면 나머지는 그대로 보인다.
 */
export async function StoreHeader() {
  const [memberships, notifications] = await Promise.all([getCurrentMembership(), getMyNotifications("pageSize=1")]);
  const current = memberships?.current;
  // 퇴직한 소속이 있을 때만 「근무 종료」 — 가입 직후 · 계약 전은 「연결된 근무지 없음」. 퇴직 포함 목록을 못 받으면 중립 표시
  const retired = !!memberships && !current && ((await getMyMemberships(true))?.items.some((m) => m.retiredDate !== null) ?? false);
  return memberships ? (
    <StoreTopBar
      stores={memberships.items.map((m) => ({ staffMemberId: m.staffMemberId, storeName: m.store.storeName }))}
      currentId={current?.staffMemberId ?? null}
      hasNewAlarm={(notifications?.unreadCount ?? 0) > 0}
      retired={retired}
    />
  ) : (
    <div className="flex justify-end">
      {/* 알림함은 화면 위쪽 종으로 들어간다(NOTI-5) */}
      <NotificationBell />
    </div>
  );
}
