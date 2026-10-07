"use client";

import { useState } from "react";
import { BottomSheet, SheetOption, TopBar } from "@/components/common";

const STORES = ["웨일카페 강남역점", "웨일카페 홍대점"];

// 머리줄의 점포 이름을 누르면 근무지 고르기 시트(Figma 03.Sheet)가 열린다. 목업이라 고른 점포는 이름만 바뀐다.
export function StoreTopBar() {
  const [store, setStore] = useState(STORES[0]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <TopBar store={store} onStoreClick={() => setOpen(true)} alarmHref="#" hasNewAlarm />
      <BottomSheet open={open} onClose={() => setOpen(false)} title="어디에서 근무하시나요?" description="선택한 근무지의 정보를 보여드려요.">
        {STORES.map((s) => (
          <SheetOption
            key={s}
            selected={s === store}
            onClick={() => {
              setStore(s);
              setOpen(false);
            }}
          >
            {s}
          </SheetOption>
        ))}
      </BottomSheet>
    </>
  );
}
