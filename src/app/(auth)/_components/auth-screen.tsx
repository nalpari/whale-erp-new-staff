import type { ReactNode, Ref } from "react";
import { Dock } from "@/components/common";

export const CONNECTION_FAILED_MESSAGE = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";

// 로그인 · 비밀번호 재설정 화면 한 장: 제목(28px) · 설명(14px) · 내용, 아래 버튼 줄(좌우 30).
// 기준은 데모 docs/demo/src/pages/login 의 screen. Figma 01.Login: 로고 위 62 · 로고와 제목 사이 76.
// 폼이면 AuthScreen 을 <form className="flex flex-1 flex-col"> 으로 감싼다 — 그래야 Dock 이 맨 아래에 붙는다.
// Dock 도 폼 안에서 그려지므로 제출 버튼이 폼에 든다.
export function AuthScreen({
  top,
  eyebrow,
  title,
  description,
  children,
  dock,
  titleRef,
}: {
  top?: ReactNode;
  /** 제목 바로 위의 작은 줄(가입의 단계 막대). */
  eyebrow?: ReactNode;
  title: string;
  /**
   * 주면 제목이 초점을 받을 수 있게 된다(tabIndex -1). 페이지 이동 없이 같은 화면에서 결과로 바뀔 때(이메일 찾기) 부른 쪽이 제목에
   * 초점을 옮긴다 — 누른 버튼이 사라지면 초점이 body 로 떨어져 화면 읽기 사용자는 바뀐 줄 모른다.
   */
  titleRef?: Ref<HTMLHeadingElement>;
  description?: ReactNode;
  children?: ReactNode;
  dock: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-[16px] px-[30px] pt-[52px] pb-[24px] leading-[1.5]">
        {top && <div className="pt-[10px] pb-[60px]">{top}</div>}
        <div className="flex flex-col gap-[6px] pb-[8px]">
          {eyebrow}
          <h1 ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="text-[28px] font-bold outline-none">
            {title}
          </h1>
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
