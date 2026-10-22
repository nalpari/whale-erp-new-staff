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
          <Link href="/notifications/settings" transitionTypes={["nav-forward"]} className="-m-[10px] flex min-h-[44px] items-center px-[10px] text-[14px] font-semibold text-staff-text-sub">
            알림 설정
          </Link>
        }
      />
      <div className="flex flex-col gap-[16px] px-[22px] pt-[16px] pb-[24px] leading-[1.5]">
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
