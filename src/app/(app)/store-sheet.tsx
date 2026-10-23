"use client";

import { useState, useTransition } from "react";
import { BottomSheet, SheetOption } from "@/components/common";
import { pickStoreAction } from "./store-actions";

export type StoreChoice = { staffMemberId: number; storeName: string };

// 「근무지 고르기」 시트(HOME-2 · WORK-4) — 홈 상단 선택기와 근무 탭 근무지 카드가 같이 쓴다. 고르면 앱 전역 근무지가 바뀐다.
// 여는 자리(버튼 모양)는 부른 쪽이 그리고, 시트 · 고르기 처리 · 대기 · 오류만 여기 둔다. 모양은 데모(/design/work)와 같다.
export function useStoreSheet(stores: StoreChoice[], currentId: number) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const handlePick = (staffMemberId: number) => {
    setOpen(false);
    if (staffMemberId === currentId) return;
    startTransition(async () => {
      setError((await pickStoreAction(staffMemberId)).error);
    });
  };

  const sheet = (
    <BottomSheet open={open} onClose={() => setOpen(false)} title="어디에서 근무하시나요?" description="선택한 근무지의 정보를 보여드려요.">
      {stores.map((s) => (
        <SheetOption key={s.staffMemberId} selected={s.staffMemberId === currentId} onClick={() => handlePick(s.staffMemberId)}>
          {s.storeName}
        </SheetOption>
      ))}
    </BottomSheet>
  );

  return { openSheet: () => setOpen(true), pending, error, sheet };
}
