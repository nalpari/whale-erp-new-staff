import Image from "next/image";
import Link from "next/link";
import { Alert, Button, MaskIcon, SectionTitle } from "@/components/common";
import { homeAttendanceAction, type HomeAttendanceAction } from "@/lib/attendance-rules";
import { getMyAttendance } from "@/lib/my-attendance";
import { getMyWorkSchedules } from "@/lib/my-work-schedules";
import { dayTitle, durationLabel, kstDate, weekDates, workMinutes, type MyWorkSchedule } from "@/lib/work-schedules";
import { ThisWeek } from "./this-week";

// 홈 오늘 근무 · 이번 주 근무(#313, HOME-1). 앱 전역 근무지의 근무스케줄을 근무 탭과 같은 api 로 받는다 —
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
  // 휴무 카드의 「다음 근무」 — 이번 주 안에서 오늘 뒤 첫 근무(이번 주 근무스케줄만 받으므로 다음 주 근무는 보이지 않는다)
  const next = items
    .filter((i) => i.workDate > today)
    .sort((a, b) => a.workDate.localeCompare(b.workDate) || a.startTime.localeCompare(b.startTime))[0];

  return (
    <>
      <TodayCard items={todays} next={next} action={attendance && homeAttendanceAction(attendance, todays.length > 0)} />
      <section className="flex flex-col gap-[12px]">
        {/* 날짜 범위 대신 「전체 보기 ›」 — 다음 주 근무로 가는 길이 홈에 없었다. 근무 탭 달력의 오늘로 간다. TO-DO 「전체 보기」와 같은 모양(2026-11-24 사용자 지정) */}
        <SectionTitle title="이번 주 근무">
          <Link
            href={`/work?month=${today.slice(0, 7)}&day=${today}`}
            transitionTypes={["nav-forward"]}
            className="-my-[13px] flex min-h-[44px] items-center text-[12px] text-staff-text-sub"
          >
            전체 보기
            <Image src="/icons/chevron-right-small.svg" alt="" width={11} height={11} className="-scale-y-100" />
          </Link>
        </SectionTitle>
        {/* 근무가 있는 주의 요약 줄(N일 · H시간)은 데모 home 처럼 두지 않는다 — 빈 주의 안내만 둔다 */}
        <ThisWeek week={week} today={today} items={items}>
          {items.length === 0 ? "이번 주에 등록된 근무가 없습니다." : null}
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

// 데모(/design/home) 「오늘 근무」 카드 모양. #DBE5FF · #BCCFFF 는 남보라 위의 흐린 글자다.
function TodayCard({ items, next, action }: { items: MyWorkSchedule[]; next?: MyWorkSchedule; action: HomeAttendanceAction }) {
  if (items.length === 0)
    return (
      // 기존 모양(굵은 한 줄 + 다음 근무)에 왼쪽 달력 칸만 더했다 — 칸 색은 「이번 주 근무」 날짜 칸과 같은 옅은 남보라 · 남보라 그림이라 홈 색감이 이어진다(2026-11-24 사용자 지정)
      <section aria-label="오늘 근무" className="flex flex-col gap-[12px] rounded-[18px] border border-staff-border-light bg-white px-[19px] py-[17px] leading-[1.5]">
        <div className="flex items-center gap-[12px]">
          <span aria-hidden className="flex size-[40px] shrink-0 items-center justify-center rounded-[13px] bg-[#eef2ff] text-staff-primary">
            <MaskIcon src="/icons/calendar-line.svg" size={22} />
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="text-[15px] font-bold">오늘은 휴무입니다</p>
            {next && (
              <p className="text-[12px] text-staff-text-sub">
                다음 근무 · {dayTitle(next.workDate)} {next.startTime} – {next.endTime}
              </p>
            )}
          </div>
        </div>
        {/* 어제 시작해 자정을 넘긴 근무처럼 오늘 근무스케줄 없이 출근이 열려 있으면 퇴근은 여기서 */}
        {action === "check-out" && (
          <Button href="/check-in" transitionTypes={["nav-forward"]}>
            퇴근하기
            <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
          </Button>
        )}
      </section>
    );
  const breakMinutes = items.reduce((sum, i) => sum + i.breakMinutes, 0);
  const total = items.reduce((sum, i) => sum + workMinutes(i), 0);
  return (
    <section
      aria-label="오늘 근무"
      // 안쪽 위 · 아래 · 좌우 20(24 는 넓기만 했다). 시각과 「근로 · 휴게」 줄은 한 묶음으로 붙이고, 머리 줄 → 시각은 글자 기준 12, 묶음 → 버튼은 16 —
      // 큰 시각 글자는 위아래 여백이 있어 상자 간격이 아니라 보이는 글자 기준으로 맞췄다(2026-11-24 사용자 지정)
      className="flex flex-col rounded-[18px] bg-staff-primary p-[20px] leading-[1.5] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#dbe5ff]">오늘 근무</p>
        {action === "check-out" && WORKING}
      </div>
      <div className="flex flex-col pt-[6px]">
        {items.map((i) => (
          <p key={i.workScheduleId} className="flex items-center gap-[4px] text-[30px] leading-[1.15] font-bold">
            {i.startTime}
            <span className="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>
            {i.endTime}
          </p>
        ))}
        <p className="flex items-center gap-[6px] text-[12px] text-[#dbe5ff]">
          {/* 휴게를 뺀 시간이라 「근로」(근로기준법 제50조 · 출퇴근 현황 「근로시간」과 같은 말, 2026-11-24 사용자 지정) */}
          근로 {durationLabel(total)} <span className="text-[11px]">·</span> 휴게 {breakMinutes}분
        </p>
      </div>
      {action && (
        <div className="pt-[14px]">
          <AttendanceButton action={action} />
        </div>
      )}
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
