import type { Metadata } from "next";
import { Alert, BottomNav, Card } from "@/components/common";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getMyProfileOrNull } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { NotificationBell } from "../notification-bell";
import { TodoCard } from "./todo-card";

export const metadata: Metadata = { title: "홈 · Whale ERP" };

// 임시 홈 — 로그인 뒤 갈 곳. 실제 홈(WHALEERP-311 개인 근무 대시보드 · 313 앱 홈 카드)은
// 다른 작업자가 이 파일을 바꿔 채운다. 로그아웃은 내 정보 화면(/me) 맨 아래로 옮겼다(WHALEERP-193).
export default async function HomePage() {
  const { account } = await requireSession();
  // 한글 이름 하나 때문에 화면 전체를 오류로 만들지 않는다. 못 받으면 labelOf 가 값 그대로 보인다.
  // 이메일은 내 정보에서 지금 값을 받는다 — 로그인 쿠키는 로그인한 순간의 값이라 이메일을 바꾼 뒤에는 옛 값이다.
  // 못 받으면(5xx · 연결 실패) 쿠키의 값으로 보이고 홈 전체를 오류로 만들지 않는다.
  const [statuses, profile] = await Promise.all([getEnumOrEmpty("AccountStatus"), getMyProfileOrNull()]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[52px] pb-[24px] leading-[1.5]">
        <div className="flex items-center gap-[12px]">
          <h1 className="min-w-0 flex-1 text-[26px] font-bold">{account.realName}님</h1>
          {/* 알림함은 화면 위쪽 종으로 들어간다(NOTI-5) */}
          <NotificationBell />
        </div>
        {account.status === "LINK_HOLD" && (
          <Alert tone="warning">
            <strong>관리자가 가입 연결을 확인하고 있습니다.</strong> 확인이 끝나면 근무 정보가 보입니다.
          </Alert>
        )}
        <Card>
          <p className="text-[13px] font-semibold text-staff-text-sub">계정</p>
          <p className="pt-[6px] text-[14px]">{profile?.email ?? account.email}</p>
          <p className="text-[13px] text-staff-text-sub">{labelOf(statuses, account.status)}</p>
        </Card>
        <TodoCard />
      </div>
      {/* 로그아웃이 내 정보로 옮겨 가 홈에서도 하단 메뉴로 내 정보에 간다. */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/" />
      </div>
    </div>
  );
}
