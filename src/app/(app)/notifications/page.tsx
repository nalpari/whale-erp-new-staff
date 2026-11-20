import type { Metadata } from "next";
import Link from "next/link";
import { Alert, BottomNav, Button, PageHeader } from "@/components/common";
import { getMyNotifications } from "@/lib/my-notifications";
import { requireSession } from "@/lib/session";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "알림 · Whale ERP" };

const PAGE_SIZE = 20;
/** api 최대(200)까지 「더 보기」로 늘린다 — 14일치라 그보다 많을 일은 드물다 */
const MAX_PAGES = 10;

// 머리줄 오른쪽 톱니(데모 notify settingsButton). public/icons 에 없어 데모처럼 글자색을 따르는 선 아이콘으로 그린다 — 이 화면에만 나온다.
function GearIcon() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

// 알림함(목업 notify.html, WHALEERP-266). 종에서 들어온다(NOTI-5). 모든 근무지의 알림, 받은 지 14일 안의 것(NOTI-3).
// 「더 보기」는 주소 ?more= 로 받는 건수를 늘린다 — 새로 고침해도 같은 만큼 보인다.
export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  await requireSession();
  const raw = (await searchParams).more;
  const more = Math.min(Math.max(Number(typeof raw === "string" ? raw : 1) || 1, 1), MAX_PAGES);
  const list = await getMyNotifications(`pageSize=${PAGE_SIZE * more}`);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="알림"
        backHref="/home"
        action={
          <Link
            href="/notifications/settings"
            transitionTypes={["nav-forward"]}
            aria-label="알림 설정"
            className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center text-staff-text"
          >
            <GearIcon />
          </Link>
        }
      />
      <div className="flex flex-col gap-[16px] px-[22px] pt-[20px] pb-[24px] leading-[1.5]">
        {!list ? (
          <>
            <Alert tone="warning">알림을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
            <Button variant="outline" href="/notifications">
              다시 불러오기
            </Button>
          </>
        ) : (
          <NotificationList
            items={list.items}
            unreadCount={list.unreadCount}
            now={new Date().toISOString()}
            moreHref={list.total > list.items.length && more < MAX_PAGES ? `/notifications?more=${more + 1}` : null}
          />
        )}
      </div>
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/notifications" />
      </div>
    </div>
  );
}
