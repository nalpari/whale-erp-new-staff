import type { ReactNode } from "react";

// Figma 02.Main 묶음 제목 줄: 제목 16px bold, 옆에 개수(12px bold 남보라), 오른쪽 끝에 기간·「전체 보기」 같은 곁가지.
export function SectionTitle({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-[8px] leading-[1.5]">
      <h2 className="flex items-center gap-[8px] text-[16px] font-bold text-staff-text">
        {title}
        {count !== undefined && <span className="text-[12px] text-staff-primary">{count}</span>}
      </h2>
      {children}
    </div>
  );
}
