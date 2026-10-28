import type { ReactNode } from "react";

// 소속 추가 확인(WHALEERP-144) 화면들 — 확인 · 목록 · 결과(done) — 이 같이 쓰는 본문 틀과 첫 제목. 서버 · 클라이언트 화면 모두에서 쓴다.

/** 본문 틀: 좌우 24 · 위 30 · 사이 16. */
export const BODY = "flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]";

/** 화면 첫 제목 + 설명(데모 lead). */
export function Lead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h2 className="text-[22px] font-bold">{title}</h2>
      <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{children}</p>
    </div>
  );
}
