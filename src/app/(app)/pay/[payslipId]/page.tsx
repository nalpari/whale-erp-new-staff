import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Alert, Button, Card, HeroCard, Notice, PageHeader, StoreMark } from "@/components/common";
import {
  formatWon,
  historyEntries,
  isEarning,
  isItemShown,
  monthLabel,
  parsePayslipId,
  payslipDownloadAlert,
  payslipKeepQuery,
  periodLabel,
} from "@/lib/payslip-rules";
import { kstDateLabel } from "@/lib/profile";
import { getPayslip } from "@/lib/payslips";
import { requireSession } from "@/lib/session";
import { ChangedToast } from "../../me/changed-toast";
import { CorrectingBadge } from "../_components/correcting-badge";
import { ExportButton } from "../_components/export-button";
import { PayFrame } from "../_components/pay-frame";
import { PayTable } from "../_components/pay-table";

export const metadata: Metadata = { title: "급여명세서 · Whale ERP" };

// 급여명세서 상세. 기준: 데모 docs/demo/src/pages/pay 의 상세 · 다시 보낸 명세서(Figma 없음, DESIGN.md 기준 초안).
// 다시 보낸 명세서(PAY-1)는 따로 화면이 없다 — 발송이 두 번 이상인 명세서다. 최신 값으로 덮어 이전 금액은 보이지 않는다.
// 위쪽 「다시 발송되었습니다」 안내도, 바뀐 줄 표시(「· 정정됨」)도 두지 않는다(2026-10-20 재영, 알림 NOTI-6 과 같다).
// 데모 resent 와 같이 다시 보낸 명세서는 머리 메타에 가장 최근에 받은 날을 적는다. 아래 「실제 급여 지급은 …」 안내는 없앴다(2026-11-23 사용자 지정).
// 보낸 뒤 확정을 취소해 고치는 중이면(api correcting) 「검토 중」과 안내만 — 금액 · 항목 · 내보내기는 다시 받을 때까지 없다
// (2026-10-21 사용자 결정, 고치는 중인 값을 보이지 않게).
export default async function PayslipPage({ params, searchParams }: PageProps<"/pay/[payslipId]">) {
  await requireSession();
  // 내 근무지 › 급여명세서(?from=sites&store=)에서 왔으면 그 목록으로 돌아간다. 숫자가 아니면 급여 탭으로.
  const raw = await searchParams;
  const store = typeof raw.store === "string" && /^\d{1,10}$/.test(raw.store) ? raw.store : null;
  // 알림에서 열었으면(?from=notifications) 알림 목록으로 돌아간다(2026-11-24 사용자 지정)
  const backHref = raw.from === "notifications" ? "/notifications" : raw.from === "sites" && store ? `/pay?from=sites&store=${store}` : "/pay";
  const payslipId = parsePayslipId((await params).payslipId);
  const payslip = payslipId === null ? null : await getPayslip(payslipId);
  if (!payslip) {
    // 상세를 연 사이 명세서가 지워져 PDF 받기도 상세도 404면, 받기 실패 안내를 보이고 목록으로 돌아갈 길을 둔다
    // (기본 404 화면은 영어이고 돌아갈 길이 없다).
    const missingAlert = payslipDownloadAlert(raw.download);
    if (!missingAlert) notFound();
    return (
      <PayFrame nav={false} header={<PageHeader title="급여명세서" backHref={backHref} />}>
        <Alert tone="warning">
          <p>{missingAlert}</p>
        </Alert>
        <Button variant="outline" href={backHref}>
          목록으로
        </Button>
      </PayFrame>
    );
  }

  const sentAt = payslip.sentAt;
  const { grossPayAmount, totalDeductionAmount, netPayAmount } = payslip;
  const correcting = payslip.correcting || grossPayAmount === null || totalDeductionAmount === null || netPayAmount === null;
  // 4대보험 줄은 근로계약의 가입 체크대로만(api 가 준 가입 여부, WHALEERP-756)
  const items = payslip.items.filter((i) => isItemShown(i, payslip.isWithholdingApplied, payslip));
  const earnings = items.filter(isEarning);
  const deductions = items.filter((i) => !isEarning(i));
  // PDF 받기가 실패해 돌아왔다(pdf/route.ts). 안내를 띄운 뒤 주소의 `?download=` 는 지운다 — 새로 고칠 때마다 다시 뜨지 않게.
  const keepQuery = payslipKeepQuery((name) => (typeof raw[name] === "string" ? raw[name] : null));
  const downloadAlert = payslipDownloadAlert(raw.download);
  // 맨 위 상자의 이름 · 값 줄(급여기간 · 발송일, 2026-11-25 사용자 지정) — 발송 전 재검토면 발송일 줄을 두지 않는다
  const facts: [string, string][] = [
    ["급여기간", periodLabel(payslip.periodStartDate, payslip.periodEndDate)],
    ...(sentAt ? [["발송일", kstDateLabel(sentAt)] as [string, string]] : []),
  ];

  return (
    <PayFrame nav={false} header={
        <PageHeader
          title="급여명세서"
          backHref={backHref}
          // PDF 다운로드는 머리줄 오른쪽 끝(2026-11-25 사용자 지정, 전엔 화면 맨 아래 큰 버튼)
          action={correcting ? undefined : <ExportButton payslipId={payslip.payslipId} keepQuery={keepQuery} />}
        />
      }>
      {downloadAlert && (
        <>
          <Alert tone="warning">
            <p>{downloadAlert}</p>
          </Alert>
          <ChangedToast path={`/pay/${payslip.payslipId}${keepQuery}`} />
        </>
      )}
      {/* 맨 위 상자(2026-11-25 사용자 지정 — 전엔 회색 상자에 「급여 기간」 · 기간 · 한 줄 회색 글자로 근무지 · 고용 형태 · 받은 날을 몰았다):
          윗줄 근무지(점포 표시 · 이름) · 다시 검토 중이면 오른쪽 배지, 제목 「2026년 11월 급여명세서」, 아래 이름 · 값 줄(급여기간 · 발송일). */}
      <section className="flex flex-col rounded-[16px] border border-staff-border bg-white px-[18px] pt-[16px] pb-[6px]">
        <div className="flex items-center gap-[8px]">
          <StoreMark />
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-staff-text-sub">{payslip.storeName}</p>
          {/* 직원은 발송한 명세서만 받아 「발송 완료」는 늘 같은 글자라 두지 않는다 — 다시 검토 중일 때만 배지(2026-11-25 사용자 지정) */}
          {correcting && <CorrectingBadge />}
        </div>
        <h2 className="pt-[14px] pb-[8px] text-[20px] leading-[1.4] font-bold">{monthLabel(payslip.periodStartDate)} 급여명세서</h2>
        <dl className="flex flex-col divide-y divide-staff-border-light">
          {facts.map(([name, value]) => (
            <div key={name} className="flex items-start gap-[12px] py-[10px]">
              <dt className="shrink-0 text-[13px] text-staff-text-sub">{name}</dt>
              <dd className="min-w-0 flex-1 text-right text-[14px] font-medium text-staff-text">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {correcting ? (
        <Notice icon={<Image src="/icons/pencil.svg" alt="" width={11.719} height={13.719} />}>
          <strong>관리자가 이 명세서를 다시 검토하고 있습니다.</strong> 다시 받으면 바뀐 금액과 항목을 볼 수 있습니다.
        </Notice>
      ) : (
        <>
          {/* 실지급액: 목록의 이번 달 카드와 같은 짙은 남색(급여 화면에서 가장 먼저 볼 숫자). 정돈 시안 카드형(2026-11-20 사용자 지정)으로
              지급 · 공제 카드 위로 올리고 아래에 지급 · 공제 합계를 한 줄로 둔다. */}
          <HeroCard tone="navy">
            {/* 높이를 줄였다 — 위아래 16 · 금액 26px · 합계 줄 위 8(2026-11-25 사용자 지정) */}
            <div className="flex flex-col gap-[2px]">
              <p className="text-[13px] opacity-70">실지급액</p>
              <p className="font-bold tabular-nums">
                <span className="text-[26px]">{formatWon(netPayAmount)}</span>
                <span className="text-[17px]"> 원</span>
              </p>
              <p className="mt-[8px] flex gap-[18px] border-t border-white/15 pt-[10px] text-[13px] tabular-nums opacity-80">
                <span>지급 {formatWon(grossPayAmount)}원</span>
                <span>공제 {formatWon(totalDeductionAmount)}원</span>
              </p>
            </div>
          </HeroCard>
          <PayTable head="지급" items={earnings} total={grossPayAmount} />
          <PayTable head="공제" items={deductions} total={totalDeductionAmount} />
        </>
      )}

      {/* PAY-1 · PAY-20: 가장 최근 발송 한 줄과 확정 취소만, 시각과 짧은 꼬리표로. 관리자 이름은 적지 않는다. 최근 것이 위. */}
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">처리 내역</p>
        <ul className="flex flex-col gap-[4px] pt-[8px] text-[12px] text-staff-text-muted">
          {historyEntries(payslip.logs).map((e) => (
            <li key={`${e.at}-${e.label}`}>
              <span className="tabular-nums">{e.at}</span> · {e.label}
            </li>
          ))}
        </ul>
      </Card>

    </PayFrame>
  );
}
