import type { ReactNode } from "react";

// Figma 안내 블록: #F5F7FB 바탕 · #EFF2F6 테두리 · radius 12 · 안쪽 16 · 아이콘과 글 사이 12.
// 글 안에서 강조할 말은 <strong> 으로 감싼다(굵게 · 기본 글자색).
export function Notice({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-full items-start gap-[12px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[16px] text-[13px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
      {icon && (
        <span aria-hidden className="pt-[1px] text-[12px]">
          {icon}
        </span>
      )}
      <p>{children}</p>
    </div>
  );
}
