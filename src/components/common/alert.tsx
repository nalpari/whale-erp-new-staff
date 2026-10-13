import type { ReactNode } from "react";

// 경고 안내 판. radius 12 · 안쪽 14 · 13px, <strong> 은 bold.
// warning 은 StatusChip 지각 칩과 같은 짝(#FFF6E5/#956013), danger 는 #FEE2E2/#DC2626. 한 곳에만 나오는 색이라 토큰으로 두지 않는다.
const TONE = { warning: "bg-[#fff6e5] text-[#956013]", danger: "bg-[#fee2e2] text-[#dc2626]" };

// 줄을 쌓을 때(<p> 둘)는 사이 2. space-y 는 직계 자식 모두에 붙지만, inline 인 <strong>·<br> 에는 위아래 여백이 효과가 없다.
export function Alert({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={`w-full space-y-[2px] rounded-[12px] p-[14px] text-left text-[13px] leading-[1.5] [&_strong]:font-bold ${TONE[tone]}`}
    >
      {children}
    </div>
  );
}
