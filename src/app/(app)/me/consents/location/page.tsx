import type { Metadata } from "next";
import { BottomNav, PageHeader } from "@/components/common";
import { getCurrentTerms, getMyProfile } from "@/lib/my-profile";
import { LocationConsentCard } from "../../consent-cards";

export const metadata: Metadata = { title: "출퇴근 위치정보 이용 동의 · Whale ERP" };

// 내 정보 › 출퇴근 위치정보 이용 동의 상세(2026-11-25 사용자 지정). 내 정보에는 상태 배지 · 일시 한 줄만 두고, 내용 보기 · 일시 중지 ·
// 다시 켜기 · 동의 철회 · 다시 동의하기는 여기서 한다 — 동작 규칙(확인 시트 · 약관 시트)은 내 정보에 있던 카드 그대로다.
export default async function LocationConsentPage() {
  const [profile, terms] = await Promise.all([getMyProfile(), getCurrentTerms("LOCATION")]);
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="출퇴근 위치정보 이용 동의" backHref="/me" />
      <div className="flex flex-col gap-[12px] px-[16px] pt-[20px] pb-[24px] leading-[1.5]">
        <LocationConsentCard consent={profile.locationConsent} terms={terms} heading={false} />
      </div>
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/me" />
      </div>
    </div>
  );
}
