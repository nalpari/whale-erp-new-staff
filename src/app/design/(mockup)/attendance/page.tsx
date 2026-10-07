import Image from "next/image";
import Link from "next/link";
import { AttendanceDayCard, DayOffRow, PageHeader } from "@/components/common";
import { PageSlide } from "../page-slide";
import { PeriodTabs } from "./period-tabs";

// Figma 05.출퇴근 현황(node 12:1233). 목업 데이터: 2026년 9월 둘째 주, 오늘은 10일(목) 14시 무렵.
const STORE = "웨일카페 강남역점";

export default function MockupAttendancePage() {
  return (
    <PageSlide>
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="출퇴근 현황"
          backHref="/design/home"
          action={
            <Link href="#" aria-label="출퇴근 기록" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
              <Image src="/icons/history.svg" alt="" width={21} height={21} className="-scale-y-100" />
            </Link>
          }
        />

        <main className="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[14px]">
          <PeriodTabs />

          <div className="flex flex-col gap-[8px]">
            <DayOffRow label="월 9/7 · 휴무" />
            <AttendanceDayCard
              state="done"
              day="화 9/8"
              store={STORE}
              status={{ label: "정상", tone: "success" }}
              schedule={{ start: "09:00", end: "18:00" }}
              worked={{ start: "08:50", end: "18:00" }}
              summary="출근 08:58 · 퇴근 18:00"
            />
            <AttendanceDayCard
              state="done"
              day="수 9/9"
              store={STORE}
              edited
              status={{ label: "지각 14분", tone: "warning" }}
              schedule={{ start: "09:00", end: "18:00" }}
              worked={{ start: "08:50", end: "18:00" }}
              summary="출근 08:58 · 퇴근 18:00"
            />
            <AttendanceDayCard
              state="today"
              day="목 9/10"
              store={STORE}
              status={{ label: "근무 중", tone: "working" }}
              schedule={{ start: "09:00", end: "18:00" }}
              worked={{ start: "09:05", end: "14:00" }}
              ongoing
              summary="출근 09:02 · 퇴근 진행 중"
            />
            <AttendanceDayCard
              state="upcoming"
              day="금 9/11"
              store={STORE}
              schedule={{ start: "09:00", end: "18:00" }}
              summary="아직 근무 전입니다 · 예정 09:00 – 18:00"
            />
            <AttendanceDayCard
              state="upcoming"
              day="토 9/12"
              store={STORE}
              schedule={{ start: "13:00", end: "22:00" }}
              summary="아직 근무 전입니다 · 예정 13:00 – 22:00"
            />
            <DayOffRow label="일 9/13 · 휴무" />
          </div>
        </main>
      </div>
    </PageSlide>
  );
}
