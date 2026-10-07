import type { ReactNode } from "react";

// Figma Badge. 바탕은 글자색을 옅게 깐 색이다. 배지에만 나오는 색이라 토큰으로 두지 않는다.
const TONE = {
  working: "bg-staff-primary-inactive text-staff-primary", // 근무 중
  progress: "bg-[#eef2ff] text-staff-primary", // 진행 중
  success: "bg-[#dcfce7] text-[#16a34a]", // 정상 · 완료
  danger: "bg-[#fee2e2] text-[#dc2626]", // 지각
  warning: "bg-[#fef3c7] text-[#d97706]", // 긴급
  waiting: "bg-[#f1f5f9] text-[#64748b]", // 대기
  plain: "bg-staff-bg text-staff-text-sub", // 공유
};

export type BadgeTone = keyof typeof TONE;

// radius 8 · 좌우 10 · 상하 4 · 12px semibold. 색만으로 상태를 말하지 않도록 글자를 늘 함께 둔다.
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[8px] px-[10px] py-[4px] text-[12px] font-semibold whitespace-nowrap ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
