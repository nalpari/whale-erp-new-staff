import type { Metadata } from "next";
import { Suspense } from "react";
import { Alert, BottomNav } from "@/components/common";
import { getMyInvitations } from "@/lib/my-invitations";
import { getCurrentTerms, getMyAffiliationRequests, getMyMemberships, getMyProfile } from "@/lib/my-profile";
import { PASSWORD_STALE_MONTHS, dateLabel, hasFranchiseMembership, hasHqSharingRecord, isPasswordStale, kstDateLabel } from "@/lib/profile";
import { AddressRow } from "./address-row";
import { ChangedToast } from "./changed-toast";
import { HqSharingConsentCard, LocationConsentCard } from "./consent-cards";
import { LogoutSheet } from "./logout-sheet";
import { TitleHeader } from "../title-header";
import { LineIcon, LinkRow, RowBox, RowGroup, RowIcon } from "./me-rows";

export const metadata: Metadata = { title: "내 정보 · Whale ERP" };

/** 하위 화면에서 바꾸고 돌아왔을 때의 알림(`?changed=`). 비밀번호(194) · 이메일(195). */
const CHANGED_TOAST: Record<string, string> = {
  password: "비밀번호를 변경했습니다",
  email: "로그인 아이디를 새 이메일로 변경했습니다",
};

// 하단 메뉴 「내 정보」(WHALEERP-193). 정돈 시안 ⑬(2026-11-20 사용자 지정) — 프로필 카드(이름 · 생년월일 · 휴대전화) · 줄 상자
// (아이디(이메일) · 주소 · 비밀번호 변경) · 내 근무지(근무지 줄 · 새 근무지 초대 줄) · 출퇴근 위치정보 이용 동의 · 근무정보 제공 동의 ·
// 로그아웃 순서다. 휴대전화 · 생년월일은 고칠 수 없어 프로필 카드에 보이기만 한다(휴대전화번호 변경은 1차에서 뺐다, 2026-10-19).
// 이메일은 195 화면 /me/email, 비밀번호는 194 화면 /me/password 로 간다(경로는 2026-10-20 노영주 결정). 주소는 줄을 누르면 편집이 펼쳐진다.
// 신고 정보는 소속마다 따로라(2026-10-20, api #79) 내 근무지 화면에만 둔다. 머리줄의 「변경 이력」은 계정 api 가 없어 두지 않았다.
export default async function MePage({ searchParams }: PageProps<"/me">) {
  const { changed } = await searchParams;
  // 주소에서 오는 값이라 정한 키만 받는다(`?changed=toString` 같은 프로토타입 이름이 함수를 꺼내지 않게).
  const toast = typeof changed === "string" && Object.hasOwn(CHANGED_TOAST, changed) ? CHANGED_TOAST[changed] : undefined;
  const [profile, memberships, locationTerms] = await Promise.all([getMyProfile(), getMyMemberships(), getCurrentTerms("LOCATION")]);
  const items = memberships?.items ?? [];
  const first = items.at(0);

  return (
    <div className="flex flex-1 flex-col">
      {/* 하단 메뉴 탭 제목은 모두 같은 머리줄(22px 제목 · 종, 2026-11-24 사용자 지정) */}
      <TitleHeader title="내 정보" />
      <div className="flex flex-col gap-[12px] px-[16px] pt-[12px] pb-[24px] leading-[1.5]">
        <div className="flex flex-col gap-[12px]">
          {/* 프로필 카드 — 이름 · 생년월일 · 휴대전화. 직원이 고칠 수 없는 값이라 보이기만 하고 아래 한 줄로 알린다. */}
          <div className="flex flex-col items-center gap-[14px] rounded-[20px] border border-staff-border bg-white px-[20px] pt-[24px] pb-[18px]">
            <span aria-hidden className="flex size-[64px] items-center justify-center rounded-full bg-staff-primary-inactive text-staff-primary">
              <LineIcon name="user" size={30} />
            </span>
            <p className="text-[20px] font-bold">
              {profile.realName}
              <span className="font-normal text-staff-text-sub">님</span>
            </p>
            <dl className="grid w-full grid-cols-2 rounded-[14px] border border-staff-border-light bg-staff-info-bg">
              {/* 내 정보의 날짜는 「2025년 11월 3일」로 쓴다(2026-10-20 노영주). */}
              <ProfileCell label="생년월일" value={dateLabel(profile.birthDate)} />
              {/* 가운데 세로선 #e4e8ef — 시안 값. 안내 바탕 위에서 옅은 선(staff-border-light)은 보이지 않아 한 단계 진하게 둔다. */}
              <ProfileCell label="휴대전화" value={profile.phone} divider />
            </dl>
            <p className="flex items-center gap-[4px] text-[12px] text-staff-placeholder">
              <LineIcon name="info" size={13} />
              정보 변경은 근무지 관리자에게 요청해 주세요.
            </p>
          </div>

          <RowBox>
            <LinkRow href="/me/email" icon={<RowIcon name="mail" />} name="아이디(이메일)" value={profile.email} />
            <AddressRow zipCode={profile.zipCode} address={profile.address} addressDetail={profile.addressDetail} />
            <LinkRow
              href="/me/password"
              icon={<RowIcon name="lock" />}
              name="비밀번호 변경"
              value={
                <>
                  마지막 변경 {kstDateLabel(profile.passwordChangedAt)}
                  {/* 오래됐으면 권하기만 한다(WHALEERP-194). 지각 칩 · 경고 판과 같은 글자색(#956013). */}
                  {isPasswordStale(profile.passwordChangedAt, new Date()) && (
                    <span className="block text-[#956013]">바꾼 지 {PASSWORD_STALE_MONTHS}개월이 넘었습니다. 새 비밀번호로 바꿔 주세요.</span>
                  )}
                </>
              }
            />
          </RowBox>
        </div>

        <RowGroup title="내 근무지">
          {memberships === null ? (
            <Alert tone="warning">
              <p>근무지를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
            </Alert>
          ) : (
            <RowBox>
              <LinkRow
                href="/me/memberships"
                icon={<RowIcon name="store" />}
                name={first ? `${first.store.storeName}${items.length > 1 ? ` 외 ${items.length - 1}곳` : ""}` : "등록된 근무지가 없습니다"}
              />
              {/* 확인을 기다리는 요청(받은 가입 초대 WHALEERP-604 + 소속 추가 · 복귀 확인 144). 따로 받아 api 가 느려도 화면을 먼저 보인다. */}
              <Suspense>
                <RequestRow />
              </Suspense>
            </RowBox>
          )}
        </RowGroup>

        <LocationConsentCard consent={profile.locationConsent} terms={locationTerms} />
        {/* 가맹 점포 소속이 있을 때만(ATT-30). 소속을 못 받았으면 판단할 수 없어 감추되, 동의 기록이 있으면(동의 · 철회 — 가맹 소속이
            있던 계정) 보인다 — 다시 동의할 곳이 이 카드뿐이고(staff #53 code-review), 다시 동의 · 철회에 성공해도 카드 · 토스트가
            사라지지 않게(staff #53 리뷰) */}
        {(memberships ? hasFranchiseMembership(items) : hasHqSharingRecord(profile.hqSharingConsent)) && <HqSharingConsentCard consent={profile.hqSharingConsent} />}

        {/* 로그아웃은 맨 아래(S-PHHICH 확정). 자주 누를 것이 아니고 실수로 눌리면 곤란해서다. */}
        <LogoutSheet />
      </div>
      {toast && <ChangedToast>{toast}</ChangedToast>}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/me" />
      </div>
    </div>
  );
}

/** 프로필 카드의 두 칸 — 이름 12 흐림 · 값 14 semibold, 가운데 정렬. */
function ProfileCell({ label, value, divider = false }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-[2px] p-[12px] text-center break-keep ${divider ? "border-l border-[#e4e8ef]" : ""}`}>
      <dt className="text-[12px] text-staff-text-muted">{label}</dt>
      <dd className="text-[14px] font-semibold">{value}</dd>
    </div>
  );
}

/**
 * 내 근무지 상자의 「새 근무지 초대 N건」 줄 — 내 근무지 맨 위 「확인을 기다리는 요청」과 같은 셈(가입 초대 + 소속 추가 · 복귀 확인).
 * 없거나 못 받았으면 두지 않는다.
 */
async function RequestRow() {
  const [invitations, affiliations] = await Promise.all([getMyInvitations(), getMyAffiliationRequests()]);
  const count = (invitations?.length ?? 0) + (affiliations?.length ?? 0);
  if (count === 0) return null;
  return (
    <LinkRow
      href="/me/memberships"
      highlight
      icon={<RowIcon name="mail" accent dot />}
      name={
        <>
          새 근무지 초대 <span className="text-staff-primary">{count}건</span>
        </>
      }
    />
  );
}
