"use client";

import { Alert, TopBar } from "@/components/common";
import { useStoreSheet, type StoreChoice } from "../store-sheet";

// 홈 머리줄(HOME-2) — 공통 TopBar(로고 · 근무지 이름 버튼 · 종)에 「근무지 고르기」 시트를 붙인다. 근무 탭 근무지 카드와 같은 시트다.
// 근무지가 하나면 onStoreClick 을 넘기지 않아 시트가 열리지 않는다. 근무지가 없으면 이름 자리에 「근무지가 없습니다」(HOME-5).
export function StoreTopBar({ stores, currentId, hasNewAlarm }: { stores: StoreChoice[]; currentId: number | null; hasNewAlarm: boolean }) {
  const current = stores.find((s) => s.staffMemberId === currentId);
  const { openSheet, pending, error, sheet } = useStoreSheet(stores, current?.staffMemberId ?? 0);
  const many = stores.length > 1 && !pending;
  return (
    <>
      <TopBar
        store={current?.storeName ?? "근무지가 없습니다"}
        onStoreClick={many ? openSheet : undefined}
        alarmHref="/notifications"
        hasNewAlarm={hasNewAlarm}
      />
      {error && <Alert tone="warning">{error}</Alert>}
      {stores.length > 1 && sheet}
    </>
  );
}
