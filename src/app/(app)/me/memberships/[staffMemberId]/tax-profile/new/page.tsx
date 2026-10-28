import type { Metadata } from "next";
import { RedirectType, notFound, redirect } from "next/navigation";
import { Alert, Button, Dock, PageHeader } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCodesOrEmpty } from "@/lib/codes";
import { getMyMemberships, getMyProfile, getMyTaxProfile } from "@/lib/my-profile";
import { dateLabel } from "@/lib/profile";
import { TAX_VIEW_UNAVAILABLE, parseStaffMemberId } from "@/lib/tax-profile";
import { createTaxProfileAction } from "./actions";
import { TaxProfileCreateForm, TaxProfileIntro } from "./new-tax-profile";

export const metadata: Metadata = { title: "신고 정보 넣기 · Whale ERP" };

// 날인 뒤 신고 정보 처음 넣기(WHALEERP-150). 안내(데모 intro) → `?step=form` 입력(데모 form) → 완료(`./done`).
// 들어오는 곳: 날인 완료(WHALEERP-147 이 이리로 잇는다)와 신고 정보 보기 화면의 「아직 내지 않았습니다」. 이미 낸 소속이면 보기 화면으로
// 보낸다 — 고치기는 지금 비밀번호를 받는 `../edit` 몫이다. 내 소속이 아니면 404.
export default async function NewTaxProfilePage({ params, searchParams }: PageProps<"/me/memberships/[staffMemberId]/tax-profile/new">) {
  const staffMemberId = parseStaffMemberId((await params).staffMemberId);
  if (staffMemberId === null) notFound();
  const step = (await searchParams).step === "form" ? "form" : "intro";
  const viewHref = `/me/memberships/${staffMemberId}/tax-profile`;
  const newHref = `${viewHref}/new`;

  let tax;
  try {
    tax = await getMyTaxProfile(staffMemberId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (tax?.taxProfile) redirect(viewHref, RedirectType.replace);
  const [profile, memberships, banks] = await Promise.all([getMyProfile(), getMyMemberships(), getCodesOrEmpty("BANK")]);
  const storeName = memberships?.items.find((m) => m.staffMemberId === staffMemberId)?.store.storeName ?? "근무지";

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="신고 정보" backHref={step === "form" ? newHref : viewHref} />
      {tax === null ? (
        <>
          <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
            <Alert tone="warning">
              <p>{TAX_VIEW_UNAVAILABLE}</p>
            </Alert>
          </div>
          <Dock>
            <Button variant="ghost" href={viewHref} transitionTypes={["nav-back"]}>
              돌아가기
            </Button>
          </Dock>
        </>
      ) : step === "intro" ? (
        <TaxProfileIntro storeName={storeName} formHref={`${newHref}?step=form`} />
      ) : (
        <TaxProfileCreateForm
          action={createTaxProfileAction.bind(null, String(staffMemberId))}
          storeName={storeName}
          realName={profile.realName}
          birthDate={profile.birthDate}
          birthDateLabel={dateLabel(profile.birthDate)}
          banks={banks}
        />
      )}
    </div>
  );
}
