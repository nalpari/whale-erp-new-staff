import type { Metadata } from "next";
import { RedirectType, notFound, redirect } from "next/navigation";
import { Alert, Button, Dock, PageHeader } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCodesOrEmpty } from "@/lib/codes";
import { labelOf } from "@/lib/enums";
import { getMyMemberships, getMyProfile, getMyTaxProfile } from "@/lib/my-profile";
import { dateLabel } from "@/lib/profile";
import { parseStaffMemberId } from "@/lib/tax-profile";
import { saveTaxProfileAction } from "./actions";
import { TaxProfileForm } from "./tax-profile-form";

export const metadata: Metadata = { title: "신고 정보 다시 입력 · Whale ERP" };

// 신고 정보 「새로 넣기」(WHALEERP-333, api 334). 이미 낸 신고 정보만 여기서 고친다 — 아직 없으면(첫 입력은 날인 뒤 흐름 150 몫)
// 보기 화면으로 돌려보낸다. 퇴직한 근무지(조회만, WHALEERP-765)도 보기 화면으로. 내 소속이 아니면 404. 이름 · 생년월일은 가입 계정 값(내 정보)이고 고칠 수 없다.
export default async function TaxProfileEditPage({ params }: PageProps<"/me/memberships/[staffMemberId]/tax-profile/edit">) {
  const raw = (await params).staffMemberId;
  const staffMemberId = parseStaffMemberId(raw);
  if (staffMemberId === null) notFound();
  const viewHref = `/me/memberships/${staffMemberId}/tax-profile`;

  let tax;
  try {
    tax = await getMyTaxProfile(staffMemberId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  // editable 은 false 일 때만 막는다(칸이 없는 옛 api 와 섞여도 재직 근무지는 고친다)
  if (tax && (tax.editable === false || !tax.taxProfile)) redirect(viewHref, RedirectType.replace);
  const [profile, memberships, banks] = await Promise.all([getMyProfile(), getMyMemberships(), getCodesOrEmpty("BANK")]);
  const storeName = memberships?.items.find((m) => m.staffMemberId === staffMemberId)?.store.storeName ?? "근무지";

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="신고 정보 다시 입력" backHref={viewHref} />
      {tax === null ? (
        <>
          <div className="flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]">
            <Alert tone="warning">
              <p>신고 정보를 지금 고칠 수 없습니다. 잠시 뒤 다시 열어 주세요.</p>
            </Alert>
          </div>
          <Dock>
            <Button variant="ghost" href={viewHref} transitionTypes={["nav-back"]}>
              돌아가기
            </Button>
          </Dock>
        </>
      ) : (
        <TaxProfileForm
          action={saveTaxProfileAction.bind(null, String(staffMemberId))}
          storeName={storeName}
          realName={profile.realName}
          birthDate={profile.birthDate}
          birthDateLabel={dateLabel(profile.birthDate)}
          banks={banks}
          backHref={viewHref}
          email={profile.email}
          currentRrn={tax.taxProfile?.rrnMasked}
          currentAccount={tax.taxProfile ? `${labelOf(banks, tax.taxProfile.bankCode)} ${tax.taxProfile.payrollAccountNumberMasked}` : undefined}
        />
      )}
    </div>
  );
}
