"use client";

import { useState, useTransition } from "react";
import { Alert, BottomSheet, Button, Notice } from "@/components/common";
import { timeLabel, type MyNotification } from "@/lib/notifications";
import { markNotificationAction, openNotificationAction, readAllNotificationsAction } from "./actions";

// 알림함 목록(목업 notify.html). 미확인은 왼쪽에 파란 점, 긴급 TO-DO 는 빨간 점, 읽은 줄은 옅게 가라앉힌다.
// 줄을 누르면 읽음으로 바꾸며 관련 화면으로 간다(#267). 줄마다 읽음 · 안 읽음을 바꾸고 머리에 「모두 읽음」을 둔다(NOTI-7).
// 열 곳이 없으면 「이 알림과 연결된 화면을 열 수 없습니다」 시트. 점 색 #315DF5 · #C24242 는 이 줄에만 나와 토큰으로 두지 않는다.
export function NotificationList({
  items,
  unreadCount,
  now,
  moreHref,
}: {
  items: MyNotification[];
  unreadCount: number;
  now: string;
  moreHref: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);
  const at = new Date(now);

  const run = (action: () => Promise<{ error?: string; unavailable?: boolean }>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await action();
      setError(result.error);
      if (result.unavailable) setUnavailable(true);
    });

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center gap-[6px] py-[60px] text-center">
        <p className="text-[18px] font-bold">확인할 알림이 없습니다</p>
        <p className="max-w-[300px] text-[14px] text-staff-text-sub">
          근로계약서, 근무스케줄 변경, 곧 수행할 TO-DO, 급여명세서가 도착하면 여기에 표시됩니다.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-staff-text-sub">
          미확인 <b className="text-staff-text">{unreadCount}</b>건
        </p>
        <button
          type="button"
          disabled={pending || unreadCount === 0}
          onClick={() => run(readAllNotificationsAction)}
          className="-m-[10px] min-h-[44px] px-[10px] text-[13px] font-semibold text-staff-primary disabled:text-staff-placeholder"
        >
          모두 읽음
        </button>
      </div>
      {error && <Alert tone="warning">{error}</Alert>}
      <ul className="divide-y divide-[#e8edf3] rounded-[16px] border border-staff-border-light bg-white">
        {items.map((n) => (
          <li key={n.id} className={`flex items-start gap-[10px] px-[14px] py-[14px] ${n.isRead ? "opacity-60" : ""}`}>
            <span
              aria-hidden
              className={`mt-[8px] size-[8px] shrink-0 rounded-full ${n.isRead ? "bg-transparent" : n.isUrgent ? "bg-[#c24242]" : "bg-[#315df5]"}`}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => openNotificationAction(n.id))}
              className="flex min-w-0 flex-1 flex-col gap-[2px] text-left"
            >
              <span className="text-[15px] font-semibold text-staff-text">
                {n.title}
                {n.isUrgent && <span className="text-[#c24242]"> · 긴급</span>}
              </span>
              <span className="text-[13px] text-staff-text-sub">{n.body}</span>
              <span className="text-[12px] text-staff-text-muted">
                {timeLabel(n.createdAt, at)}
                {n.isRead && " · 읽음"}
              </span>
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markNotificationAction(n.id, !n.isRead))}
              aria-label={n.isRead ? `${n.title} 안 읽음으로` : `${n.title} 읽음으로`}
              className="-my-[10px] -mr-[6px] min-h-[44px] shrink-0 px-[6px] text-[12px] font-semibold text-staff-text-sub"
            >
              {n.isRead ? "안 읽음" : "읽음"}
            </button>
          </li>
        ))}
      </ul>
      {moreHref && (
        <Button variant="outline" href={moreHref}>
          더 보기
        </Button>
      )}
      <Notice>
        알림은 <strong>14일</strong> 동안 보관합니다. 근로계약서와 급여명세서는 각 화면에서 기간대로 계속 볼 수 있습니다.
      </Notice>
      <BottomSheet
        open={unavailable}
        onClose={() => setUnavailable(false)}
        title="이 알림과 연결된 화면을 열 수 없습니다"
        description="관련 항목이 삭제되었거나 더 이상 접근할 수 없습니다. 알림 자체는 계속 알림함에 남아 있습니다."
      >
        <Button onClick={() => setUnavailable(false)}>알림함으로 돌아가기</Button>
      </BottomSheet>
    </div>
  );
}
