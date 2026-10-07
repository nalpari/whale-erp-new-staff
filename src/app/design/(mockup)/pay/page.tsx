import Link from "next/link";
import { BottomNav, PageHeader, StatusChip, type StatusChipTone } from "@/components/common";
import { MOCKUP_NAV } from "../mockup-nav";
import { PageSlide } from "../page-slide";

// Figma 08.급여(node 17:825). 목업 데이터: 2026년 8월분이 9월 10일에 도착한다.
// Figma 프레임에는 하단 메뉴가 없지만 급여가 하단 메뉴 칸이라, 홈·근무처럼 메뉴를 붙여 탭 사이에서 사라지지 않게 한다.
const PAST: { month: string; sent: string; amount: string; status: { label: string; tone: StatusChipTone } }[] = [
  { month: "2026년 7월", sent: "8월 3일 발송 · 8월 20일 다시 보냄", amount: "1,620,440원", status: { label: "다시 보냄", tone: "warning" } },
  { month: "2026년 6월", sent: "7월 3일 발송", amount: "1,589,730원", status: { label: "발송 완료", tone: "success" } },
  { month: "2026년 5월", sent: "6월 3일 발송", amount: "1,602,150원", status: { label: "발송 완료", tone: "success" } },
];

export default function MockupPayPage() {
  return (
    <PageSlide>
      <div className="flex flex-1 flex-col">
        <PageHeader title="급여" backHref="/design/home" />

        <main className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
          {/* 이번 달 실지급액(node 17:1003): 짙은 남색 · radius 24 · 안쪽 25. 남색 위 흐린 글자 #BAC7DE·#D1DAEB 는 이 카드에만 쓴다. */}
          <section aria-label="이번 달 급여" className="flex flex-col rounded-[24px] bg-staff-navy p-[25px] text-white">
            <p className="text-[13px] text-[#bac7de]">2026년 8월 · 실지급액</p>
            <p className="pt-[14px] pb-[16px] font-bold">
              <span className="text-[32px]">1,645,320</span>
              <span className="text-[17px]"> 원</span>
            </p>
            <div className="flex justify-between gap-[8px] border-t border-white/13 pt-[15px] text-[12px] text-[#d1daeb]">
              <span>9월 10일 도착</span>
              <Link href="#" className="shrink-0">
                명세서 확인하기 →
              </Link>
            </div>
          </section>

          <section className="flex flex-col rounded-[20px] border border-staff-border-light bg-white p-[20px]">
            <h2 className="text-[13px] font-semibold text-staff-text-sub">지난 명세서</h2>
            <ul className="divide-y divide-staff-border-light pt-[4px]">
              {PAST.map((p) => (
                <li key={p.month} className="flex items-center gap-[12px] py-[17px]">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[15px] font-semibold">{p.month}</p>
                    <p className="truncate pt-[2px] text-[12px] text-staff-text-sub">{p.sent}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-[3px]">
                    <p className="text-[13.5px]">{p.amount}</p>
                    <StatusChip tone={p.status.tone} weight="semibold">
                      {p.status.label}
                    </StatusChip>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-auto text-[12px] text-staff-text-sub">
            명세서는 이메일로도 발송됩니다.
            <br />
            이 화면에서는 퇴직 전까지 조회할 수 있습니다.
          </p>
        </main>
        <div className="sticky bottom-0">
          <BottomNav current="/design/pay" items={MOCKUP_NAV} />
        </div>
      </div>
    </PageSlide>
  );
}
