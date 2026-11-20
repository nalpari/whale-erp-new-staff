import type { ReactNode } from "react";

// 화면 아래 버튼 줄. 흰 바탕 · 위 14 · 사이 8 · 아래는 safe area 와 24 중 큰 쪽.
// 본문이 짧으면 맨 아래에 붙는다(mt-auto — 감싸는 쪽이 flex 세로 열이어야 한다). 좌우 24, 로그인 · 비밀번호 재설정은 30.
// onPage 면 바탕을 칠하지 않아 감싸는 화면의 바탕(기본 staff-bg, 근무 중 · 퇴근 완료는 흰색)이 그대로 보인다 — 출퇴근 화면은 버튼만
// 흰 띠 위에 떠 보여 바탕을 맞췄다(2026-11-20 사용자 지정).
export function Dock({ inset = 24, onPage = false, children }: { inset?: 24 | 30; onPage?: boolean; children: ReactNode }) {
  return (
    <div
      className={`mt-auto flex flex-col gap-[8px] ${onPage ? "" : "bg-white"} pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))] ${inset === 30 ? "px-[30px]" : "px-[24px]"}`}
    >
      {children}
    </div>
  );
}
