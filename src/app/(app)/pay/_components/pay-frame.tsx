import type { ReactNode } from "react";
import { BottomNav } from "@/components/common";

// 급여 화면 틀: 머리줄 · 본문(데모 body detail) · 하단 메뉴. 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙인다(다섯 칸, 2026-10-08 재영).
export function PayFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col leading-[1.5]">
      {header}
      <div className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[14px]">{children}</div>
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/pay" />
      </div>
    </div>
  );
}

/** 데모 tiny: 화면 아래 작은 안내. <b> 는 굵은 보조 글자. */
export function Tiny({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text-sub">{children}</p>;
}

// 목업 abar 의 안내 아이콘(ph-info). public/icons 에 없어 원 안의 i 를 직접 그린다(데모와 같음). 보조 글자색.
export function InfoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-staff-text-sub">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </svg>
  );
}
