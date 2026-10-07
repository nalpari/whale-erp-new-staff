import Image from "next/image";
import Link from "next/link";
import { Badge, BOTTOM_NAV_ITEMS, BottomNav, InfoRow, SectionTitle } from "@/components/common";
import { PageSlide } from "../page-slide";
import { StoreTopBar } from "./store-top-bar";
import { ThisWeek } from "./this-week";

// Figma 02.Main(node 8:3). 목업이라 데이터는 고정이고, 아직 없는 화면으로 가는 링크는 # 로 둔다.
const HOME = "/design/home";
const NAV = BOTTOM_NAV_ITEMS.map((item) => ({ ...item, href: item.label === "홈" ? HOME : "#" }));

export default function MockupHomePage() {
  return (
    <PageSlide>
      <div className="flex flex-1 flex-col gap-[24px]">
        <main className="flex flex-col px-[22px] pt-[42px]">
          <StoreTopBar />

          <div className="flex flex-col gap-[5px] pt-[24px] pb-[20px] leading-[1.5]">
            <h1 className="text-[26px] font-bold">하은님, 좋은 아침이에요</h1>
            <p className="text-[12px] text-staff-text-sub">9월 10일 목요일 · 오늘도 기분 좋은 하루 되세요</p>
          </div>

          <div className="flex flex-col gap-[20px]">
            {/* 오늘의 근무(node 9:152). 홈에만 있는 카드라 공통 컴포넌트로 빼지 않는다.
                #DBE5FF·#BCCFFF 는 남보라 위의 흐린 글자, 그림자는 남보라를 옅게 깐 것이다. */}
            <section
              aria-label="오늘의 근무"
              className="flex flex-col gap-[4px] rounded-[18px] bg-staff-primary px-[23px] pt-[24px] pb-[23px] leading-[1.5] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[#dbe5ff]">오늘의 근무</p>
                <span className="flex items-center gap-[5px] rounded-[6px] bg-white/12 px-[6px] py-[4px] text-[11px]">
                  <span className="size-[5px] rounded-[2.5px] bg-white" />
                  근무 중
                </span>
              </div>
              <p className="flex h-[46px] items-center gap-[4px] text-[30px] font-bold">
                09:00
                <span className="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>
                18:00
              </p>
              <p className="flex items-center gap-[6px] pb-[15px] text-[12px] text-[#dbe5ff]">
                휴게 60분 <span className="text-[11px]">·</span> 총 8시간 근무
              </p>
              <Link
                href="/design/check-in"
                transitionTypes={["nav-forward"]}
                className="flex min-h-[48px] items-center justify-center gap-[8px] rounded-[12px] bg-white px-[18px] text-[15px] font-bold text-staff-primary transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
              >
                퇴근하기
                <Image src="/icons/arrow-right-brand.svg" alt="" width={14} height={12} />
              </Link>
            </section>

            <section className="flex flex-col gap-[13px]">
              <SectionTitle title="이번 주 근무">
                <span className="text-[14px] text-staff-text-sub">9.7 – 9.13</span>
              </SectionTitle>
              <ThisWeek />
            </section>

            <section className="flex flex-col gap-[12px]">
              <SectionTitle title="오늘 할 일" count={1}>
                <Link href="#" className="flex items-center text-[12px] text-staff-text-sub">
                  전체 보기
                  <Image src="/icons/chevron-right-small.svg" alt="" width={11} height={11} className="-scale-y-100" />
                </Link>
              </SectionTitle>
              <Link
                href="#"
                className="flex items-center gap-[12px] rounded-[18px] border border-staff-border-light bg-white px-[16px] py-[14px] leading-[1.5] transition-colors duration-150 ease-out active:bg-staff-info-bg"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="truncate text-[14px] font-semibold">유통기한 라벨 점검</span>
                  <span className="truncate text-[12px] text-staff-text-sub">오늘 20:00까지 · 매장 공통</span>
                </span>
                <Badge tone="progress">예정</Badge>
              </Link>
            </section>

            <section className="flex flex-col gap-[12px]">
              <SectionTitle title="나의 근무 정보" />
              <InfoRow href="#" icon="/icons/menu-payslip.svg" title="급여명세서" description="8월 명세서가 도착했어요" />
              <InfoRow href="/design/attendance" icon="/icons/menu-attendance.svg" title="출퇴근 기록" description="이번 달 출근 9회" />
              <InfoRow href="#" icon="/icons/menu-schedule.svg" title="근무 스케줄" description="이번 달 근무 12회" />
            </section>
          </div>
        </main>

        {/* 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다. */}
        <div className="sticky bottom-0 mt-auto">
          <BottomNav current={HOME} items={NAV} />
        </div>
      </div>
    </PageSlide>
  );
}
