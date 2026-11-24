import type { ReactNode } from "react";
import { TopBar } from "@/components/common";
import { getCurrentMembership, hasRetiredMembership } from "@/lib/current-membership";
import { getUnreadNotificationCount } from "@/lib/my-notifications";
import { NotificationBell } from "./notification-bell";
import { StoreTopBar } from "./home/store-top-bar";

/**
 * 하단 메뉴 탭 화면(홈 · 근무 · 출퇴근) 맨 위 머리줄 — 홈은 로고 · 근무지 · 종, 탭은 제목 · 종 / 근무지 줄(누르면 근무지 시트).
 * 근무지는 앱 전체가 함께 쓰는 값이라 화면마다 근무지 상자를 따로 두지 않고 이 머리줄 한 곳에서 보이고 바꾼다(2026-11-24 사용자 지정).
 * 소속 목록을 못 받으면 근무지 줄만 감추고 제목 · 종은 둔다 — 화면 나머지는 그대로 보인다.
 */
export async function StoreHeader({
  title,
  backHref,
  action,
  pickable = true,
}: { title?: string; backHref?: string; action?: ReactNode; /** false 면 근무지를 보이기만 한다 — 출퇴근 화면(ATT-07) */ pickable?: boolean } = {}) {
  const [memberships, unread] = await Promise.all([getCurrentMembership(), getUnreadNotificationCount()]);
  const current = memberships?.current;
  // 퇴직한 소속이 있을 때만 「근무 종료」 — 가입 직후 · 계약 전은 「연결된 근무지 없음」. 퇴직 포함 목록을 못 받으면 중립 표시
  const retired = !!memberships && !current && (await hasRetiredMembership());
  return memberships ? (
    <StoreTopBar
      stores={memberships.items.map((m) => ({ staffMemberId: m.staffMemberId, storeName: m.store.storeName }))}
      currentId={current?.staffMemberId ?? null}
      hasNewAlarm={unread > 0}
      retired={retired}
      title={title}
      backHref={backHref}
      action={action}
      pickable={pickable}
    />
  ) : title ? (
    // 소속 목록을 못 받으면 근무지 줄 없이 제목 · 종만(종은 근무지와 상관없다)
    <TopBar title={title} backHref={backHref} action={action} alarmHref="/notifications" hasNewAlarm={unread > 0} />
  ) : (
    <div className="flex justify-end">
      {/* 알림함은 화면 위쪽 종으로 들어간다(NOTI-5) */}
      <NotificationBell />
    </div>
  );
}
