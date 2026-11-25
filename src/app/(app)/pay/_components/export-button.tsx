import { PRESS } from "@/components/common/theme";

// PAY-2 명세서 내보내기(상세에서만). 이 앱의 /pay/[payslipId]/pdf(라우트 핸들러)가 api 의 PDF 를 받아 첨부로 내려준다.
// Next Link 가 아닌 보통 링크라 화면 이동으로 가로채지 않는다. download 속성은 두지 않는다 — 두면 실패해 돌아온 상세 화면(HTML)까지
// 파일로 받아 버린다. 성공은 첨부라 화면이 그대로이고, 실패는 라우트가 상세로 돌려보내 안내를 띄운다(계약서 파일 받기와 같다).
// 파일 이름은 api 가 정한다(급여명세서_YYYY-MM_이름.pdf). [keepQuery] 는 상세로 돌아올 때 이어 줄 from · store 다.
// 화면 맨 아래 큰 버튼 대신 머리줄 오른쪽 끝 알약(다운로드 아이콘 + 「PDF 다운로드」)이다. 흰 알약은 눈에 띄지 않아 실지급액 카드와 같은
// 남색 바탕 · 흰 글자로 둔다(2026-11-25 사용자 지정). 보이는 알약은 36px, 누르는 칸은 위아래를 넓혀 44px.
export function ExportButton({ payslipId, keepQuery }: { payslipId: number; keepQuery: string }) {
  return (
    <a href={`/pay/${payslipId}/pdf${keepQuery}`} className="group -my-[4px] flex min-h-[44px] shrink-0 items-center">
      <span
        className={`flex h-[36px] items-center gap-[5px] rounded-full bg-staff-navy px-[14px] text-[13px] font-semibold text-white group-active:opacity-80 ${PRESS}`}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2.5v8M4.75 7.5 8 10.75l3.25-3.25M3 13.25h10" />
        </svg>
        PDF 다운로드
      </span>
    </a>
  );
}
