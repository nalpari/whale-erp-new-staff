"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomSheet, SheetOption } from "@/components/common";
import type { PayslipList } from "@/lib/payslips";

// 명세서 목록 필터 칩(데모 pay 의 pf-store · pf-year, PAY-10). 누르면 시트에서 고르고, 고른 값은 주소(?store · ?year)에 실어
// 서버가 다시 그린다. 처음은 전체 점포 · 올해이고, 바꾼 칩은 남보라로 강조한다.
export function PayFilter({
  stores,
  years,
  storeId,
  year,
}: {
  stores: PayslipList["stores"];
  years: readonly number[];
  storeId?: number;
  year: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"store" | "year" | null>(null);
  const go = (next: { storeId?: number; year: number }) => {
    setOpen(null);
    router.replace(payFilterHref(next, years[0]), { scroll: false });
  };
  const storeName = stores.find((s) => s.storeId === storeId)?.storeName;

  return (
    <>
      <div className="flex gap-[8px] pt-[10px]">
        <Chip label={storeName ?? "전체 점포"} on={storeName !== undefined} onClick={() => setOpen("store")} />
        <Chip label={`${year}년`} on={year !== years[0]} onClick={() => setOpen("year")} />
      </div>
      <BottomSheet
        open={open === "store"}
        onClose={() => setOpen(null)}
        title="점포"
        description="명세서를 받은 적이 있는 점포를 모두 보입니다. 퇴직한 곳도 들어갑니다."
      >
        <SheetOption selected={storeName === undefined} onClick={() => go({ year })}>
          전체 점포
        </SheetOption>
        {stores.map((s) => (
          <SheetOption key={s.storeId} selected={s.storeId === storeId} onClick={() => go({ storeId: s.storeId, year })}>
            {s.storeName}
          </SheetOption>
        ))}
      </BottomSheet>
      <BottomSheet
        open={open === "year"}
        onClose={() => setOpen(null)}
        title="연도"
        description="급여 기간 기준입니다. 보관 기간 3년에 맞춰 올해부터 3년 전까지 고릅니다."
      >
        {years.map((y) => (
          <SheetOption key={y} selected={y === year} onClick={() => go({ storeId: storeName === undefined ? undefined : storeId, year: y })}>
            {y}년
          </SheetOption>
        ))}
      </BottomSheet>
    </>
  );
}

/** 필터 주소. 기본값(전체 점포 · 올해)은 싣지 않는다 — 「필터 지우기」는 /pay 다. */
function payFilterHref({ storeId, year }: { storeId?: number; year: number }, thisYear: number): string {
  const query = new URLSearchParams();
  if (storeId !== undefined) query.set("store", String(storeId));
  if (year !== thisYear) query.set("year", String(year));
  const qs = query.toString();
  return qs ? `/pay?${qs}` : "/pay";
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      // 보이는 높이는 데모대로 36px, 누르는 곳은 위아래 4px 씩 넓혀 44px
      className={`relative flex h-[36px] min-w-0 items-center gap-[6px] rounded-full border px-[14px] text-[13px] font-semibold before:absolute before:inset-x-0 before:-inset-y-[4px] before:content-[''] ${
        on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text-sub"
      }`}
    >
      <span className="truncate">{label}</span>
      <Image src="/icons/chevron-down.svg" alt="" width={12} height={12} className="shrink-0 -scale-y-100" />
    </button>
  );
}
