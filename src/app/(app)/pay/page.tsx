import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge, Button, PageHeader } from "@/components/common";
import { filterYears, formatWon, monthLabel, parsePayFilter, receivedMonthLabel, sentDateLabel } from "@/lib/payslip-rules";
import { getPayslips } from "@/lib/payslips";
import { requireSession } from "@/lib/session";
import { AboutSheet } from "./_components/about-sheet";
import { CorrectingBadge } from "./_components/correcting-badge";
import { PayFilter } from "./_components/pay-filter";
import { PayFrame, Tiny } from "./_components/pay-frame";

export const metadata: Metadata = { title: "급여 · Whale ERP" };

// 급여 목록. 기준: 데모 docs/demo/src/pages/pay(목록 · 빈 상태 · 필터 결과 없음 · 급여명세서 안내 시트), Figma 08.급여(node 17:825).
// 맨 위는 이번 달(한국 시간)에 받은 명세서 전체의 실지급액 합계 카드(PAY-9) — 근무지 · 필터와 관계없고 누르는 곳이 없다.
// 아래 「명세서」는 받은 명세서 모두를 점포 · 연도(급여 기간) 칩으로 거른다(PAY-10). 고른 근무지와 관계없이 보이므로 줄마다
// 점포를 적는다(PAY-8). 맨 위 카드의 합계 · 건수 · 점포 이름(thisMonth)은 api 가 센 값이다 — 앱은 더하지 않는다.
// 보낸 뒤 확정을 취소한 명세서는 빠지지 않고 「정정 중」으로 금액 없이 남는다(api correcting, 2026-10-21 사용자 결정).
// 명세서 내보내기는 상세에만 있다(PAY-2). 이 화면에 「입금」이라는 말은 쓰지 않는다(급여 지급은 이 시스템 밖).
export default async function PayPage({ searchParams }: PageProps<"/pay">) {
  await requireSession();
  const raw = await searchParams;
  const years = filterYears();
  const filter = parsePayFilter(raw, years);
  const { thisMonth, stores, items } = await getPayslips(filter);

  return (
    <PayFrame header={<PageHeader title="급여" backHref="/home" action={<AboutSheet />} />}>
      {stores.length > 0 ? (
        <>
          {/* 이번 달 실지급액 합계(Figma node 17:1003): 짙은 남색 · radius 24 · 안쪽 25. 남색 위 흐린 글자 #BAC7DE·#D1DAEB 는 이 카드에만 쓴다. */}
          <section aria-label="이번 달에 받은 급여명세서" className="flex flex-col rounded-[24px] bg-staff-navy p-[25px] text-white">
            <p className="text-[13px] text-[#bac7de]">{receivedMonthLabel(thisMonth.month)}에 받은 급여명세서 · 실지급액 합계</p>
            {thisMonth.count > 0 ? (
              <>
                <p className="pt-[14px] pb-[16px] font-bold">
                  <span className="text-[32px]">{formatWon(thisMonth.totalNetPayAmount)}</span>
                  <span className="text-[17px]"> 원</span>
                </p>
                <p className="border-t border-white/13 pt-[15px] text-[12px] text-[#d1daeb]">
                  명세서 {thisMonth.count}건 · {thisMonth.storeNames.join(", ")}
                </p>
              </>
            ) : (
              // 0원이 아니라 받은 것이 없다고 적는다(PAY-9)
              <p className="pt-[14px] text-[17px] font-bold">이번 달에 받은 명세서가 없습니다</p>
            )}
          </section>

          <section className="flex flex-col rounded-[20px] border border-staff-border-light bg-white p-[20px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-staff-text-sub">명세서</h2>
              <span className="text-[12px] text-staff-text-muted">{items.length}건</span>
            </div>
            <PayFilter stores={stores} years={years} storeId={filter.storeId} year={filter.year} />
            {items.length > 0 ? (
              <ul className="divide-y divide-staff-border-light pt-[4px]">
                {items.map((p) => (
                  <li key={p.payslipId}>
                    <Link
                      href={`/pay/${p.payslipId}`}
                      transitionTypes={["nav-forward"]}
                      className="flex min-h-[44px] w-full items-center gap-[12px] py-[17px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[15px] font-semibold">{monthLabel(p.periodStartDate)}</span>
                        <span className="truncate pt-[2px] text-[12px] text-staff-text-sub">{rowLabel(p.storeName, p.sentAt)}</span>
                      </span>
                      {p.correcting || p.netPayAmount === null ? (
                        // 보낸 뒤 확정을 취소해 고치는 중 — 금액은 다시 받을 때까지 보이지 않는다
                        <CorrectingBadge />
                      ) : (
                        <span className="flex shrink-0 flex-col items-end gap-[3px]">
                          <span className="text-[13.5px] tabular-nums">{formatWon(p.netPayAmount)}원</span>
                          <Badge tone="success">발송 완료</Badge>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-[10px] pt-[24px] pb-[6px] text-center">
                {/* 처음 필터(전체 점포 · 올해)에서 비면 지울 필터가 없다 — 1월에 지난해 12월분만 받은 경우 등. 연도를 바꾸게 한다. */}
                {filter.storeId === undefined && filter.year === years[0] ? (
                  <p className="text-[14px] text-staff-text-sub">{filter.year}년 급여 기간의 명세서가 없습니다. 연도를 바꿔 보세요.</p>
                ) : (
                  <>
                    <p className="text-[14px] text-staff-text-sub">조건에 맞는 명세서가 없습니다</p>
                    <Button variant="outline" href="/pay" replace scroll={false}>
                      필터 지우기
                    </Button>
                  </>
                )}
              </div>
            )}
          </section>

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

/** 「웨일카페 강남역점 · 9월 10일 발송」 — 발송 시각은 api 의 sentAt(가장 최근 발송 — 다시 보냈으면 그때, 목업 7월 「8월 20일 발송」). */
function rowLabel(storeName: string, sentAt: string | null): string {
  return sentAt ? `${storeName} · ${sentDateLabel(sentAt)} 발송` : storeName;
}
