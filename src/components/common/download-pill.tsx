import { PRESS } from "./theme";

/**
 * 머리줄 오른쪽 끝 파일 받기 알약 — 남색 바탕 · 흰 글자 · 다운로드 아이콘(급여명세서 · 근로계약서 상세의 PDF, 2026-11-25 사용자 지정).
 * Next Link 가 아닌 보통 링크라 화면 이동으로 가로채지 않는다(라우트 핸들러가 첨부로 내려준다). download 속성은 두지 않는다 — 두면
 * 실패해 돌아온 상세 화면(HTML)까지 파일로 받아 버린다. 보이는 알약은 36px, 누르는 칸은 위아래를 넓혀 44px.
 * 글자는 「PDF 다운로드」 — 폭 360 미만(구형 소형 기기)에서는 머리줄 제목이 잘려 「다운로드」를 화면에서만 숨긴다. 화면 낭독기는 label
 * (「급여명세서 PDF 다운로드」처럼 무엇을 받는지)로 읽는다.
 */
export function DownloadPill({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} aria-label={label} className="group -my-[4px] flex min-h-[44px] shrink-0 items-center">
      <span
        className={`flex h-[36px] items-center gap-[5px] rounded-full bg-staff-navy px-[14px] text-[13px] font-semibold whitespace-nowrap text-white group-active:opacity-80 ${PRESS}`}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2.5v8M4.75 7.5 8 10.75l3.25-3.25M3 13.25h10" />
        </svg>
        PDF<span className="max-[359px]:hidden">{" "}다운로드</span>
      </span>
    </a>
  );
}
