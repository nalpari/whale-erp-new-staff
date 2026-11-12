"use client";

import { Alert, TopBar } from "@/components/common";
import { useStoreSheet, type StoreChoice } from "../store-sheet";

// 홈 머리줄(HOME-2) — 공통 TopBar(로고 · 근무지 이름 버튼 · 종)에 「근무지 고르기」 시트를 붙인다. 근무 탭 근무지 카드와 같은 시트다.
// 근무지가 하나면 onStoreClick 을 넘기지 않아 시트가 열리지 않는다. 근무지가 없으면 이름 자리에 퇴직 후는 「근무 종료」, 그 밖(가입 직후 · 계약 전)은 「연결된 근무지 없음」(HOME-5).
export function StoreTopBar({
  stores,
  currentId,
  hasNewAlarm,
  retired,
}: {
  stores: StoreChoice[];
  currentId: number | null;
  hasNewAlarm: boolean;
  /** 지금 소속이 없고 퇴직한 소속이 있다 */
  retired: boolean;
}) {
  const current = stores.find((s) => s.staffMemberId === currentId);
  const { openSheet, pending, error, sheet } = useStoreSheet(stores, current?.staffMemberId ?? 0);
  return (
    <>
      <TopBar
        store={current?.storeName ?? (retired ? "근무 종료" : "연결된 근무지 없음")}
        onStoreClick={stores.length > 1 ? () => !pending && openSheet() : undefined}
        alarmHref="/notifications"
        hasNewAlarm={hasNewAlarm}
      />
      {error && <Alert tone="warning">{error}</Alert>}
      {stores.length > 1 && sheet}
    </>
  );
}
