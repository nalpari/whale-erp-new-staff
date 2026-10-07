import type { ReactNode } from "react";

// Figma 안내 블록(로그인 화면 node 4:2012): #F5F7FB 바탕 · #EFF2F6 테두리 · radius 12 · 안쪽 14.
// 아이콘은 20px 칸 가운데, 글과 사이 6px. 글 안에서 강조할 말은 <strong> 으로 감싼다(굵게 · 기본 글자색).
export function Notice({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-full gap-[6px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-[13px] leading-[1.5] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
      {icon && (
        <span aria-hidden className="flex w-[20px] shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <p className="min-w-0 flex-1">{children}</p>
    </div>
  );
}
