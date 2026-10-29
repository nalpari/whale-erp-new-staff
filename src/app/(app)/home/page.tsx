import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense, cache } from "react";
import { BottomNav } from "@/components/common";
import { popupSummary, requestsLoadFailure } from "@/lib/affiliation-requests";
import { ApiError, failureOf, logFailure, logUnexpected } from "@/lib/api";
import { getContracts } from "@/lib/contracts";
import { getCurrentMembership } from "@/lib/current-membership";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getMyNotifications } from "@/lib/my-notifications";
import { getMyAffiliationRequests } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { signRequestOf } from "@/lib/sign-request";
import { NotificationBell } from "../notification-bell";
import { HomePopups } from "./home-popups";
import { MyWorkInfo } from "./my-work-info";
import { ScheduleCards, ScheduleCardsSkeleton } from "./schedule-cards";
import { SignWaitingCards } from "./sign-waiting-cards";
import { StoreTopBar } from "./store-top-bar";
import { TodoCard, TodoCardSkeleton } from "./todo-card";

export const metadata: Metadata = { title: "홈 · Whale ERP" };

// 직원 근무 앱 홈(WHALEERP-311 · 313, 목업 home.html HOME-1 · 2 · 3 · 5). 머리줄(근무지 선택기 · 알림) → 오늘 근무(출퇴근 시작) ·
// 이번 주 근무 → 서명 대기 카드(146) → TO-DO → 나의 근무 정보. 영역마다 따로 받아 하나가 늦거나 실패해도 나머지는 보인다. 로그아웃은 내 정보(/me) 맨 아래(WHALEERP-193).
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
        {/* 서명을 기다리는 근로계약서(146). 팝업과 같은 계약 목록을 한 번만 받는다. 근무지가 없으면(가입 직후) 「서명할 근로계약서」 묶음.
            서명할 계약이 없는 때가 대부분이라 받는 동안 자리를 잡아 두지 않는다(늦게 오면 아래 카드가 내려간다). */}
        <Suspense>
          <SignWaitingCards contracts={contractsOrNull()} noSite={current === null} />
        </Suspense>
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
 * 요청이 뜬다(home-popups.tsx). 근거: 서명 대기 계약은 기한(발송 + 30일)이 지나면 만료되고 서명해야 근무가 시작되는(데모 sign-req 문구)
 * 지금 근무지의 일이고, 소속 추가 요청은 새 근무지를 더할지 묻는 것이며 수락해도 그 뒤 계약 서명이 따로 온다(가입 · 진입 가이드 JOIN-7 의
 * 흐름이 가입 → 서명 요청 팝업). 데모 · 기획 문서에 둘이 함께일 때의 순서는 없다.
 * 두 조회를 함께 기다린다 — 계약 목록이 느린 동안 소속 추가 팝업도 기다리지만, 따로 띄우면 소속 추가가 먼저 떴다가 서명 요청이 그 뒤를
 * 잇는 순서가 뒤집힌다. 두 조회는 api 실패를 null 로 돌려주므로(그 팝업만 없이 홈 그대로) 여기까지 던져 오는 것은 코드 결함 · 만료 안내
 * redirect 뿐이라 홈 오류로 드러나게 둔다. 고용 형태 enum 은 계약 목록이 오면 바로(소속 추가 조회와 나란히) 받는다.
 */
async function HomeRequests() {
  const now = new Date();
  const contracts = contractsOrNull();
  const employmentTypes = contracts.then((items) =>
    items && signRequestOf(items, now)?.contract.employmentType ? employmentTypesOrEmpty() : [],
  );
  const [items, affiliationRequests, types] = await Promise.all([contracts, getMyAffiliationRequests(), employmentTypes]);
  const sign = items && signRequestOf(items, now);
  return (
    <HomePopups
      sign={
        sign && {
          key: sign.key,
          href: sign.href,
          rows: [
            { label: "근무지", value: sign.contract.storeName },
            ...(sign.contract.employmentType ? [{ label: "고용 형태", value: labelOf(types, sign.contract.employmentType) }] : []),
            ...(sign.deadline ? [{ label: "서명 기한", value: sign.deadline }] : []),
          ],
        }
      }
      affiliation={popupSummary(affiliationRequests ?? [])}
    />
  );
}

/**
 * 내 근로계약 목록 — 팝업 · 서명 대기 카드 곁들임이라 api 실패(4xx · 5xx · 연결 실패)는 null 로 받아 팝업 없이 홈을 그대로 보인다(401 은 만료 안내로).
 * 다루는 규칙은 소속 추가 요청 목록과 같다(requestsLoadFailure — 예상 밖 4xx 만 남긴다).
 */
async function getContractsOrNull() {
  try {
    return await getContracts();
  } catch (error) {
    const failure = failureOf(error);
    const handling = requestsLoadFailure(failure);
    if (handling === "throw") throw error;
    if (handling === "log" && failure) logFailure("contracts-home", failure);
    return null;
  }
}

/** 한 요청 안에서 팝업과 서명 대기 카드가 계약 목록을 한 번만 받는다. */
const contractsOrNull = cache(getContractsOrNull);

/** 고용 형태 enum. getEnumOrEmpty 는 5xx · 연결 실패만 빈 목록이고 404 · 응답 모양 결함은 던진다 — 팝업 곁들임이라 남기고 빈 목록(값 그대로). */
async function employmentTypesOrEmpty() {
  try {
    return await getEnumOrEmpty("EmploymentType");
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) logUnexpected("contracts-home", error);
    else console.error("[contracts-popup] EmploymentType enum 을 받지 못했습니다", error);
    return [];
  }
}
