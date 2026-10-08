import type { ReactNode } from "react";

// 카드·판 머리의 이름. 13px semibold 보조 글자.
export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold text-staff-text-sub">{children}</p>;
}

// 본문 아래 작은 안내. 12px 흐린 글자, <b> 는 보조 글자 bold.
export function Tiny({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text-sub">{children}</p>;
}
