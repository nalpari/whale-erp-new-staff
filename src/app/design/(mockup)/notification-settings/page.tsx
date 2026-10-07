import { PageHeader } from "@/components/common";
import { PageSlide } from "../page-slide";
import { SettingsList } from "./settings-list";

// Figma 09.알림설정(node 17:1097). 홈 머리줄의 알림 버튼에서 들어온다.
export default function MockupNotificationSettingsPage() {
  return (
    <PageSlide>
      <div className="flex flex-1 flex-col">
        <PageHeader title="알림 설정" backHref="/design/home" />

        <main className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
          <p className="pb-[4px] text-[14px]">
            유형별로 받을 알림을 고릅니다.
            <br />꺼 둔 유형도 알림함에서는 확인할 수 있습니다.
          </p>

          <SettingsList />

          {/* 채널 안내(node 17:1241): #F9FBFD 바탕 · 옅은 테두리 · radius 14 · 안쪽 14. 화면 아래에 놓인다. */}
          <p className="mt-auto rounded-[14px] border border-staff-border-light bg-[#f9fbfd] p-[14px] text-[12px] text-staff-text-sub">
            기본 채널은 앱 푸시입니다. 근로계약서처럼 놓치면 안 되는 알림은 푸시가 닿지 않으면 카카오 알림톡으로 대신 보냅니다.
          </p>
        </main>
      </div>
    </PageSlide>
  );
}
