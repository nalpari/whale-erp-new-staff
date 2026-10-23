import { InfoRow, SectionTitle } from "@/components/common";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import { getMyWorkSchedules } from "@/lib/my-work-schedules";
import { getPayslips } from "@/lib/payslips";
import { kstDate } from "@/lib/work-schedules";

/** 가장 최근 명세서의 달, 받은 명세서가 없으면 null. 못 받으면 undefined — 바로가기 줄 하나 때문에 홈을 오류로 만들지 않고 설명만 뺀다 */
async function latestPayslipMonth(): Promise<number | null | undefined> {
  try {
    const latest = (await getPayslips()).items[0];
    return latest ? Number(latest.periodStartDate.slice(5, 7)) : null;
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다. 401 의 만료 안내 redirect 등 그 밖은 던진다.
    if (error instanceof ApiError && error.status < 500) logUnexpected("home-payslips", error);
    if (error instanceof NetworkError || error instanceof ApiError) return undefined;
    throw error;
  }
}

// 데모 「나의 근무 정보」(Figma node 9:345) 바로가기. 급여명세서는 모든 근무지 것(PAY-8), 근무 스케줄은 고른 근무지의 이번 달 횟수.
// 출퇴근 기록 줄은 출퇴근 화면이 생길 때 붙인다(2026-10-23 재영). 근무지가 없으면 급여명세서 줄만 둔다(HOME-5).
export async function MyWorkInfo({ staffMemberId }: { staffMemberId?: number }) {
  const month = kstDate(new Date()).slice(0, 7);
  const [payMonth, schedules] = await Promise.all([
    latestPayslipMonth(),
    staffMemberId ? getMyWorkSchedules(staffMemberId, month) : null,
  ]);
  return (
    <section className="flex flex-col gap-[12px]">
      <SectionTitle title="나의 근무 정보" />
      <InfoRow
        href="/pay"
        icon="/icons/menu-payslip.svg"
        title="급여명세서"
        description={payMonth === undefined ? undefined : payMonth === null ? "받은 급여명세서가 없습니다" : `${payMonth}월 명세서가 도착했어요`}
      />
      {staffMemberId && (
        <InfoRow
          href="/work"
          icon="/icons/menu-schedule.svg"
          title="근무스케줄"
          description={schedules ? `이번 달 근무 ${schedules.items.length}회` : undefined}
        />
      )}
    </section>
  );
}
