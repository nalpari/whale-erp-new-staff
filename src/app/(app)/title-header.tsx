import type { ReactNode } from "react";
import { TopBar } from "@/components/common";
import { getUnreadNotificationCount } from "@/lib/my-notifications";

/**
 * 근무지 줄 없는 탭 머리줄 — 홈 · 근무 · 출퇴근 머리줄(StoreHeader)과 같은 제목(22px) · 종 모양(2026-11-24 사용자 지정).
 * 급여명세서처럼 근무지를 화면 안 필터로 따로 고르는 화면이 쓴다.
 */
export async function TitleHeader({ title, backHref, action, titleAfter }: { title: string; backHref?: string; action?: ReactNode; titleAfter?: ReactNode }) {
  const unread = await getUnreadNotificationCount();
  return (
    <div className="bg-white px-[24px] pt-[16px] pb-[12px]">
      <TopBar title={title} backHref={backHref} action={action} titleAfter={titleAfter} alarmHref="/notifications" hasNewAlarm={unread > 0} />
    </div>
  );
}
