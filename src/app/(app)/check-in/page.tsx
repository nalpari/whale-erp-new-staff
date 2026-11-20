import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Alert, BottomNav, MaskIcon, PageHeader } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { requestsLoadFailure } from "@/lib/affiliation-requests";
import { failureOf, logFailure } from "@/lib/api";
import { getContracts } from "@/lib/contracts";
import { CURRENT_STAFF_MEMBER_COOKIE, pickCurrentMembership } from "@/lib/current-store";
import { getMyAttendance } from "@/lib/my-attendance";
import { getMyMemberships, getMyProfileForExtra } from "@/lib/my-profile";
import { requireSession } from "@/lib/session";
import { checkInSignWaitingOf } from "@/lib/sign-request";
import { CheckInScreen } from "./check-in-screen";

export const metadata: Metadata = { title: "출퇴근 · Whale ERP" };

// 하단 메뉴 「출퇴근」(목업 attendance.html · 데모 check-in, WHALEERP-214 · 215). 근무지는 앱 전역에서 고른 소속이다(ATT-07) —
// 이 화면에서 고르거나 가장 가까운 곳으로 바꾸지 않는다. 위치 판정은 화면(휴대전화)이 하고 서버에는 사유만 보낸다(ATT-05).
// 카카오 지도 키는 요청 때 서버 env 에서 읽어 넘긴다 — 값 파일은 이미지 빌드 뒤에 마운트되므로 NEXT_PUBLIC_ 으로 빌드에 박을 수 없다.
export default async function CheckInPage() {
  await requireSession();
  const memberships = await getMyMemberships();
  const current = memberships && pickCurrentMembership(memberships.items, (await cookies()).get(CURRENT_STAFF_MEMBER_COOKIE)?.value);
  // 퇴직한 소속이 있을 때만 퇴직 후 안내 — 가입 직후 · 계약 전(거절 · 만료)에는 중립 안내. 퇴직 포함 목록을 못 받으면 중립 안내
  const retired = memberships && !current && ((await getMyMemberships(true))?.items.some((m) => m.retiredDate !== null) ?? false);
  const attendance = current && (await getMyAttendance(current.staffMemberId));
  // 출근이 서명 대기 계약으로 막혔으면 시트가 그 계약서로 잇는다(146) — 그때만 내 계약 목록을 받는다
  const block = attendance?.checkInBlock;
  const signWaiting =
    attendance && block?.reason === "CONTRACT_PENDING_SIGNATURE"
      ? checkInSignWaitingOf(await contractsOrNull(), new Date(), attendance.store.storeId, block.contractId)
      : null;
  // 「다시 켜면」 안내의 일시 중지 시각(데모 check-in paused) — 출퇴근 api 에 없어 일시 중지일 때만 내 정보에서 받는다. 못 받으면 그 줄만 뺀다
  const pausedAt =
    attendance && attendance.store.isLocationApplied && attendance.locationConsent.state === "PAUSED"
      ? ((await getMyProfileForExtra("profile-check-in"))?.locationConsent.pausedAt ?? null)
      : null;
  const header = (
    <PageHeader
      title="출퇴근"
      backHref="/home"
      action={
        // 데모 check-in — 머리줄 오른쪽은 출퇴근 현황으로 가는 버튼이다. 시계 아이콘만으로는 버튼인지 · 어디로 가는지 몰라 글자 알약
        // 「출퇴근 현황 ›」으로 바꿨다(2026-11-20 사용자 지정). 보이는 알약은 36px, 누르는 칸은 위아래를 넓혀 44px.
        <Link href="/attendance" transitionTypes={["nav-forward"]} className="group -my-[4px] flex min-h-[44px] shrink-0 items-center">
          <span
            className={`flex h-[36px] items-center gap-[4px] rounded-full border border-staff-border bg-white pr-[10px] pl-[12px] text-[13px] font-semibold text-staff-text-sub group-active:bg-staff-primary-inactive ${PRESS}`}
          >
            <Image src="/icons/history.svg" alt="" width={16} height={16} className="-scale-y-100" />
            출퇴근 현황
            <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
          </span>
        </Link>
      }
    />
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* 머리줄은 퇴근을 마친 화면에서 빠지므로(데모 check-in done) 출퇴근 화면에서는 CheckInScreen 이 그린다 */}
      {!(current && attendance) && header}
      {!memberships || (current && !attendance) ? (
        <div className="px-[22px] pt-[22px]">
          <Alert tone="warning">출퇴근 정보를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
        </div>
      ) : !current || !attendance ? (
        <div className="flex flex-col items-center gap-[8px] px-[22px] pt-[76px] text-center">
          <span className="flex text-staff-placeholder">
            <MaskIcon src="/icons/store.svg" size={30} flipY />
          </span>
          {retired ? (
            <>
              <p className="pt-[6px] text-[18px] font-bold">근무가 종료되었습니다</p>
              <p className="max-w-[250px] text-[14px] text-staff-text-sub">
                급여명세서는 보존 기간(3년) 동안
                <br />
                급여 탭에서 확인할 수 있습니다.
              </p>
            </>
          ) : (
            <>
              <p className="pt-[6px] text-[18px] font-bold">연결된 근무지가 없습니다</p>
              <p className="max-w-[250px] text-[14px] text-staff-text-sub">
                근무지에 연결되면 출퇴근을 등록할 수 있습니다. 받은 급여명세서는 급여 탭에서 볼 수 있습니다.
              </p>
            </>
          )}
        </div>
      ) : (
        // 근무지를 바꾸면 화면 상태(위치 · 시트)를 새로 시작한다
        <CheckInScreen
          key={current.staffMemberId}
          header={header}
          data={attendance}
          mapKey={process.env.KAKAO_MAP_APP_KEY || null}
          signWaiting={signWaiting}
          pausedAt={pausedAt}
        />
      )}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/check-in" />
      </div>
    </div>
  );
}

/**
 * 내 근로계약 목록 — 계약 미체결 시트의 곁들임이라 api 실패(4xx · 5xx · 연결 실패)는 null 로 받아 기한 줄 없이 그 계약서로 잇는다(401 은 만료
 * 안내로). 홈과 같은 규칙(requestsLoadFailure — 예상 밖 4xx 만 남긴다)
 */
async function contractsOrNull() {
  try {
    return await getContracts();
  } catch (error) {
    const failure = failureOf(error);
    const handling = requestsLoadFailure(failure);
    if (handling === "throw") throw error;
    if (handling === "log" && failure) logFailure("contracts-check-in", failure);
    return null;
  }
}
