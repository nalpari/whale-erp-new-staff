import type { Metadata } from "next";
import Link from "next/link";
import { Button, IconTile, PageHeader } from "@/components/common";
import { filterYears, formatWon, receivedYears, monthLabel, parsePayFilter, receivedMonthLabel, sentDateLabel } from "@/lib/payslip-rules";
import { getMyMemberships } from "@/lib/my-profile";
import { getPayslips } from "@/lib/payslips";
import { WorkplaceBox } from "@/app/_components/workplace-box";
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
// 보낸 뒤 확정을 취소한 명세서는 빠지지 않고 「검토 중」으로 금액 없이 남는다(api correcting, 2026-10-21 사용자 결정).
// 명세서 내보내기는 상세에만 있다(PAY-2). 이 화면에 「입금」이라는 말은 쓰지 않는다(급여 지급은 이 시스템 밖).
export default async function PayPage({ searchParams }: PageProps<"/pay">) {
  await requireSession();
  const raw = await searchParams;
  const storeOnly = parsePayFilter(raw, filterYears()).storeId;
  // 내 정보 › 내 근무지의 [급여명세서]로 왔으면(?from=sites&store=) 그 근무지 명세서만 모든 연도로, 맨 위 전체 합계 카드 · 칩 대신 근무지 상자,
  // 뒤로 가기는 내 근무지(근로계약서 목록과 같은 방식, 2026-11-23 사용자 지정). 하단 급여 탭으로 오면 지금 화면 그대로다.
  const site = raw.from === "sites" && storeOnly !== undefined ? storeOnly : null;
  // 연도는 받은 명세서가 있는 해만 고른다(보관 3년 안) — 고정 4년(올해 ~ 3년 전)이면 서비스 전 해가 늘 빈 목록으로 보였다(2026-11-23 사용자 지정).
  // 그래서 연도 없이 한 번 받아 화면에서 거른다. 받은 해가 없으면 올해 하나.
  const all = await getPayslips({ storeId: storeOnly });
  const years = receivedYears(
    all.items.map((p) => p.periodStartDate),
    filterYears(),
  );
  const filter = parsePayFilter(raw, years);
  const { thisMonth, stores } = all;
  const items = site === null ? all.items.filter((p) => Number(p.periodStartDate.slice(0, 4)) === filter.year) : all.items;
  const siteName =
    site === null
      ? null
      : (stores.find((x) => x.storeId === site)?.storeName ??
        (await getMyMemberships(true))?.items.find((m) => m.store.storeId === site)?.store.storeName ??
        "");
  if (site !== null)
    return (
      <PayFrame header={<PageHeader title="급여명세서" backHref="/me/memberships" />}>
        {siteName && <WorkplaceBox name={siteName} />}
        {/* 상자는 화면 남는 높이를 채운다 — 비었을 때 아래가 휑했다(2026-11-23 사용자 지정) */}
        <section className="flex flex-1 flex-col rounded-[20px] border border-staff-border-light bg-white p-[20px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-staff-text-sub">명세서</h2>
            <span className="text-[12px] text-staff-text-muted">{items.length}건</span>
          </div>
          {items.length > 0 ? (
            <PayslipRows items={items} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[40px] text-center">
              <span className="mb-[6px] flex">
                <IconTile src="/icons/payslip-line.svg" size={44} />
              </span>
              <p className="text-[17px] font-bold">이 근무지에서 받은 급여명세서가 없습니다</p>
              <p className="text-[14px] break-keep text-staff-text-sub">
                근무지에서 급여명세서를 보내면
                <br />
                여기에서 확인할 수 있습니다.
              </p>
            </div>
          )}
        </section>
      </PayFrame>
    );

  return (
    <PayFrame header={<PageHeader title="급여" backHref="/home" action={<AboutSheet />} />}>
      {stores.length > 0 ? (
        <>
          {/* 이번 달 실지급액 합계(Figma node 17:1003): 짙은 남색 · radius 24 · 안쪽 25. 남색 위 흐린 글자 #BAC7DE·#D1DAEB 는 이 카드에만 쓴다. */}
          <section aria-label="이번 달에 받은 급여명세서" className="flex flex-col rounded-[24px] bg-staff-navy p-[25px] text-white">
            <p className="text-[13px] text-[#bac7de]">{receivedMonthLabel(thisMonth.month)} 실지급액 합계</p>
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
            {/* 근무지 · 연도 고르기를 먼저, 그 아래 「명세서 N건」 — 거른 결과의 건수라 고르기 아래가 맞다(2026-11-23 사용자 지정) */}
            <PayFilter stores={stores} years={years} storeId={filter.storeId} year={filter.year} />
            <div className="flex items-center justify-between pt-[16px]">
              <h2 className="text-[13px] font-semibold text-staff-text-sub">명세서</h2>
              <span className="text-[12px] text-staff-text-muted">{items.length}건</span>
            </div>
            {items.length > 0 ? (
              <PayslipRows items={items} />
            ) : (
              <div className="flex flex-col items-center gap-[10px] pt-[24px] pb-[6px] text-center">
                {/* 처음 필터(전체 근무지 · 올해)에서 비면 지울 필터가 없다 — 1월에 지난해 12월분만 받은 경우 등. 연도를 바꾸게 한다. */}
                {filter.storeId === undefined && filter.year === years[0] ? (
                  <p className="text-[14px] text-staff-text-sub">{filter.year}년 급여 기간의 명세서가 없습니다. 연도를 바꿔 주세요.</p>
                ) : (
                  <>
                    <p className="text-[14px] text-staff-text-sub">선택한 근무지와 연도에 받은 명세서가 없습니다</p>
                    <Button variant="outline" href="/pay" replace scroll={false}>
                      전체 명세서 보기
                    </Button>
                  </>
                )}
              </div>
            )}
          </section>

          {/* 목업 grow 뒤 tiny · Figma mt-auto: 본문이 짧으면 맨 아래에 붙는다. */}
          <div className="mt-auto">
            {/* 하단 안내(2026-11-23 사용자 지정, 보관 기준은 작성일 — S-DOVWAR 「생성일로부터 3년」) */}
            <Tiny>
              급여명세서는 이메일로도 발송됩니다.
              <br />
              퇴직 후에도 <b>작성일로부터 3년간</b> 확인할 수 있으며, 계정 탈퇴 시에는 확인할 수 없습니다.
            </Tiny>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">
          <span className="mb-[6px] flex">
            <IconTile src="/icons/payslip-line.svg" size={44} />
          </span>
          <p className="text-[18px] font-bold">받은 급여명세서가 없습니다</p>
          <p className="text-[14px] break-keep text-staff-text-sub">
            근무지에서 급여명세서를 보내면
            <br />
            여기에서 확인할 수 있습니다.
          </p>
        </div>
      )}
    </PayFrame>
  );
}

/** 명세서 줄 — 급여 탭 · 내 근무지에서 온 근무지 목록이 같이 쓴다 */
function PayslipRows({ items }: { items: Awaited<ReturnType<typeof getPayslips>>["items"] }) {
  return (
    <ul className="divide-y divide-staff-border-light pt-[4px]">
      {items.map((p) => (
        <li key={p.payslipId}>
          <Link
            href={`/pay/${p.payslipId}`}
            transitionTypes={["nav-forward"]}
            className="flex min-h-[44px] w-full items-center gap-[12px] py-[12px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-semibold">{monthLabel(p.periodStartDate)}</span>
              <span className="truncate pt-[2px] text-[12px] text-staff-text-sub">{rowLabel(p.storeName, p.sentAt)}</span>
            </span>
            {p.correcting || p.netPayAmount === null ? (
              // 보낸 뒤 확정을 취소해 고치는 중 — 금액은 다시 받을 때까지 보이지 않는다
              <CorrectingBadge />
            ) : (
              <span className="shrink-0 text-[13.5px] tabular-nums">{formatWon(p.netPayAmount)}원</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 「웨일카페 강남역점 · 9월 10일 받음」 — 받은 날은 api 의 sentAt(가장 최근 발송 — 다시 보냈으면 그때, 목업 7월 「8월 20일 받음」). */
function rowLabel(storeName: string, sentAt: string | null): string {
  return sentAt ? `${storeName} · ${sentDateLabel(sentAt)} 받음` : storeName;
}
