"use client";

import { BottomSheet, SheetOption } from "@/components/common";
import { STORES } from "./mockup-nav";

// Figma 03.Sheet 근무지 고르기. 고르면 onPick 후 닫힌다.
export function StoreSheet({
  open,
  onClose,
  store,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  store: string;
  onPick: (store: string) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="어디에서 근무하시나요?" description="선택한 근무지의 정보를 보여드려요.">
      {STORES.map((s) => (
        <SheetOption
          key={s}
          selected={s === store}
          onClick={() => {
            onPick(s);
            onClose();
          }}
        >
          {s}
        </SheetOption>
      ))}
    </BottomSheet>
  );
}
