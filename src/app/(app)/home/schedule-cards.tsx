import { Alert, SectionTitle } from "@/components/common";
import { getMyWorkSchedules } from "@/lib/my-work-schedules";
import { durationLabel, kstDate, weekDates, workMinutes, type MyWorkSchedule } from "@/lib/work-schedules";
import { ThisWeek } from "./this-week";

const md = (ymd: string) => `${Number(ymd.slice(5, 7))}.${Number(ymd.slice(8, 10))}`;

// 홈 오늘의 근무 · 이번 주 근무(#313, HOME-1). 앱 전역 근무지의 근무스케줄을 근무 탭과 같은 api 로 받는다 —
// 이번 주가 두 달에 걸치면 두 달을 받아 합친다. 근무일은 시작한 날이다.
// 출퇴근 버튼 · 「근무 중」 표시는 출퇴근 기능 때 붙인다(2026-10-23 재영 — 누를 수 없는 버튼을 두지 않는다).
export async function ScheduleCards({ staffMemberId }: { staffMemberId: number }) {
  const today = kstDate(new Date());
  const week = weekDates(today);
  const months = [...new Set(week.map((d) => d.slice(0, 7)))];
  const lists = await Promise.all(months.map((m) => getMyWorkSchedules(staffMemberId, m)));
  if (lists.some((l) => !l)) return <Alert tone="warning">근무스케줄을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>;
  const items = lists.flatMap((l) => l!.items).filter((i) => week.includes(i.workDate));
  const todays = items.filter((i) => i.workDate === today);
  const workDays = new Set(items.map((i) => i.workDate)).size;
  const weekMinutes = items.reduce((sum, i) => sum + workMinutes(i), 0);

  return (
    <>
      <TodayCard items={todays} />
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

// 데모(/design/home) 「오늘의 근무」 카드 모양. #DBE5FF · #BCCFFF 는 남보라 위의 흐린 글자다.
function TodayCard({ items }: { items: MyWorkSchedule[] }) {
  if (items.length === 0)
    return (
      <section aria-label="오늘의 근무" className="flex flex-col gap-[2px] rounded-[18px] border border-staff-border-light bg-white px-[20px] py-[18px] leading-[1.5]">
        <p className="text-[15px] font-bold">오늘은 근무가 없는 날입니다</p>
        <p className="text-[12px] text-staff-text-sub">이번 주 다른 근무일은 아래에서 확인하세요</p>
      </section>
    );
  const breakMinutes = items.reduce((sum, i) => sum + i.breakMinutes, 0);
  const total = items.reduce((sum, i) => sum + workMinutes(i), 0);
  return (
    <section
      aria-label="오늘의 근무"
      className="flex flex-col gap-[4px] rounded-[18px] bg-staff-primary px-[23px] pt-[24px] pb-[23px] leading-[1.5] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"
    >
      <p className="text-[12px] text-[#dbe5ff]">오늘의 근무</p>
      {items.map((i) => (
        <p key={i.workScheduleId} className="flex h-[46px] items-center gap-[4px] text-[30px] font-bold">
          {i.startTime}
          <span className="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>
          {i.endTime}
        </p>
      ))}
      <p className="flex items-center gap-[6px] text-[12px] text-[#dbe5ff]">
        휴게 {breakMinutes}분 <span className="text-[11px]">·</span> 총 {durationLabel(total)} 근무
      </p>
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
