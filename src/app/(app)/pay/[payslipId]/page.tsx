import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, HeroCard, PageHeader } from "@/components/common";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { formatWon, historyEntries, isEarning, isItemShown, isResent, lastSentAt, parsePayslipId, periodLabel, sentDateLabel } from "@/lib/payslip-rules";
import { getPayslip } from "@/lib/payslips";
import { requireSession } from "@/lib/session";
import { ExportButton } from "../_components/export-button";
import { PayFrame, Tiny } from "../_components/pay-frame";
import { PayTable } from "../_components/pay-table";

export const metadata: Metadata = { title: "급여명세서 · Whale ERP" };

// 급여명세서 상세. 기준: 데모 docs/demo/src/pages/pay 의 상세 · 다시 보낸 명세서(Figma 없음, DESIGN.md 기준 초안).
// 다시 보낸 명세서(PAY-1)는 따로 화면이 없다 — 발송이 두 번 이상인 명세서다. 최신 값으로 덮어 이전 금액은 보이지 않고,
// 다시 보낸 사유는 위 안내가 맡고 처리 이력에는 적지 않는다. 바뀐 줄 표시(「· 정정됨」)는 api 에 이전 값이 없어 하지 않는다.
export default async function PayslipPage({ params }: PageProps<"/pay/[payslipId]">) {
  await requireSession();
  const payslipId = parsePayslipId((await params).payslipId);
  const payslip = payslipId === null ? null : await getPayslip(payslipId);
  if (!payslip) notFound();

  // 한글 이름 하나 때문에 화면 전체를 오류로 만들지 않는다. 못 받으면 labelOf 가 값 그대로 보인다.
  const employmentTypes = await getEnumOrEmpty("EmploymentType");
  const resent = isResent(payslip.logs);
  const sentAt = lastSentAt(payslip.logs);
  const items = payslip.items.filter((i) => isItemShown(i, payslip.isWithholdingApplied));
  const earnings = items.filter(isEarning);
  const deductions = items.filter((i) => !isEarning(i));
  const meta = [payslip.storeName, labelOf(employmentTypes, payslip.employmentType), !resent && sentAt ? `${sentDateLabel(sentAt)} 발송` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <PayFrame header={<PageHeader title="급여명세서" backHref="/pay" />}>
      {resent && sentAt && (
        // 목업 note--amber. 상태 칩 지각·긴급 색(#FFF6E5 · #956013).
        <p className="rounded-[12px] bg-[#fff6e5] p-[14px] text-[13px] font-bold text-[#956013]">{sentDateLabel(sentAt)} 다시 발송되었습니다.</p>
      )}

      {/* 목업 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. */}
      <section className="flex flex-col gap-[8px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <p className="text-[13px] font-semibold text-staff-text-sub">급여 기간</p>
            <p className="text-[16px] font-bold">{periodLabel(payslip.periodStartDate, payslip.periodEndDate)}</p>
          </div>
          {!resent && <Badge tone="success">발송 완료</Badge>}
        </div>
        <p className="text-[12px] text-staff-text-muted">{meta}</p>
      </section>

      <PayTable head="지급 항목" items={earnings} totalLabel="지급 합계" total={payslip.grossPayAmount} />
      <PayTable head="공제 항목" items={deductions} totalLabel="공제 합계" total={payslip.totalDeductionAmount} />

      {/* 실지급액: 목록의 이번 달 카드와 같은 짙은 남색(급여 화면에서 가장 먼저 볼 숫자). */}
      <HeroCard tone="navy">
        <div className="flex items-center justify-between gap-[12px]">
          <p className="text-[18px] font-bold">실지급액</p>
          <p className="font-bold tabular-nums">
            <span className="text-[28px]">{formatWon(payslip.netPayAmount)}</span>
            <span className="text-[17px]"> 원</span>
          </p>
        </div>
      </HeroCard>

      {/* PAY-1: 시각과 짧은 꼬리표만. 관리자 이름은 적지 않는다. 최근 것이 위. */}
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">처리 이력</p>
        <ul className="flex flex-col gap-[4px] pt-[8px] text-[12px] text-staff-text-muted">
          {historyEntries(payslip.logs).map((e) => (
            <li key={`${e.at}-${e.label}`}>
              <span className="tabular-nums">{e.at}</span> · {e.label}
            </li>
          ))}
        </ul>
      </Card>

      <ExportButton payslipId={payslip.payslipId} />
      {!resent && <Tiny>급여 지급은 이 화면에서 처리하지 않습니다. 실제 지급은 회사의 지급 절차를 따릅니다.</Tiny>}
    </PayFrame>
  );
}
