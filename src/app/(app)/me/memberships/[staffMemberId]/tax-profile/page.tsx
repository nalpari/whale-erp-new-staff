import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Button, Card, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCodesOrEmpty } from "@/lib/codes";
import { labelOf } from "@/lib/enums";
import { getMyMemberships, getMyTaxProfile } from "@/lib/my-profile";
import { kstDateTimeLabel } from "@/lib/profile";
import { parseStaffMemberId, taxViewAfterChange } from "@/lib/tax-profile";
import { CardLabel } from "@/app/_components/read-only-field";
import { ACCOUNT_BASIS, Basis, RRN_BASIS, Sunken, TaxOwnerNotice, Values } from "@/app/_components/tax-profile-parts";
import { ChangedToast } from "../../../changed-toast";

export const metadata: Metadata = { title: "신고 정보 · Whale ERP" };

/** 가린 값 카드 — 이름 · 값(18px bold) · 안내(12px). */
function ValueCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card>
      <CardLabel>{label}</CardLabel>
      <p className="pt-[4px] text-[18px] font-bold tabular-nums">{value}</p>
      <p className="pt-[6px] text-[12px] text-staff-text-muted">{help}</p>
    </Card>
  );
}

// 소속별 신고 정보(TAX-8). 기준: 데모 docs/demo/tax 의 view(「등록된 신고 정보」). 가린 값만 보인다(원문은 api 가 내려 주지 않는다).
// 받은 근거 두 줄은 운영 정책 TAX-08 의 문구(데모와 같은 문장)이고, 사업주는 이 소속의 점포다.
// 「새로 넣기」(데모 form)는 이미 낸 신고 정보가 있을 때만 보이고 `./edit` 로 간다(WHALEERP-333) — 첫 입력은 날인 뒤 흐름(150) 몫이다.
// 고치고 돌아오면 `?changed=1` 로 와 알림을 띄우고 주소에서 지운다 — 다시 조회가 실패해도 지우고, 안내에 저장은 됐다고 덧붙인다(PR #26 참고). 내 소속이 아니면(퇴직 · 남의 id) 404 다.
export default async function TaxProfilePage({ params, searchParams }: PageProps<"/me/memberships/[staffMemberId]/tax-profile">) {
  const staffMemberId = parseStaffMemberId((await params).staffMemberId);
  const changed = (await searchParams).changed === "1";
  if (staffMemberId === null) notFound();

  let tax;
  try {
    tax = await getMyTaxProfile(staffMemberId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const [memberships, banks] = await Promise.all([getMyMemberships(), getCodesOrEmpty("BANK")]);
  const storeName = memberships?.items.find((m) => m.staffMemberId === staffMemberId)?.store.storeName ?? "근무지";
  const profile = tax?.taxProfile;
  const after = taxViewAfterChange(changed, tax);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="등록된 신고 정보" backHref="/me/memberships" />
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        {tax === null ? (
          <Alert tone="warning">
            <p>{after.unavailable}</p>
          </Alert>
        ) : !profile ? (
          <Notice>
            <strong>{storeName}</strong>에는 아직 신고 정보를 내지 않았습니다. 근로계약서 서명을 마친 뒤 넣게 됩니다.
          </Notice>
        ) : (
          <>
            <ValueCard label="주민등록번호" value={profile.rrnMasked} help="뒷자리는 본인에게도 다시 보여주지 않습니다. 고치려면 새로 넣습니다." />
            <ValueCard
              label="급여 계좌"
              value={`${labelOf(banks, profile.bankCode)} ${profile.payrollAccountNumberMasked}`}
              help="계좌를 바꾸면 다음 급여부터 새 계좌로 들어갑니다."
            />
            <Sunken label="기록">
              <Values
                rows={[
                  ["받은 때", kstDateTimeLabel(profile.collectedAt)],
                  ["쓰는 곳", profile.purpose],
                ]}
              />
            </Sunken>
            <Sunken label="받은 근거">
              <Basis>
                <b>주민등록번호</b> — {RRN_BASIS}
              </Basis>
              <Basis>
                <b>급여 계좌</b> — {ACCOUNT_BASIS}
              </Basis>
            </Sunken>
            <TaxOwnerNotice storeName={storeName} />
            <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
              관리자 화면에도 <strong>가려진 형태로만</strong> 보입니다. 원본은 신고 서류를 만들 때만 꺼내 씁니다.
            </Notice>
          </>
        )}
      </div>
      {profile && (
        <Dock>
          <Button variant="ghost" href={`/me/memberships/${staffMemberId}/tax-profile/edit`}>
            새로 넣기
          </Button>
        </Dock>
      )}
      {changed && (
        <ChangedToast path={`/me/memberships/${staffMemberId}/tax-profile`}>{after.toast ? "신고 정보를 바꿨습니다" : undefined}</ChangedToast>
      )}
    </div>
  );
}
