import type { ReactNode } from "react";

// 화면 아래 버튼 줄. 흰 바탕 · 위 14 · 사이 8 · 아래는 safe area 와 24 중 큰 쪽.
// 본문이 짧으면 맨 아래에 붙는다(mt-auto — 감싸는 쪽이 flex 세로 열이어야 한다). 좌우 24, 로그인 화면은 30.
export function Dock({ inset = 24, children }: { inset?: 24 | 30; children: ReactNode }) {
  return (
    <div
      className={`mt-auto flex flex-col gap-[8px] bg-white pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))] ${inset === 30 ? "px-[30px]" : "px-[24px]"}`}
    >
      {children}
    </div>
  );
}
