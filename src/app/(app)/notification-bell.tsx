import Image from "next/image";
import Link from "next/link";
import { getMyNotifications } from "@/lib/my-notifications";

// 화면 위쪽 종(NOTI-5) — 알림함으로 간다. 미확인 건수를 배지로 붙인다(9 넘으면 9+). 건수를 못 받으면 배지 없이 종만 둔다.
// 모양은 TopBar 의 알림 버튼과 같다(44px · radius 14 · #E9EDF3 테두리). 배지 색 #C24242 는 그 새 알림 점과 같다.
export async function NotificationBell() {
  const unread = (await getMyNotifications("pageSize=1"))?.unreadCount ?? 0;
  return (
    <Link
      href="/notifications"
      transitionTypes={["nav-forward"]}
      aria-label={unread > 0 ? `알림, 미확인 ${unread}건` : "알림"}
      className="relative flex size-[44px] shrink-0 items-center justify-center rounded-[14px] border border-[#e9edf3] bg-white transition-colors duration-150 ease-out active:bg-staff-info-bg"
    >
      <Image src="/icons/bell.svg" alt="" width={21} height={21} className="-scale-y-100" />
      {unread > 0 && (
        <span className="absolute -top-[4px] -right-[4px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#c24242] px-[4px] text-[10px] leading-none font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
