import type { ReactNode } from "react";
import { Dock } from "@/components/common";

export const CONNECTION_FAILED_MESSAGE = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";

// 로그인 · 비밀번호 재설정 화면 한 장: 제목(28px) · 설명(14px) · 내용, 아래 버튼 줄(좌우 30).
// 기준은 데모 docs/demo/src/pages/login 의 screen. Figma 01.Login: 로고 위 62 · 로고와 제목 사이 76.
// 폼이면 AuthScreen 을 <form className="flex flex-1 flex-col"> 으로 감싼다 — 그래야 Dock 이 맨 아래에 붙는다.
// Dock 도 폼 안에서 그려지므로 제출 버튼이 폼에 든다.
export function AuthScreen({
  top,
  title,
  description,
  children,
  dock,
}: {
  top?: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  dock: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-[16px] px-[30px] pt-[52px] pb-[24px] leading-[1.5]">
        {top && <div className="pt-[10px] pb-[60px]">{top}</div>}
        <div className="flex flex-col gap-[6px] pb-[8px]">
          <h1 className="text-[28px] font-bold">{title}</h1>
          {description && (
            <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{description}</p>
          )}
        </div>
        {children}
      </div>
      <Dock inset={30}>{dock}</Dock>
    </>
  );
}
