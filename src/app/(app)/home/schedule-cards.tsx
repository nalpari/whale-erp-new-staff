import Image from "next/image";
import Link from "next/link";
import { Alert, Button, SectionTitle } from "@/components/common";
import { homeAttendanceAction, type HomeAttendanceAction } from "@/lib/attendance-rules";
import { getMyAttendance } from "@/lib/my-attendance";
import { getMyWorkSchedules } from "@/lib/my-work-schedules";
import { durationLabel, kstDate, weekDates, workMinutes, type MyWorkSchedule } from "@/lib/work-schedules";
import { ThisWeek } from "./this-week";

const md = (ymd: string) => `${Number(ymd.slice(5, 7))}.${Number(ymd.slice(8, 10))}`;

// 홈 오늘의 근무 · 이번 주 근무(#313, HOME-1). 앱 전역 근무지의 근무스케줄을 근무 탭과 같은 api 로 받는다 —
// 이번 주가 두 달에 걸치면 두 달을 받아 합친다. 근무일은 시작한 날이다.
// 출퇴근은 오늘 근무 카드 안에서 시작한다(HOME-3) — 출근 전이면 출근하기, 근무 중이면 「근무 중」과 퇴근하기, 누르면 출퇴근 화면.
// 등록은 출퇴근 화면에서 한다(홈에서는 위치를 읽지 않는다, ATT-22). 등록할 수 없는 상태면 버튼을 두지 않는다(homeAttendanceAction).
// 출퇴근 상태를 못 받으면 버튼만 뺀다 — 근무 카드는 그대로.
export async function ScheduleCards({ staffMemberId }: { staffMemberId: number }) {
  const today = kstDate(new Date());
  const week = weekDates(today);
  const months = [...new Set(week.map((d) => d.slice(0, 7)))];
  const [lists, attendance] = await Promise.all([Promise.all(months.map((m) => getMyWorkSchedules(staffMemberId, m))), getMyAttendance(staffMemberId)]);
  if (lists.some((l) => !l)) return <Alert tone="warning">근무스케줄을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>;
  const items = lists.flatMap((l) => l!.items).filter((i) => week.includes(i.workDate));
  const todays = items.filter((i) => i.workDate === today);
  const workDays = new Set(items.map((i) => i.workDate)).size;
  const weekMinutes = items.reduce((sum, i) => sum + workMinutes(i), 0);

  return (
    <>
      <TodayCard items={todays} action={attendance && homeAttendanceAction(attendance, todays.length > 0)} />
      <section className="flex flex-col gap-[13px]">
        <SectionTitle title="이번 주 근무">
          <span className="text-[14px] text-staff-text-sub">
            {md(week[0])} – {md(week[6])}
          </span>
        </SectionTitle>
        <ThisWeek week={week} today={today} items={items}>
          {workDays === 0 ? (
            "이번 주 등록된 근무가 없습니다"
          ) : (
            <>
              이번 주{" "}
              <b className="font-semibold">
                {workDays}일 · {durationLabel(weekMinutes)}
              </b>{" "}
              근무 예정
            </>
          )}
        </ThisWeek>
      </section>
    </>
  );
}

// 데모(/design/home) 「근무 중」 표시와 출퇴근 버튼(흰 바탕 · 남보라 글자)
const WORKING = (
  <span className="flex items-center gap-[5px] rounded-[6px] bg-white/12 px-[6px] py-[4px] text-[11px]">
    <span className="size-[5px] rounded-[2.5px] bg-white" />
    근무 중
  </span>
);
function AttendanceButton({ action }: { action: Exclude<HomeAttendanceAction, null> }) {
  return (
    <Link
      href="/check-in"
      transitionTypes={["nav-forward"]}
      className="flex min-h-[48px] items-center justify-center gap-[8px] rounded-[12px] bg-white px-[18px] text-[15px] font-bold text-staff-primary transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
    >
      {action === "check-in" ? "출근하기" : "퇴근하기"}
      <Image src="/icons/arrow-right-brand.svg" alt="" width={14} height={12} />
    </Link>
  );
}

// 데모(/design/home) 「오늘의 근무」 카드 모양. #DBE5FF · #BCCFFF 는 남보라 위의 흐린 글자다.
function TodayCard({ items, action }: { items: MyWorkSchedule[]; action: HomeAttendanceAction }) {
  if (items.length === 0)
    return (
      <section aria-label="오늘의 근무" className="flex flex-col gap-[2px] rounded-[18px] border border-staff-border-light bg-white px-[20px] py-[18px] leading-[1.5]">
        <p className="text-[15px] font-bold">오늘은 근무가 없는 날입니다</p>
        <p className="text-[12px] text-staff-text-sub">이번 주 다른 근무일은 아래에서 확인하세요</p>
        {/* 어제 시작해 자정을 넘긴 근무처럼 오늘 근무스케줄 없이 출근이 열려 있으면 퇴근은 여기서 */}
        {action === "check-out" && (
          <div className="pt-[12px]">
            <Button href="/check-in" transitionTypes={["nav-forward"]}>
              퇴근하기
              <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
            </Button>
          </div>
        )}
      </section>
    );
  const breakMinutes = items.reduce((sum, i) => sum + i.breakMinutes, 0);
  const total = items.reduce((sum, i) => sum + workMinutes(i), 0);
  return (
    <section
      aria-label="오늘의 근무"
      className="flex flex-col gap-[4px] rounded-[18px] bg-staff-primary px-[23px] pt-[24px] pb-[23px] leading-[1.5] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#dbe5ff]">오늘의 근무</p>
        {action === "check-out" && WORKING}
      </div>
      {items.map((i) => (
        <p key={i.workScheduleId} className="flex h-[46px] items-center gap-[4px] text-[30px] font-bold">
          {i.startTime}
          <span className="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>
          {i.endTime}
        </p>
      ))}
      <p className={`flex items-center gap-[6px] text-[12px] text-[#dbe5ff] ${action ? "pb-[15px]" : ""}`}>
        휴게 {breakMinutes}분 <span className="text-[11px]">·</span> 총 {durationLabel(total)} 근무
      </p>
      {action && <AttendanceButton action={action} />}
    </section>
  );
}

/** 불러오는 동안 근무 카드 자리 */
export function ScheduleCardsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-[20px]">
      <div className="h-[150px] animate-pulse rounded-[18px] bg-staff-primary-inactive" />
      <div className="h-[24px] w-[120px] animate-pulse rounded-[8px] bg-staff-border-light" />
      <div className="h-[150px] animate-pulse rounded-[18px] bg-staff-border-light" />
    </div>
  );
}
