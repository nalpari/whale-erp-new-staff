import type { ReactNode } from "react";

// Figma InfoCard: 흰 바탕 · #EFF2F6 테두리 · radius 16 · 안쪽 16.
export function Card({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[16px] border border-staff-border-light bg-white p-[16px]">{children}</div>;
}

const HERO = {
  primary: "bg-staff-primary", // 오늘의 근무
  navy: "bg-staff-navy", // 급여
};

// 홈 맨 위의 진한 카드(Figma Work Status Card · Salary Card): radius 20 · 안쪽 20 · 흰 글자.
// 안에 놓는 보조 글자는 흰색에 투명도(opacity-60~80)로 낮춘다.
export function HeroCard({ tone, children }: { tone: keyof typeof HERO; children: ReactNode }) {
  return <div className={`w-full rounded-[20px] p-[20px] text-white ${HERO[tone]}`}>{children}</div>;
}
