import { Button } from "@/components/common";

// PAY-2 명세서 내보내기(상세에서만). 이 앱의 /pay/[payslipId]/pdf(라우트 핸들러)가 api 의 PDF 를 받아 첨부로 내려준다.
// download 링크라 Next Link 가 화면 이동으로 가로채지 않고, 자바스크립트 없이도 받는다. 파일 이름은 api 가 정한다
// (급여명세서_YYYY-MM_이름.pdf).
export function ExportButton({ payslipId }: { payslipId: number }) {
  return (
    <Button variant="outline" href={`/pay/${payslipId}/pdf`} download prefetch={false}>
      명세서 내보내기
    </Button>
  );
}
