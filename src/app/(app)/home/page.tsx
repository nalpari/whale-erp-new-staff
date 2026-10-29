import type { Metadata } from "next";
import { Suspense } from "react";
import { BottomNav } from "@/components/common";
import { popupSummary } from "@/lib/affiliation-requests";
import { getCurrentMembership } from "@/lib/current-membership";
import { getMyNotifications } from "@/lib/my-notifications";
import { getMyAffiliationRequests } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { NotificationBell } from "../notification-bell";
import { AffiliationPopup } from "./affiliation-popup";
import { MyWorkInfo } from "./my-work-info";
import { ScheduleCards, ScheduleCardsSkeleton } from "./schedule-cards";
import { StoreTopBar } from "./store-top-bar";
import { TodoCard, TodoCardSkeleton } from "./todo-card";

export const metadata: Metadata = { title: "홈 · Whale ERP" };

// 직원 근무 앱 홈(WHALEERP-311 · 313, 목업 home.html HOME-1 · 2 · 3 · 5). 머리줄(근무지 선택기 · 알림) → 오늘 근무(출퇴근 시작) ·
// 이번 주 근무 → TO-DO → 나의 근무 정보. 영역마다 따로 받아 하나가 늦거나 실패해도 나머지는 보인다. 로그아웃은 내 정보(/me) 맨 아래(WHALEERP-193).
export default async function HomePage() {
  const { account } = await requireSession();
  // 머리줄의 근무지 · 새 알림 점(HOME-2). 소속 목록을 못 받으면 선택기만 감추고 종만 둔다 — 홈 나머지는 그대로 보인다.
  const [memberships, notifications] = await Promise.all([getCurrentMembership(), getMyNotifications("pageSize=1")]);
  const current = memberships?.current;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[52px] pb-[24px] leading-[1.5]">
        {memberships ? (
          <StoreTopBar
            stores={memberships.items.map((m) => ({ staffMemberId: m.staffMemberId, storeName: m.store.storeName }))}
            currentId={current?.staffMemberId ?? null}
            hasNewAlarm={(notifications?.unreadCount ?? 0) > 0}
          />
        ) : (
          <div className="flex justify-end">
            {/* 알림함은 화면 위쪽 종으로 들어간다(NOTI-5) */}
            <NotificationBell />
          </div>
        )}
        <h1 className="text-[26px] font-bold">{account.realName}님</h1>
        {/* 오늘 · 이번 주 근무를 먼저(HOME-1). 카드마다 따로 받아 받는 동안 그 자리에 스켈레톤을 보인다. */}
        {current && (
          <Suspense fallback={<ScheduleCardsSkeleton />}>
            <ScheduleCards staffMemberId={current.staffMemberId} />
          </Suspense>
        )}
        {/* 고른 근무지의 TO-DO 만. 소속 목록을 못 받았으면 모든 근무지, 근무지가 없으면 카드를 두지 않는다. */}
        {current !== null && (
          <Suspense fallback={<TodoCardSkeleton />}>
            <TodoCard storeId={current?.store.storeId} />
          </Suspense>
        )}
        {/* 나의 근무 정보 바로가기(데모). 급여명세서는 근무지가 없어도 보인다(HOME-5). 받는 동안은 비워 둔다. */}
        <Suspense>
          <MyWorkInfo staffMemberId={current?.staffMemberId} />
        </Suspense>
      </div>
      {/* 로그아웃이 내 정보로 옮겨 가 홈에서도 하단 메뉴로 내 정보에 간다. */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/" />
      </div>
      {/* 소속 추가 요청(WHALEERP-144)은 팝업으로만 알린다. 따로 받아 api 가 느려도 홈을 먼저 보인다. */}
      <Suspense>
        <AffiliationRequests />
      </Suspense>
    </div>
  );
}

/** 소속 추가 요청 팝업. 못 받으면 팝업 없이 홈을 그대로 보인다. */
async function AffiliationRequests() {
  const summary = popupSummary((await getMyAffiliationRequests()) ?? []);
  return summary && <AffiliationPopup requestKey={summary.key} rows={summary.rows} />;
}
