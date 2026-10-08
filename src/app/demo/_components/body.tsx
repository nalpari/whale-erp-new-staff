import type { ReactNode } from "react";

// 머리줄과 Dock 사이의 본문 틀. form(가입·신고 정보·내 정보)은 좌우 24 · 위 30 · 사이 16,
// detail(출퇴근 등록·근로계약·급여)은 좌우 22 · 위 22 · 사이 20 이고 결과 화면(center)은 위 52 로 내려 앉힌다.
const BODY = {
  form: (center: boolean) => `flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] ${center ? "text-center" : ""}`,
  detail: (center: boolean) => `flex flex-1 flex-col gap-[20px] px-[22px] pb-[14px] ${center ? "pt-[52px] text-center" : "pt-[22px]"}`,
};

export function Body({ variant = "form", center = false, children }: { variant?: keyof typeof BODY; center?: boolean; children: ReactNode }) {
  return <div className={BODY[variant](center)}>{children}</div>;
}

// 화면 아래 버튼 줄. 흰 바탕 · 위 14 · 사이 8 · 아래는 safe area 와 24 중 큰 쪽. 좌우는 24, 로그인·출퇴근 등록·근로계약은 30.
export function Dock({ inset = 24, children }: { inset?: 24 | 30; children: ReactNode }) {
  return (
    <div
      className={`mt-auto flex flex-col gap-[8px] bg-white pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))] ${inset === 30 ? "px-[30px]" : "px-[24px]"}`}
    >
      {children}
    </div>
  );
}
