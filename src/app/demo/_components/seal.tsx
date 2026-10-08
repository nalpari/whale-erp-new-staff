import type { ReactNode } from "react";

// 결과 도장. 88px 원 · 2px 테두리 · 15px bold(줄간 1.3). 완료는 초록, 거부는 빨강.
const TONE = { success: "border-[#13785e] bg-[#eaf8f2] text-[#13785e]", danger: "border-[#dc2626] bg-[#fee2e2] text-[#dc2626]" };

export function Seal({ tone = "success", children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return (
    <div className={`mx-auto flex size-[88px] items-center justify-center rounded-full border-2 text-[15px] leading-[1.3] font-bold ${TONE[tone]}`}>
      {children}
    </div>
  );
}
