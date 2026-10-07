import Image from "next/image";
import Link from "next/link";
import { Button, PageHeader } from "@/components/common";
import { LocationMap } from "./location-map";

// Figma 04.출퇴근(node 12:756) — GPS 출근 화면. 목업이라 위치·시각은 고정이고 출근하면 홈으로 돌아간다.
const HOME = "/design/home";

export default function MockupCheckInPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="출퇴근"
        backHref={HOME}
        action={
          <Link href="#" aria-label="출퇴근 기록" className="flex size-[24px] shrink-0 items-center justify-center">
            <Image src="/icons/history.svg" alt="" width={21} height={21} className="-scale-y-100" />
          </Link>
        }
      />

      <main className="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[14px] leading-[1.5]">
        <LocationMap caption="오차 ±12m · 매장까지 18m" />

        {/* 근무지(node 12:957): 연한 남보라 바탕(#EEF2FF · #DCE4FF 테두리)은 주간 날짜 칸과 같은 짝이다. */}
        <section className="flex items-center gap-[8px] rounded-[18px] border border-[#dce4ff] bg-[#eef2ff] p-[20px]">
          <Image src="/icons/pin.svg" alt="" width={14} height={16} className="-scale-y-100" />
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <p className="truncate text-[16px] font-bold">웨일카페 강남역점</p>
            <p className="text-[12px] text-staff-primary">매장 범위 안에 있습니다</p>
          </div>
        </section>

        <section className="flex flex-col gap-[7px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
          <h2 className="text-[13px] font-semibold text-staff-text-sub">오늘 예정 근무</h2>
          <div className="flex items-center gap-[8px]">
            <p className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.42px]">09:00 – 18:00</p>
            <span className="rounded-[8px] bg-staff-info-bg px-[10px] py-[4px] text-[12px] font-semibold text-staff-text-sub">휴게 60분</span>
          </div>
        </section>

        <section className="flex flex-col items-center py-[14px] text-center">
          <h2 className="text-[13px] font-semibold text-staff-text-sub">현재 시각</h2>
          <p className="text-[42px] leading-[1.1] font-bold">08:52</p>
          <p className="pt-[30px] text-[12px] text-staff-text-sub">출근 버튼을 누르면 기록을 확인할 수 있어요</p>
        </section>
      </main>

      {/* 버튼 줄(node 12:989): 로그인 화면과 같이 고정하지 않고, 화면이 길면 맨 아래에 놓인다. */}
      <div className="mt-auto bg-white px-[30px] pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))]">
        <Button href={HOME}>
          출근하기
          <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
        </Button>
      </div>
    </div>
  );
}
