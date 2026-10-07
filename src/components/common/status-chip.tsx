import type { ReactNode } from "react";

// 상태 칩: 11px · radius 8 · 좌우 10 위아래 4. 출퇴근 현황·근무정보 카드는 bold, TO-DO 줄은 semibold(weight).
// 색은 이 칩에만 나와 토큰으로 두지 않는다. 12px semibold 의 Badge 와는 크기·색이 다른 별개의 칩이다.
const TONE = {
  success: "bg-[#eaf8f2] text-[#13785e]", // 정상 · 완료
  warning: "bg-[#fff6e5] text-[#956013]", // 지각 · 긴급
  working: "bg-[#e1e8ff] text-staff-primary", // 근무 중
  progress: "bg-[#eef2ff] text-staff-primary", // 진행 중
  neutral: "border border-staff-border-light bg-[#f9fbfd] text-staff-text-sub", // 대기 · 공유
};

export type StatusChipTone = keyof typeof TONE;

export function StatusChip({
  tone,
  weight = "bold",
  children,
}: {
  tone: StatusChipTone;
  weight?: "bold" | "semibold";
  children: ReactNode;
}) {
  return (
    <span
      className={`shrink-0 rounded-[8px] px-[10px] py-[4px] text-[11px] leading-[1.5] ${weight === "bold" ? "font-bold" : "font-semibold"} ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
