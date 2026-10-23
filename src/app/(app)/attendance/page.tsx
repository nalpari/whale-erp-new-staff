import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Alert, BottomNav, MaskIcon, PageHeader } from "@/components/common";
import { addDays, kstToday, mondayOf, parsePeriod } from "@/lib/attendance-history";
import { CURRENT_STAFF_MEMBER_COOKIE, pickCurrentMembership } from "@/lib/current-store";
import { getMyAttendanceRecords } from "@/lib/my-attendance";
import { getMyMemberships } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { AttendanceHistoryScreen } from "./attendance-history-screen";

export const metadata: Metadata = { title: "출퇴근 현황 · Whale ERP" };

// 출퇴근 현황(목업 attendance-history.html · 데모 attendance, WHALEERP-221 · 222). 근무지는 앱 전역에서 고른 소속이다(ATT-07).
// 탭은 「이번 주」 · 「기간별」(HIST-2) — 기간별은 이번 달이 기본이고 한 번에 최대 1년이다. 화면 상태는 주소(tab · from · to)에만 둔다.
// 보기만 한다 — 보정 · 대신 등록은 관리자 웹의 일이고, 그런 날은 연필 표시와 시트로 알린다(HIST-1 · 3).
export default async function AttendancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSession();
  const params = await searchParams;
  const now = new Date();
  const today = kstToday(now);
  const tab = params.tab === "period" ? "period" : "week";
  const monday = mondayOf(today);
  const range = tab === "period" ? parsePeriod(params.from, params.to, today) : { from: monday, to: addDays(monday, 6) };

  const memberships = await getMyMemberships();
  const current = memberships && pickCurrentMembership(memberships.items, (await cookies()).get(CURRENT_STAFF_MEMBER_COOKIE)?.value);
  const records = current && (await getMyAttendanceRecords(current.staffMemberId, range.from, range.to));

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="출퇴근 현황"
        backHref="/home"
        action={
          <Link href="/check-in" aria-label="출퇴근 등록" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
            <Image src="/icons/history.svg" alt="" width={21} height={21} className="-scale-y-100" />
          </Link>
        }
      />
      {!memberships || (current && !records) ? (
        <div className="px-[22px] pt-[22px]">
          <Alert tone="warning">출퇴근 기록을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
        </div>
      ) : !current || !records ? (
        <div className="flex flex-col items-center gap-[8px] px-[22px] py-[52px] text-center leading-[1.5]">
          <span className="flex pb-[6px] text-staff-text-muted">
            <MaskIcon src="/icons/store.svg" size={40} flipY />
          </span>
          <h2 className="text-[18px] font-bold">근무지가 없습니다</h2>
          <p className="max-w-[250px] text-[14px] text-staff-text-sub">연결된 근무지가 없어 출퇴근 기록을 보여 줄 수 없습니다. 지난 기록은 관리자에게 문의해 주세요.</p>
        </div>
      ) : (
        <AttendanceHistoryScreen key={`${current.staffMemberId}-${tab}`} tab={tab} records={records} today={today} weekStart={monday} now={now.toISOString()} />
      )}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/check-in" />
      </div>
    </div>
  );
}
