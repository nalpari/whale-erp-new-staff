import type { ReactNode } from "react";

// 꺾은선 보조 줄 — 값 · 항목 아래에 한 칸 들여 둥근 └ 선(12×14, #C3CAD6)과 13px 흐린 글자로 덧붙임(남은 날 · 비과세 · 계산식)을 단다.
// 관리자 웹 근로계약서 작성의 계산식 줄과 같은 생각이다(2026-11-20 사용자 지정).
export function SubLine({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-start gap-[6px] pl-[4px] text-[13px] leading-[1.5] break-keep text-staff-text-muted">
      <svg aria-hidden width="12" height="14" viewBox="0 0 12 14" fill="none" className="mt-[1px] shrink-0">
        <path d="M1.5 0.5V5.5Q1.5 9.5 5.5 9.5H11" stroke="#c3cad6" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="min-w-0">{children}</span>
    </span>
  );
}
