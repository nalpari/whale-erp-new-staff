import { DownloadPill } from "@/components/common";

// PAY-2 명세서 내보내기(상세에서만). 이 앱의 /pay/[payslipId]/pdf(라우트 핸들러)가 api 의 PDF 를 받아 첨부로 내려준다.
// 성공은 첨부라 화면이 그대로이고, 실패는 라우트가 상세로 돌려보내 안내를 띄운다(계약서 파일 받기와 같다).
// 파일 이름은 api 가 정한다(급여명세서_YYYY-MM_이름.pdf). [keepQuery] 는 상세로 돌아올 때 이어 줄 from · store 다.
// 화면 맨 아래 큰 버튼 대신 머리줄 오른쪽 끝 남색 알약이다(2026-11-25 사용자 지정, `DownloadPill`).
export function ExportButton({ payslipId, keepQuery }: { payslipId: number; keepQuery: string }) {
  return <DownloadPill href={`/pay/${payslipId}/pdf${keepQuery}`}>PDF 다운로드</DownloadPill>;
}
