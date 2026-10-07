"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { EASE_OUT } from "./theme";

// Figma TO-DO 목록 틀: 흰 바탕 · #EFF2F6 테두리 · radius 16. 줄 사이는 같은 색 1px 선.
export function TodoList({ children }: { children: ReactNode }) {
  return (
    <ul className="w-full divide-y divide-staff-border-light overflow-clip rounded-[16px] border border-staff-border-light bg-white">
      {children}
    </ul>
  );
}

// 한 줄: 체크칸(24px, radius 6, 2px 테두리) · 제목 14px semibold · 아래 12px 일시 · 오른쪽 배지들(사이 6).
// 완료하면 체크칸이 브랜드색으로 차고 제목은 placeholder 색 + 취소선. onToggle 이 없으면 보기 전용이다.
export function TodoItem({
  title,
  meta,
  done,
  onToggle,
  badges,
}: {
  title: string;
  meta: string;
  done: boolean;
  onToggle?: (done: boolean) => void;
  badges?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-[12px] px-[16px] py-[14px]">
      <label className="relative flex size-[24px] shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => onToggle?.(e.target.checked)}
          disabled={!onToggle}
          aria-label={`${title} 완료`}
          className={`peer size-[24px] appearance-none rounded-[6px] border-2 border-staff-border transition-colors duration-150 ${EASE_OUT} checked:border-staff-primary checked:bg-staff-primary`}
        />
        <Image
          src="/icons/check.svg"
          alt=""
          width={12}
          height={12}
          className={`pointer-events-none absolute scale-50 opacity-0 transition-[opacity,transform] duration-150 ${EASE_OUT} peer-checked:scale-100 peer-checked:opacity-100`}
        />
      </label>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className={`truncate text-[14px] font-semibold ${done ? "text-staff-placeholder line-through" : "text-staff-text"}`}>{title}</p>
        <p className="truncate text-[12px] text-staff-text-muted">{meta}</p>
      </div>
      {badges && <div className="flex shrink-0 gap-[6px]">{badges}</div>}
    </li>
  );
}
