import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/common";
import { formatWon, isResent, lastSentAt, monthLabel, sentDateLabel } from "@/lib/payslip-rules";
import { getPayslips, type PayslipLog } from "@/lib/payslips";
import { requireSession } from "@/lib/session";
import { AboutSheet } from "./_components/about-sheet";
import { PayFrame, Tiny } from "./_components/pay-frame";

export const metadata: Metadata = { title: "급여 · Whale ERP" };

// 급여 목록. 기준: 데모 docs/demo/src/pages/pay(목록 · 빈 상태 · 급여명세서 안내 시트), Figma 08.급여(node 17:825).
// 맨 위는 가장 최근 명세서의 실지급액 카드, 아래는 지난 명세서. 다시 보낸 명세서는 목업처럼 「발송 완료」 칩 없이 둔다.
// 명세서 내보내기는 상세에만 있다(PAY-2). 이 화면에 「입금」이라는 말은 쓰지 않는다(급여 지급은 이 시스템 밖).
export default async function PayPage() {
  await requireSession();
  // api 가 급여 기간이 늦은 것부터 준다. 맨 위가 실지급액 카드, 나머지는 「지난 명세서」. 없으면 빈 상태.
  const [latest, ...past] = await getPayslips();

  return (
    <PayFrame header={<PageHeader title="급여" backHref="/home" action={<AboutSheet />} />}>
      {latest ? (
        <>
          {/* 이번 달 실지급액(Figma node 17:1003): 짙은 남색 · radius 24 · 안쪽 25. 남색 위 흐린 글자 #BAC7DE·#D1DAEB 는 이 카드에만 쓴다. */}
          <section aria-label="이번 달 급여명세서" className="flex flex-col rounded-[24px] bg-staff-navy p-[25px] text-white">
            <p className="text-[13px] text-[#bac7de]">{monthLabel(latest.periodStartDate)} 급여명세서 · 실지급액</p>
            <p className="pt-[14px] pb-[16px] font-bold">
              <span className="text-[32px]">{formatWon(latest.netPayAmount)}</span>
              <span className="text-[17px]"> 원</span>
            </p>
            <div className="flex justify-between gap-[8px] border-t border-white/13 pt-[15px] text-[12px] text-[#d1daeb]">
              <span>{sentLabel(latest.logs)}</span>
              <Link href={`/pay/${latest.payslipId}`} transitionTypes={["nav-forward"]} className="-my-[13px] flex min-h-[44px] shrink-0 items-center">
                명세서 확인하기 →
              </Link>
            </div>
          </section>

          {past.length > 0 && (
            <section className="flex flex-col rounded-[20px] border border-staff-border-light bg-white p-[20px]">
              <h2 className="text-[13px] font-semibold text-staff-text-sub">지난 명세서</h2>
              <ul className="divide-y divide-staff-border-light pt-[4px]">
                {past.map((p) => (
                  <li key={p.payslipId}>
                    <Link
                      href={`/pay/${p.payslipId}`}
                      transitionTypes={["nav-forward"]}
                      className="flex min-h-[44px] w-full items-center gap-[12px] py-[17px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[15px] font-semibold">{monthLabel(p.periodStartDate)}</span>
                        <span className="truncate pt-[2px] text-[12px] text-staff-text-sub">{sentLabel(p.logs)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-[3px]">
                        <span className="text-[13.5px] tabular-nums">{formatWon(p.netPayAmount)}원</span>
                        {!isResent(p.logs) && <Badge tone="success">발송 완료</Badge>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 목업 grow 뒤 tiny · Figma mt-auto: 본문이 짧으면 맨 아래에 붙는다. */}
          <div className="mt-auto">
            <Tiny>
              명세서는 이메일로도 발송됩니다. <b>퇴직한 뒤에도 이 급여 탭에서</b> 조회할 수 있고, 명세서를 만든 날부터 3년 동안 볼 수 있습니다. 계정을 탈퇴하면 볼 수 없습니다.
            </Tiny>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">
          <Image src="/icons/menu-payslip.svg" alt="" width={44} height={44} className="mb-[6px]" />
          <p className="text-[18px] font-bold">아직 받은 명세서가 없습니다</p>
          <p className="max-w-[230px] text-[13px] text-staff-text-sub">급여명세서는 관리자가 확정해 발송한 뒤에만 이 화면에 나타납니다.</p>
        </div>
      )}
    </PayFrame>
  );
}

/** 「9월 10일 발송」 — 다시 보냈으면 마지막 발송일이다(목업 7월 「8월 20일 발송」). */
function sentLabel(logs: readonly PayslipLog[]): string {
  const at = lastSentAt(logs);
  return at ? `${sentDateLabel(at)} 발송` : "";
}
