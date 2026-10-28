import type { Metadata } from "next";
import { Suspense } from "react";
import { BottomNav } from "@/components/common";
import { popupSummary } from "@/lib/affiliation-requests";
import { ApiError, NetworkError } from "@/lib/api";
import { getContracts } from "@/lib/contracts";
import { getCurrentMembership } from "@/lib/current-membership";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getMyNotifications } from "@/lib/my-notifications";
import { getMyAffiliationRequests } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { signRequestOf } from "@/lib/sign-request";
import { NotificationBell } from "../notification-bell";
import { AffiliationPopup } from "./affiliation-popup";
import { MyWorkInfo } from "./my-work-info";
import { ScheduleCards, ScheduleCardsSkeleton } from "./schedule-cards";
import { SignRequestPopup } from "./sign-request-popup";
import { StoreTopBar } from "./store-top-bar";
import { TodoCard, TodoCardSkeleton } from "./todo-card";

export const metadata: Metadata = { title: "홈 · Whale ERP" };

// 임시 홈 — 로그인 뒤 갈 곳. 실제 홈(WHALEERP-311 개인 근무 대시보드 · 313 앱 홈 카드)은
// 다른 작업자가 이 파일을 바꿔 채운다. 로그아웃은 내 정보 화면(/me) 맨 아래로 옮겼다(WHALEERP-193).
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
      {/* 서명 요청(WHALEERP-148) · 소속 추가 요청(WHALEERP-144)은 팝업으로만 알린다. 따로 받아 api 가 느려도 홈을 먼저 보인다. */}
      <Suspense>
        <HomeRequests />
      </Suspense>
    </div>
  );
}

/**
 * 홈 위 팝업 — 서명 요청(148)과 소속 추가 요청(144). 둘 다 있으면 한 번에 하나만, 서명 요청을 먼저 띄우고 그것을 닫으면 소속 추가
 * 요청이 뜬다. 근거: 서명 대기 계약은 기한(발송 + 30일)이 지나면 만료되고 서명해야 근무가 시작되는(데모 sign-req 문구) 지금 근무지의
 * 일이고, 소속 추가 요청은 새 근무지를 더할지 묻는 것이며 수락해도 그 뒤 계약 서명이 따로 온다(가입 · 진입 가이드 JOIN-7 의 흐름이
 * 가입 → 서명 요청 팝업). 데모 · 기획 문서에 둘이 함께일 때의 순서는 없다. 어느 쪽이든 못 받으면 그 팝업만 없이 홈 그대로다.
 */
async function HomeRequests() {
  const [contracts, affiliationRequests, employmentTypes] = await Promise.all([
    getContractsOrNull(),
    getMyAffiliationRequests(),
    getEnumOrEmpty("EmploymentType"),
  ]);
  const sign = contracts && signRequestOf(contracts, new Date());
  const summary = popupSummary(affiliationRequests ?? []);
  return (
    <>
      {sign && (
        <SignRequestPopup
          requestKey={sign.key}
          href={sign.href}
          rows={[
            { label: "근무지", value: sign.contract.storeName },
            ...(sign.contract.employmentType ? [{ label: "고용 형태", value: labelOf(employmentTypes, sign.contract.employmentType) }] : []),
            ...(sign.deadline ? [{ label: "서명 기한", value: sign.deadline }] : []),
          ]}
        />
      )}
      {summary && <AffiliationPopup requestKey={summary.key} rows={summary.rows} signRequestKey={sign?.key ?? null} />}
    </>
  );
}

/** 내 근로계약 목록 — 팝업 곁들임이라 api 실패(4xx · 5xx · 연결 실패)는 null 로 받아 팝업 없이 홈을 그대로 보인다(401 은 만료 안내로). */
async function getContractsOrNull() {
  try {
    return await getContracts();
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) return null;
    throw error;
  }
}
