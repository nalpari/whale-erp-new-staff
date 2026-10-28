import type { Metadata } from "next";
import { RedirectType, notFound, redirect } from "next/navigation";
import { Alert, Button, Dock } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCodesOrEmpty } from "@/lib/codes";
import { labelOf } from "@/lib/enums";
import { HOME_PATH } from "@/lib/login-return";
import { getMyTaxProfile } from "@/lib/my-profile";
import { kstDateTimeLabel } from "@/lib/profile";
import { parseStaffMemberId } from "@/lib/tax-profile";
import { Sunken, Values } from "@/app/_components/tax-profile-parts";

export const metadata: Metadata = { title: "신고 정보 등록 완료 · Whale ERP" };

// 신고 정보 처음 넣기 완료(WHALEERP-150, 데모 tax 의 done). 가린 값 · 쓰는 곳 · 받은 때만 보인다(원문은 api 가 내려 주지 않는다).
// 신고 정보가 아직 없으면(주소로 바로 옴) 넣기로 보낸다. 다시 읽지 못하면 저장은 됐다고 알리고 가린 값만 뺀다.
export default async function NewTaxProfileDonePage({ params }: PageProps<"/me/memberships/[staffMemberId]/tax-profile/new/done">) {
  const staffMemberId = parseStaffMemberId((await params).staffMemberId);
  if (staffMemberId === null) notFound();

  let tax;
  try {
    tax = await getMyTaxProfile(staffMemberId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (tax && !tax.taxProfile) redirect(`/me/memberships/${staffMemberId}/tax-profile/new`, RedirectType.replace);
  const profile = tax?.taxProfile;
  const banks = profile ? await getCodesOrEmpty("BANK") : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[22px] font-bold">신고 정보를 등록했습니다</h1>
          <p className="text-[14px] text-staff-text-sub">이제 근무를 시작할 수 있습니다.</p>
        </div>
        {profile ? (
          <Sunken>
            <Values
              flush
              rows={[
                ["주민등록번호", profile.rrnMasked],
                ["급여 계좌", `${labelOf(banks, profile.bankCode)} ${profile.payrollAccountNumberMasked}`],
                ["쓰는 곳", profile.purpose],
                ["받은 때", kstDateTimeLabel(profile.collectedAt)],
              ]}
            />
          </Sunken>
        ) : (
          <Alert tone="warning">
            <p>등록한 값은 지금 볼 수 없습니다. 잠시 뒤 신고 정보에서 확인해 주세요.</p>
          </Alert>
        )}
        <p className="text-[12px] text-staff-text-muted">내 정보 - 소속 근무지의 신고 정보에서 언제든 확인하고 새로 넣을 수 있습니다.</p>
      </div>
      <Dock>
        <Button href={HOME_PATH} replace transitionTypes={["nav-forward"]}>
          근무 시작하기
        </Button>
      </Dock>
    </div>
  );
}
