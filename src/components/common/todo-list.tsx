"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { EASE_OUT } from "./theme";

// Figma 07.근무 정보_list TO-DO 목록(node 17:610): 카드 없이 줄만 쌓고 줄 사이는 #E8EDF3 1px 선.
export function TodoList({ children }: { children: ReactNode }) {
  return <ul className="w-full divide-y divide-[#e8edf3]">{children}</ul>;
}

// 한 줄(node 17:612): 위아래 17 · 사이 12. 체크칸 28px(radius 2, #EDEDFB) · 제목 15px semibold · 아래 12px 일시 · 오른쪽 칩들(사이 4).
// 완료하면 체크칸이 남보라로 차고 제목은 흐린 글자가 된다. overdue(기한 지남)면 일시를 갈색(#956013)으로.
// 체크 표시는 Figma 의 두 그림(빈 칸·찬 칸)을 그대로 쓴다. onToggle 이 없으면 보기 전용이다.
// 보이는 칸은 28px 이지만 체크박스는 사방 8px 더 넓혀 44px 로 눌린다.
// onOpen 을 주면 제목 · 일시 칸이 상세를 여는 버튼이 된다(체크칸과 따로 눌린다).
export function TodoItem({
  title,
  meta,
  done,
  overdue = false,
  onToggle,
  onOpen,
  badges,
}: {
  title: string;
  meta: string;
  done: boolean;
  overdue?: boolean;
  onToggle?: (done: boolean) => void;
  onOpen?: () => void;
  badges?: ReactNode;
}) {
  // 버튼 안에는 <p> 를 둘 수 없어 onOpen 이면 <span> 으로 그린다. flex 칸의 자식이라 모양은 같다.
  const Line = onOpen ? "span" : "p";
  const text = (
    <>
      <Line className={`truncate text-[15px] font-semibold ${done ? "text-staff-text-muted" : "text-staff-text"}`}>{title}</Line>
      <Line className={`truncate pt-[2px] text-[12px] ${overdue ? "text-[#956013]" : "text-staff-text-sub"}`}>{meta}</Line>
    </>
  );
  return (
    <li className="flex items-center gap-[12px] py-[17px] leading-[1.5]">
      <label
        className={`relative flex size-[28px] shrink-0 items-center justify-center rounded-[2px] transition-colors duration-150 ${EASE_OUT} ${
          done ? "bg-staff-primary" : "bg-staff-primary-inactive"
        }`}
      >
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => onToggle?.(e.target.checked)}
          disabled={!onToggle}
          aria-label={`${title} 완료`}
          className="absolute -inset-[8px] appearance-none rounded-[10px]"
        />
        <Image src={done ? "/icons/todo-check-on.svg" : "/icons/todo-check-off.svg"} alt="" width={12} height={9} className="pointer-events-none" />
      </label>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col text-left">
          {text}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">{text}</div>
      )}
      {badges && <div className="flex shrink-0 gap-[4px]">{badges}</div>}
    </li>
  );
}
