import type { Metadata } from "next";
import { RedirectType, redirect } from "next/navigation";
import { BottomNav, PageHeader } from "@/components/common";
import { getMyMemberships, getMyProfile } from "@/lib/my-profile";
import { hasFranchiseMembership, hasHqSharingRecord } from "@/lib/profile";
import { HqSharingConsentCard } from "../../consent-cards";

export const metadata: Metadata = { title: "근무정보 제공 동의 · Whale ERP" };

// 내 정보 › 근무정보 제공 동의 상세(2026-11-25 사용자 지정). 내 정보에는 이름 · 상태 배지 한 줄만 두고, 내용 보기 · 동의 철회 ·
// 다시 동의하기는 여기서 한다 — 동작 규칙(내용 시트의 「동의합니다」)은 내 정보에 있던 카드 그대로다.
// 내 정보 줄과 같은 조건(가맹 점포 소속 — 소속을 못 받았으면 동의 기록)에서만 연다. 아니면 내 정보로 돌려보낸다.
export default async function HqSharingConsentPage() {
  const [profile, memberships] = await Promise.all([getMyProfile(), getMyMemberships()]);
  const shown = memberships ? hasFranchiseMembership(memberships.items) : hasHqSharingRecord(profile.hqSharingConsent);
  if (!shown) redirect("/me", RedirectType.replace);
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="근무정보 제공 동의" backHref="/me" />
      <div className="flex flex-col gap-[12px] px-[16px] pt-[20px] pb-[24px] leading-[1.5]">
        <HqSharingConsentCard consent={profile.hqSharingConsent} heading={false} />
      </div>
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/me" />
      </div>
    </div>
  );
}
