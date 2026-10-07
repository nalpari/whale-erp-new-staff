import type { ReactNode } from "react";

// 상태 칩: 11px bold · radius 8 · 좌우 10 위아래 4. 출퇴근 현황·근무정보 카드에 쓴다.
// 색은 이 칩에만 나와 토큰으로 두지 않는다. 12px semibold 의 Badge 와는 크기·색이 다른 별개의 칩이다.
const TONE = {
  success: "bg-[#eaf8f2] text-[#13785e]", // 정상
  warning: "bg-[#fff6e5] text-[#956013]", // 지각 · 긴급
  working: "bg-[#e1e8ff] text-staff-primary", // 근무 중
};

export type StatusChipTone = keyof typeof TONE;

export function StatusChip({ tone, children }: { tone: StatusChipTone; children: ReactNode }) {
  return <span className={`shrink-0 rounded-[8px] px-[10px] py-[4px] text-[11px] leading-[1.5] font-bold ${TONE[tone]}`}>{children}</span>;
}
