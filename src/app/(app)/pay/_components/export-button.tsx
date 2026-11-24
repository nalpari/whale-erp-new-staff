import { buttonClass } from "@/components/common";

// PAY-2 명세서 내보내기(상세에서만). 이 앱의 /pay/[payslipId]/pdf(라우트 핸들러)가 api 의 PDF 를 받아 첨부로 내려준다.
// Next Link 가 아닌 보통 링크라 화면 이동으로 가로채지 않는다. download 속성은 두지 않는다 — 두면 실패해 돌아온 상세 화면(HTML)까지
// 파일로 받아 버린다. 성공은 첨부라 화면이 그대로이고, 실패는 라우트가 상세로 돌려보내 안내를 띄운다(계약서 파일 받기와 같다).
// 파일 이름은 api 가 정한다(급여명세서_YYYY-MM_이름.pdf). [keepQuery] 는 상세로 돌아올 때 이어 줄 from · store 다.
export function ExportButton({ payslipId, keepQuery }: { payslipId: number; keepQuery: string }) {
  return (
    <a href={`/pay/${payslipId}/pdf${keepQuery}`} className={buttonClass("outline")}>
      급여명세서 PDF 다운로드
    </a>
  );
}
