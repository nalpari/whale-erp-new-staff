import type { ReactNode } from "react";

// 경고 안내 판. radius 12 · 안쪽 14 · 13px, <strong> 은 bold. 색은 StatusChip 지각 칩과 같은 짝이라 토큰으로 두지 않는다.
const TONE = { warning: "bg-[#fff6e5] text-[#956013]", danger: "bg-[#fee2e2] text-[#dc2626]" };

// 줄을 쌓을 때(<p> 둘)는 사이 2. space-y 라 글 속 <strong>·<br> 에는 걸리지 않는다.
export function Alert({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <div className={`w-full space-y-[2px] rounded-[12px] p-[14px] text-left text-[13px] leading-[1.5] [&_strong]:font-bold ${TONE[tone]}`}>{children}</div>
  );
}
