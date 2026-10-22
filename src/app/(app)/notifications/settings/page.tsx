import type { Metadata } from "next";
import { Alert, Button, Notice, PageHeader } from "@/components/common";
import { getMyNotificationPreferences } from "@/lib/my-notifications";
import { requireSession } from "@/lib/session";
import { PreferenceList } from "./preference-list";

export const metadata: Metadata = { title: "알림 설정 · Whale ERP" };

// 알림 수신 설정(목업 notify.html 「수신 설정」, WHALEERP-269). 수신 설정 묶음마다 앱 푸시를 켜고 끈다 — 네 묶음 모두 끌 수 있다(NOTI-8).
export default async function NotificationSettingsPage() {
  await requireSession();
  const preferences = await getMyNotificationPreferences();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="알림 설정" backHref="/notifications" />
      <div className="flex flex-col gap-[16px] px-[22px] pt-[16px] pb-[24px] leading-[1.5]">
        <p className="text-[14px] text-staff-text-sub">유형별로 받을 앱 푸시를 고릅니다. 꺼 둔 유형도 알림함에서는 확인할 수 있습니다.</p>
        {!preferences ? (
          <>
            <Alert tone="warning">알림 설정을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
            <Button variant="outline" href="/notifications/settings">
              다시 불러오기
            </Button>
          </>
        ) : (
          <PreferenceList items={preferences.items} />
        )}
        <Notice>기본 채널은 앱 푸시입니다. 근로계약서처럼 꼭 확인해야 하는 알림은 카카오 알림톡을 함께 보내는 경우가 있습니다.</Notice>
      </div>
    </div>
  );
}
