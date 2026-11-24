"use client";

import type { ReactNode } from "react";
import { Alert, TopBar } from "@/components/common";
import { useStoreSheet, type StoreChoice } from "../store-sheet";

// 홈 · 근무 · 출퇴근 머리줄(HOME-2) — 공통 TopBar(홈은 로고 · 근무지 · 종, 탭은 제목 · 종 / 근무지 줄)에 「근무지 고르기」 시트를 붙인다.
// 근무지가 하나면 onStoreClick 을 넘기지 않아 시트가 열리지 않는다. 근무지가 없으면 이름 자리에 퇴직 후는 「근무 종료」, 그 밖(가입 직후 · 계약 전)은 「연결된 근무지 없음」(HOME-5).
export function StoreTopBar({
  stores,
  currentId,
  hasNewAlarm,
  retired,
  title,
  backHref,
  action,
  pickable = true,
}: {
  stores: StoreChoice[];
  currentId: number | null;
  hasNewAlarm: boolean;
  /** 지금 소속이 없고 퇴직한 소속이 있다 */
  retired: boolean;
  title?: string;
  backHref?: string;
  action?: ReactNode;
  /** false 면 시트를 열지 않는다 — 출퇴근 화면은 근무지를 고르지 않는다(ATT-07) */
  pickable?: boolean;
}) {
  const canPick = pickable && stores.length > 1;
  const current = stores.find((s) => s.staffMemberId === currentId);
  const { openSheet, pending, error, sheet } = useStoreSheet(stores, current?.staffMemberId ?? 0);
  return (
    <>
      <TopBar
        store={current?.storeName ?? (retired ? "근무 종료" : "연결된 근무지 없음")}
        onStoreClick={canPick ? () => !pending && openSheet() : undefined}
        alarmHref="/notifications"
        hasNewAlarm={hasNewAlarm}
        title={title}
        backHref={backHref}
        action={action}
      />
      {error && <Alert tone="warning">{error}</Alert>}
      {canPick && sheet}
    </>
  );
}
