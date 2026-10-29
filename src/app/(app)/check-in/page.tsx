import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Alert, BottomNav, MaskIcon, PageHeader } from "@/components/common";
import { CURRENT_STAFF_MEMBER_COOKIE, pickCurrentMembership } from "@/lib/current-store";
import { getMyAttendance } from "@/lib/my-attendance";
import { getMyMemberships } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { CheckInScreen } from "./check-in-screen";

export const metadata: Metadata = { title: "출퇴근 · Whale ERP" };

// 하단 메뉴 「출퇴근」(목업 attendance.html · 데모 check-in, WHALEERP-214 · 215). 근무지는 앱 전역에서 고른 소속이다(ATT-07) —
// 이 화면에서 고르거나 가장 가까운 곳으로 바꾸지 않는다. 위치 판정은 화면(휴대전화)이 하고 서버에는 사유만 보낸다(ATT-05).
// 카카오 지도 키는 요청 때 서버 env 에서 읽어 넘긴다 — 값 파일은 이미지 빌드 뒤에 마운트되므로 NEXT_PUBLIC_ 으로 빌드에 박을 수 없다.
export default async function CheckInPage() {
  await requireSession();
  const memberships = await getMyMemberships();
  const current = memberships && pickCurrentMembership(memberships.items, (await cookies()).get(CURRENT_STAFF_MEMBER_COOKIE)?.value);
  const attendance = current && (await getMyAttendance(current.staffMemberId));

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="출퇴근"
        backHref="/home"
        action={
          // 데모 check-in — 머리줄 오른쪽은 출퇴근 현황으로 가는 버튼이다
          <Link href="/attendance" aria-label="출퇴근 현황" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
            <Image src="/icons/history.svg" alt="" width={21} height={21} className="-scale-y-100" />
          </Link>
        }
      />
      {!memberships || (current && !attendance) ? (
        <div className="px-[22px] pt-[22px]">
          <Alert tone="warning">출퇴근 정보를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
        </div>
      ) : !current || !attendance ? (
        <div className="flex flex-col items-center gap-[8px] px-[22px] pt-[76px] text-center">
          <span className="flex text-staff-placeholder">
            <MaskIcon src="/icons/store.svg" size={30} flipY />
          </span>
          <p className="pt-[6px] text-[18px] font-bold">근무지가 없습니다</p>
          <p className="max-w-[250px] text-[14px] text-staff-text-sub">
            연결된 근무지가 없어 출퇴근을 등록할 수 없습니다. 받은 급여명세서는 급여 탭에서 볼 수 있습니다.
          </p>
        </div>
      ) : (
        // 근무지를 바꾸면 화면 상태(위치 · 시트)를 새로 시작한다
        <CheckInScreen key={current.staffMemberId} data={attendance} mapKey={process.env.KAKAO_MAP_APP_KEY || null} />
      )}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/check-in" />
      </div>
    </div>
  );
}
