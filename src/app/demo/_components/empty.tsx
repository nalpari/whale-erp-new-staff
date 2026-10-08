import type { ReactNode } from "react";

// 빈 상태. 56px 흰 원 안 아이콘 · 제목 18px bold · 설명 14px 보조 글자(최대 300px), 사이 14. 남은 높이 가운데에 선다.
export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-[8px] pb-[52px] text-center">
      <span className="flex size-[56px] items-center justify-center rounded-full border border-staff-border-light bg-white text-staff-text-sub">{icon}</span>
      <h2 className="text-[18px] font-bold">{title}</h2>
      <div className="flex max-w-[300px] flex-col gap-[8px] text-[14px] text-staff-text-sub">{children}</div>
    </div>
  );
}
