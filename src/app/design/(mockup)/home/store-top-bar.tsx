"use client";

import { useState } from "react";
import { TopBar } from "@/components/common";
import { STORES } from "../mockup-nav";
import { StoreSheet } from "../store-sheet";

// 머리줄의 점포 이름을 누르면 근무지 고르기 시트(Figma 03.Sheet)가 열린다. 목업이라 고른 점포는 이름만 바뀐다.
export function StoreTopBar() {
  const [store, setStore] = useState(STORES[0]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <TopBar store={store} onStoreClick={() => setOpen(true)} alarmHref="/design/notification-settings" hasNewAlarm />
      <StoreSheet open={open} onClose={() => setOpen(false)} store={store} onPick={setStore} />
    </>
  );
}
