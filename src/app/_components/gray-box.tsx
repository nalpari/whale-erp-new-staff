import type { ReactNode } from "react";

/**
 * 처리 완료 화면의 회색 정보 상자 — 옅은 회색 바탕 · 둥근 16 · 테두리 없음 · 좌우 18(근로계약서 서명 완료 · 신고 정보 등록 완료,
 * 2026-11-25 사용자 지정). flush 는 줄 위아래 여백이 없는 값 목록(신고 정보 `Values flush`)을 담을 때라 상자가 위아래 15 를 준다.
 */
export function GrayBox({ flush = false, children }: { flush?: boolean; children: ReactNode }) {
  return <section className={`rounded-[16px] bg-staff-bg px-[18px] ${flush ? "py-[15px]" : "py-[6px]"}`}>{children}</section>;
}
