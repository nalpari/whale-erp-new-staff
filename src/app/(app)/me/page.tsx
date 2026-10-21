import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, Badge, BottomNav, Button, Card, MaskIcon } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getCurrentTerms, getMyMemberships, getMyProfile } from "@/lib/my-profile";
import { PASSWORD_STALE_MONTHS, dateLabel, hasFranchiseMembership, isPasswordStale, kstDateLabel } from "@/lib/profile";
import { AddressForm } from "./address-form";
import { ChangedToast } from "./changed-toast";
import { HqSharingConsentCard, LocationConsentCard } from "./consent-cards";
import { LogoutSheet } from "./logout-sheet";
import { CardLabel, ReadOnlyField } from "./read-only-field";

export const metadata: Metadata = { title: "내 정보 · Whale ERP" };

/** 비밀번호 줄(데모 iconLine): 20px 칸의 아이콘 · 제목 14px semibold · 설명 12px · 오른쪽 96px 버튼. */
function IconLine({
  icon,
  flipY = false,
  title,
  sub,
  action,
}: {
  icon: string;
  flipY?: boolean;
  title: string;
  sub: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={18} flipY={flipY} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[12px] text-staff-text-muted">{sub}</p>
      </div>
      <div className="w-[96px] shrink-0">{action}</div>
    </div>
  );
}

/** 하위 화면에서 바꾸고 돌아왔을 때의 알림(`?changed=`). 비밀번호(194) · 이메일(195). */
const CHANGED_TOAST: Record<string, string> = {
  password: "비밀번호를 변경했습니다",
  email: "아이디를 새 이메일로 바꿨습니다. 다음 로그인부터 새 이메일을 씁니다",
};

// 하단 메뉴 「내 정보」(WHALEERP-193). 기준: 데모 docs/demo/me 의 view(Figma 없음) — 기본 정보 · 소속 근무지 · 위치정보 동의 ·
// 본사 제공 동의 · 연락처(휴대전화번호 · 이메일 · 주소) · 비밀번호 · 로그아웃 순서다.
// 데모와 다른 점: 휴대전화번호 변경은 1차에서 뺐고(2026-10-19), 머리줄의 「변경 이력」은 계정 api 가 없어 두지 않았다.
// 이메일 「변경」은 195 화면 /me/email, 비밀번호 「변경」은 194 화면 /me/password 로 간다(경로는 2026-10-20 노영주 결정).
// 신고 정보는 소속마다 따로라(2026-10-20, api #79) 소속 근무지 화면에만 둔다 — 데모의 비밀번호 아래 신고 정보 줄은 뺐다(2026-10-20 노영주).
export default async function MePage({ searchParams }: PageProps<"/me">) {
  const { changed } = await searchParams;
  // 주소에서 오는 값이라 정한 키만 받는다(`?changed=toString` 같은 프로토타입 이름이 함수를 꺼내지 않게).
  const toast = typeof changed === "string" && Object.hasOwn(CHANGED_TOAST, changed) ? CHANGED_TOAST[changed] : undefined;
  const [profile, memberships, employmentTypes, locationTerms] = await Promise.all([
    getMyProfile(),
    getMyMemberships(),
    getEnumOrEmpty("EmploymentType"),
    getCurrentTerms("LOCATION"),
  ]);
  const items = memberships?.items ?? [];
  const first = items.at(0);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex min-h-[72px] w-full items-center bg-white px-[22px] py-[14px]">
        <h1 className="min-w-0 flex-1 text-[18px] leading-[1.5] font-bold">내 정보</h1>
      </header>
      <div className="flex flex-col gap-[14px] px-[16px] pt-[16px] pb-[24px] leading-[1.5]">
        <Card>
          <CardLabel>기본 정보</CardLabel>
          <div className="flex flex-col gap-[10px] pt-[8px]">
            <ReadOnlyField label="이름" value={profile.realName} />
            {/* 내 정보 · 신고 정보의 날짜는 「2025년 11월 3일」로 쓴다(2026-10-20 노영주). */}
            <ReadOnlyField label="생년월일" value={dateLabel(profile.birthDate)} />
            {/* 소속이 여럿이면 입사일도 여럿이다 — 가장 먼저 입사한 곳(api 가 입사일 순으로 준다). 소속마다는 소속 근무지 화면에. */}
            {first?.hiredDate && <ReadOnlyField label="입사일" value={dateLabel(first.hiredDate)} />}
          </div>
          <p className="pt-[8px] text-[12px] text-staff-text-muted">이름과 생년월일은 본인인증으로 확정된 값이라 앱에서 고칠 수 없습니다.</p>
        </Card>

        <div className="flex flex-col gap-[6px]">
          {memberships === null ? (
            <Alert tone="warning">
              <p>소속 근무지를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
            </Alert>
          ) : (
            <Link
              href="/me/memberships"
              transitionTypes={["nav-forward"]}
              className={`flex w-full items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-staff-info-bg p-[16px] text-left active:bg-staff-primary-inactive ${PRESS}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-staff-text-sub">소속 근무지</span>
                <span className="block pt-[4px] text-[15px] font-bold">
                  {first ? `${first.store.storeName}${items.length > 1 ? ` 외 ${items.length - 1}곳` : ""}` : "아직 없습니다"}
                </span>
              </span>
              {first && <Badge tone="plain">{labelOf(employmentTypes, first.employmentType)}</Badge>}
              <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
            </Link>
          )}
          <p className="px-[4px] text-[12px] text-staff-text-muted">소속 근무지와 고용 형태는 근로계약으로만 바뀝니다.</p>
        </div>

        <LocationConsentCard consent={profile.locationConsent} terms={locationTerms} />
        {/* 가맹 점포 소속이 있을 때만(ATT-30). 소속을 못 받았으면 판단할 수 없어 감춘다. */}
        {memberships && hasFranchiseMembership(items) && <HqSharingConsentCard consent={profile.hqSharingConsent} />}

        <Card>
          <CardLabel>연락처</CardLabel>
          <div className="flex flex-col gap-[10px] pt-[8px]">
            <ReadOnlyField label="휴대전화번호" value={profile.phone} help="가입 때 넣은 번호로, 앱에서 바꿀 수 없습니다." />
            <ReadOnlyField
              label="이메일 · 로그인 아이디"
              value={profile.email}
              help="로그인할 때 쓰는 아이디라 새 이메일로 인증번호를 받아 확인한 뒤에 바뀝니다."
              action={
                <Button variant="outline" href="/me/email" transitionTypes={["nav-forward"]}>
                  변경
                </Button>
              }
            />
            <AddressForm zipCode={profile.zipCode} address={profile.address} addressDetail={profile.addressDetail} />
          </div>
        </Card>

        <Card>
          <IconLine
            icon="/icons/shield.svg"
            flipY
            title="비밀번호"
            sub={
              <>
                마지막 변경 {kstDateLabel(profile.passwordChangedAt)}
                {/* 오래됐으면 권하기만 한다(WHALEERP-194). 지각 칩 · 경고 판과 같은 글자색(#956013). */}
                {isPasswordStale(profile.passwordChangedAt, new Date()) && (
                  <span className="block text-[#956013]">바꾼 지 {PASSWORD_STALE_MONTHS}개월이 넘었습니다. 새 비밀번호로 바꿔 두세요.</span>
                )}
              </>
            }
            action={
              <Button variant="outline" href="/me/password" transitionTypes={["nav-forward"]}>
                변경
              </Button>
            }
          />
        </Card>

        {/* 로그아웃은 맨 아래(S-PHHICH 확정). 자주 누를 것이 아니고 실수로 눌리면 곤란해서다. */}
        <hr className="my-[4px] border-staff-border-light" />
        <LogoutSheet />
      </div>
      {toast && <ChangedToast>{toast}</ChangedToast>}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/me" />
      </div>
    </div>
  );
}
