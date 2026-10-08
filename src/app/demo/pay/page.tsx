"use client";

// 직원 근무 앱 데모 · 급여(/demo/pay). 기준 목업: docs/mockup/app/pay.html — 상태 4개(목록 · 상세 · 다시 보낸 명세서 · 빈 상태)와
// 시트 1개(급여명세서 안내), 화면 문구·가짜 값·버튼 이동(data-go)·알림(data-toast)을 옮겼다. 금액은 목업 그대로다.
// 확정 쟁점: PAY-1 다시 보낸 명세서는 최신 값으로 덮고 이전 금액은 보이지 않는다 — 바뀐 줄은 「· 정정됨」 꼬리표만, 상세에 처리 이력
//   (발송·확정 취소만, 두 번째 발송은 「재발송」, 관리자 이름 없음) · PAY-2 상세에서만 명세서 내보내기(목록에는 버튼 없음) ·
//   PAY-3 연장수당은 한 줄 계산식 · PAY-4 퇴직한 뒤에도 급여 탭에서 3년 동안 조회.
// 노무·세무 확인 대기: PAY-5(주휴·연장 계산식) · PAY-6(파트타이머 3.3% 원천징수 — 기본 공제의 소득세·지방소득세 대신)는 목업의 예시 금액 그대로.
// PAY-7(3.3% 끝자리 처리, 미정 · 세무 확인 대기, 2026-10-08)은 3.3% 원천징수 줄에 작은 글자로 붙이고 금액은 목업처럼 10원 단위 반올림 값 그대로다.
// 이 화면에 「입금」이라는 말은 쓰지 않는다(급여 지급은 이 시스템의 범위 밖).
// 목록은 Figma 08.급여(node 17:825 · 실지급액 카드 17:1003)를 따르되 문구·금액은 목업이다 — Figma 의 「도착」은 입금으로 읽혀 목업의 「발송」으로,
// 「퇴직 전까지 조회」는 PAY-4 로 바뀐 목업 문구로 바꿨다. 7월 줄은 목업처럼 상태 칩 없이 둔다(Figma 는 「다시 보냄」 칩).
// 상세 · 다시 보낸 명세서 · 빈 상태 · 안내 시트는 Figma 없음 — DESIGN.md 기준 초안. 상세의 실지급액은 목록과 같은 짙은 남색 카드다.
// 하단 메뉴는 목업처럼 다섯 칸이다(2026-10-08 재영 결정, Figma 는 네 칸).
import Image from "next/image";
import { useState } from "react";
import { Badge, BottomNav, BottomSheet, Button, Card, HeroCard, Notice, PageHeader } from "@/components/common";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { BackHeader, Body, DEMO_NAV_ITEMS, DemoStates, Tiny, useDemoState, useToast } from "../_components";

// 목업 오른쪽 목록 순서 그대로. 마지막은 목업의 「시트 열기」라 목록 위에 시트를 띄운다.
const STATES = [
  { id: "list", label: "목록", note: "기본 화면" },
  { id: "detail", label: "상세", note: "지급·공제·실지급액" },
  { id: "resent", label: "다시 보낸 명세서", note: "확정 취소 후 정정" },
  { id: "empty", label: "빈 상태", note: "발송된 것 없음" },
  { id: "about", label: "급여명세서 안내", note: "계산 주체 설명" },
];

const HOME = "/demo/home";

// 목업 지난 명세서. 6월·5월도 목업처럼 8월 상세로 간다.
const PAST = [
  { month: "2026년 7월", sent: "8월 20일 발송", amount: "835,430원", to: "resent", sentBadge: false },
  { month: "2026년 6월", sent: "7월 3일 발송", amount: "745,340원", to: "detail", sentBadge: true },
  { month: "2026년 5월", sent: "6월 3일 발송", amount: "889,490원", to: "detail", sentBadge: true },
];

// 명세서 한 장. amount 가 null 이면 계산 대상이 아니라 「해당 없음」이다(0원이 아니다). 합계·실지급액은 줄에서 더한다.
type Line = { name: string; sub?: string; amount: number | null; corrected?: boolean };
type Payslip = { period: string; meta: string; sent: boolean; earnings: Line[]; deductions: Line[]; history: [string, string][] };

// 파트타이머 · 시급 10,320원 · 수·금·토 10:00~15:30(휴게 30분) 주 15시간. 공제는 4대보험 네 줄 + 3.3% 원천징수(PAY-6).
const PAYSLIPS: Record<"detail" | "resent", Payslip> = {
  detail: {
    period: "2026년 8월 1일 – 8월 31일",
    meta: "웨일카페 강남역점 · 파트타이머 · 9월 10일 발송",
    sent: true,
    earnings: [
      { name: "기본급", sub: "65시간 × 10,320원", amount: 670_800 },
      { name: "주휴수당", sub: "주 15시간 이상 · 개근 · 4주", amount: 123_840 },
      { name: "연장수당", sub: "8월 22일(토) 9시간 근무 · 소정 5시간 초과 4.0시간 × 1.5배", amount: 61_920 },
      { name: "식대", sub: "비과세", amount: 100_000 },
    ],
    deductions: [
      { name: "국민연금", amount: 38_550 },
      { name: "건강보험", amount: 30_370 },
      { name: "장기요양보험", amount: 3_930 },
      { name: "고용보험", amount: 7_710 },
      { name: "3.3% 원천징수", sub: "끝자리 세무 확인 대기(PAY-7)", amount: 31_570 },
    ],
    history: [["09-10 09:12", "발송"]],
  },
  resent: {
    period: "2026년 7월 1일 – 7월 31일",
    meta: "웨일카페 강남역점 · 파트타이머",
    sent: false,
    earnings: [
      { name: "기본급", sub: "70시간 × 10,320원", amount: 722_400 },
      { name: "주휴수당", sub: "주 15시간 이상 · 개근 · 4주", amount: 123_840 },
      { name: "연장수당", sub: "소정근로시간을 넘긴 날 없음", amount: null, corrected: true },
      { name: "식대", sub: "비과세", amount: 100_000 },
    ],
    deductions: [
      { name: "국민연금", amount: 38_080 },
      { name: "건강보험", amount: 30_000 },
      { name: "장기요양보험", amount: 3_880 },
      { name: "고용보험", amount: 7_620 },
      { name: "3.3% 원천징수", sub: "끝자리 세무 확인 대기(PAY-7)", amount: 31_230 },
    ],
    history: [
      ["08-20 10:05", "재발송"],
      ["08-19 17:40", "확정 취소"],
      ["08-03 09:12", "발송"],
    ],
  },
};

const won = (n: number) => n.toLocaleString("ko-KR");
const sum = (lines: Line[]) => lines.reduce((total, l) => total + (l.amount ?? 0), 0);

export default function DemoPayPage() {
  const [state, move] = useDemoState(STATES);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useToast();

  const view = state === "about" ? "list" : state;

  const handleSheetClose = () => {
    setSheetOpen(false);
    if (state === "about") move("list", "nav-back");
  };
  const handleBack = () => move("list", "nav-back");
  const handleExport = () => setToast("처리 완료본 PDF 를 공유합니다");

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <div className="flex flex-1 flex-col">
        <PageSlide key={view}>
          <main className="flex flex-1 flex-col leading-[1.5]">
            {(view === "list" || view === "empty") && (
              <PageHeader
                title="급여"
                backHref={HOME}
                action={
                  <button type="button" onClick={() => setSheetOpen(true)} aria-label="급여명세서 안내" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
                    <InfoIcon />
                  </button>
                }
              />
            )}
            {(view === "detail" || view === "resent") && <BackHeader title="급여명세서" onBack={handleBack} />}

            {view === "list" && (
              <Body variant="detail">
                {/* 이번 달 실지급액(Figma node 17:1003): 짙은 남색 · radius 24 · 안쪽 25. 남색 위 흐린 글자 #BAC7DE·#D1DAEB 는 이 카드에만 쓴다(/design/pay 그대로). */}
                <section aria-label="이번 달 급여명세서" className="flex flex-col rounded-[24px] bg-staff-navy p-[25px] text-white">
                  <p className="text-[13px] text-[#bac7de]">2026년 8월 급여명세서 · 실지급액</p>
                  <p className="pt-[14px] pb-[16px] font-bold">
                    <span className="text-[32px]">844,430</span>
                    <span className="text-[17px]"> 원</span>
                  </p>
                  <div className="flex justify-between gap-[8px] border-t border-white/13 pt-[15px] text-[12px] text-[#d1daeb]">
                    <span>9월 10일 발송</span>
                    <button type="button" onClick={() => move("detail")} className="-my-[13px] flex min-h-[44px] shrink-0 items-center">
                      명세서 확인하기 →
                    </button>
                  </div>
                </section>

                <section className="flex flex-col rounded-[20px] border border-staff-border-light bg-white p-[20px]">
                  <h2 className="text-[13px] font-semibold text-staff-text-sub">지난 명세서</h2>
                  <ul className="divide-y divide-staff-border-light pt-[4px]">
                    {PAST.map((p) => (
                      <li key={p.month}>
                        <button
                          type="button"
                          onClick={() => move(p.to)}
                          className="flex min-h-[44px] w-full items-center gap-[12px] py-[17px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[15px] font-semibold">{p.month}</span>
                            <span className="truncate pt-[2px] text-[12px] text-staff-text-sub">{p.sent}</span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-[3px]">
                            <span className="text-[13.5px] tabular-nums">{p.amount}</span>
                            {p.sentBadge && <Badge tone="success">발송 완료</Badge>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* 목업 grow 뒤 tiny · Figma mt-auto: 본문이 짧으면 맨 아래에 붙는다. */}
                <div className="mt-auto">
                  <Tiny>
                    명세서는 이메일로도 발송됩니다. <b>퇴직한 뒤에도 이 급여 탭에서</b> 조회할 수 있고, 보존 기간인 3년 동안 볼 수 있습니다.
                  </Tiny>
                </div>
              </Body>
            )}

            {view === "detail" && (
              <Body variant="detail">
                <PayslipView payslip={PAYSLIPS.detail} onExport={handleExport} />
                <Tiny>급여 지급은 이 화면에서 처리하지 않습니다. 실제 지급은 회사의 지급 절차를 따릅니다.</Tiny>
              </Body>
            )}

            {view === "resent" && (
              <Body variant="detail">
                {/* 목업 note--amber. 상태 칩 지각·긴급 색(#FFF6E5 · #956013). 다시 보낸 사유는 이 안내가 맡고 처리 이력에는 적지 않는다(PAY-1). */}
                <p className="rounded-[12px] bg-[#fff6e5] p-[14px] text-[13px] font-bold text-[#956013]">8월 20일 다시 발송되었습니다.</p>
                <PayslipView payslip={PAYSLIPS.resent} onExport={handleExport} />
              </Body>
            )}

            {view === "empty" && (
              <Body variant="detail">
                <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">
                  <Image src="/icons/menu-payslip.svg" alt="" width={44} height={44} className="mb-[6px]" />
                  <p className="text-[18px] font-bold">아직 받은 명세서가 없습니다</p>
                  <p className="max-w-[230px] text-[13px] text-staff-text-sub">급여명세서는 관리자가 확정해 발송한 뒤에만 이 화면에 나타납니다.</p>
                </div>
              </Body>
            )}
          </main>
        </PageSlide>

        {/* 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다(/design/pay 그대로). */}
        <div className="sticky bottom-0 mt-auto">
          <BottomNav current="/demo/pay" items={DEMO_NAV_ITEMS} />
        </div>
      </div>

      <BottomSheet open={sheetOpen || state === "about"} onClose={handleSheetClose} title="급여명세서는 이렇게 만들어집니다">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          <strong>기본급·주휴수당·연장수당</strong>은 근로계약과 출퇴근 기록으로 시스템이 계산하고 관리자가 확인합니다.{" "}
          <strong>나머지 지급 항목과 공제 항목은 관리자가 직접 넣습니다.</strong> 요율이 해마다 바뀌거나 사람이 판단할 값이기 때문입니다.
        </p>
        <Notice icon={<InfoIcon size={16} />}>급여 지급(입금)은 이 앱이 처리하지 않습니다. 명세서 데이터는 생성일로부터 3년간 보관됩니다.</Notice>
      </BottomSheet>

      {toast}
    </>
  );
}

// 상세와 다시 보낸 명세서가 같이 쓰는 본문: 급여 기간 · 지급 항목 · 공제 항목 · 실지급액 · 처리 이력 · 내보내기(PAY-2).
function PayslipView({ payslip, onExport }: { payslip: Payslip; onExport: () => void }) {
  const earningsTotal = sum(payslip.earnings);
  const deductionsTotal = sum(payslip.deductions);
  return (
    <>
      {/* 목업 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. */}
      <section className="flex flex-col gap-[8px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <p className="text-[13px] font-semibold text-staff-text-sub">급여 기간</p>
            <p className="text-[16px] font-bold">{payslip.period}</p>
          </div>
          {payslip.sent && <Badge tone="success">발송 완료</Badge>}
        </div>
        <p className="text-[12px] text-staff-text-muted">{payslip.meta}</p>
      </section>

      <PayTable head="지급 항목" lines={payslip.earnings} totalLabel="지급 합계" total={earningsTotal} />
      <PayTable head="공제 항목" lines={payslip.deductions} totalLabel="공제 합계" total={deductionsTotal} />

      {/* 실지급액: 목록의 이번 달 카드와 같은 짙은 남색(DESIGN.md — 급여 화면에서 가장 먼저 볼 숫자). */}
      <HeroCard tone="navy">
        <div className="flex items-center justify-between gap-[12px]">
          <p className="text-[18px] font-bold">실지급액</p>
          <p className="font-bold tabular-nums">
            <span className="text-[28px]">{won(earningsTotal - deductionsTotal)}</span>
            <span className="text-[17px]"> 원</span>
          </p>
        </div>
      </HeroCard>

      {/* PAY-1: 시각과 짧은 꼬리표만. 관리자 이름은 적지 않는다. 최근 것이 위. */}
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">처리 이력</p>
        <ul className="flex flex-col gap-[4px] pt-[8px] text-[12px] text-staff-text-muted">
          {payslip.history.map(([at, kind]) => (
            <li key={at}>
              <span className="tabular-nums">{at}</span> · {kind}
            </li>
          ))}
        </ul>
      </Card>

      <Button variant="outline" onClick={onExport}>
        명세서 내보내기
      </Button>
    </>
  );
}

// 목업 table.pay: 항목 이름 아래 계산 근거를 작은 글자로 붙인다(PAY-3). 「해당 없음」은 흐린 글자, 바뀐 줄은 「· 정정됨」 꼬리표(PAY-1).
function PayTable({ head, lines, totalLabel, total }: { head: string; lines: Line[]; totalLabel: string; total: number }) {
  return (
    <Card>
      <table className="w-full text-[14px]">
        <thead>
          <tr className="text-[13px] font-semibold text-staff-text-sub">
            <th className="pb-[8px] text-left font-semibold">{head}</th>
            <th className="pb-[8px] text-right font-semibold">금액</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.name} className="border-t border-staff-border-light align-top">
              <td className="py-[10px] pr-[12px]">
                {l.name}
                {(l.sub || l.corrected) && (
                  <span className="block text-[12px] break-keep text-staff-text-muted">
                    {l.sub}
                    {/* 정정된 줄 표시: 상태 칩 지각·긴급 글자색(#956013) — 위쪽 다시 발송 안내와 같은 색. */}
                    {l.corrected && <span className="font-semibold text-[#956013]"> · 정정됨</span>}
                  </span>
                )}
              </td>
              <td className={`py-[10px] text-right whitespace-nowrap tabular-nums ${l.amount === null ? "text-staff-text-muted" : ""}`}>
                {l.amount === null ? "해당 없음" : won(l.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-staff-border font-bold">
            <td className="pt-[10px]">{totalLabel}</td>
            <td className="pt-[10px] text-right tabular-nums">{won(total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

// 목업 abar 의 안내 아이콘(ph-info). public/icons 에 없어 원 안의 i 를 직접 그린다. 보조 글자색.
function InfoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="text-staff-text-sub">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </svg>
  );
}
