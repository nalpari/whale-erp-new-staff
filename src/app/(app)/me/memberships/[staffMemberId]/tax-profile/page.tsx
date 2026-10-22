import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Alert, Button, Card, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCodesOrEmpty } from "@/lib/codes";
import { labelOf } from "@/lib/enums";
import { getMyMemberships, getMyTaxProfile } from "@/lib/my-profile";
import { kstDateTimeLabel } from "@/lib/profile";
import { CardLabel } from "@/app/_components/read-only-field";

export const metadata: Metadata = { title: "신고 정보 · Whale ERP" };

/** 주소의 id. api 의 StaffMemberIdPipe 처럼 양의 정수만 받고, 나머지는 api 를 부르지 않고 없는 화면이다. */
function parseStaffMemberId(raw: string): number | null {
  if (!/^[1-9][0-9]{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id <= 2_147_483_647 ? id : null;
}

/** 안내 판(데모 sunken) — 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14, 머리 이름 13px semibold. */
function Sunken({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
      <CardLabel>{label}</CardLabel>
      {children}
    </div>
  );
}

/** 이름 · 값 줄(데모 values) — 13px, 이름은 보조 글자 · 값은 오른쪽, 위아래 9 · 줄 사이 옅은 선. */
function Values({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col divide-y divide-staff-border-light pt-[8px]">
      {rows.map(([name, value]) => (
        <div key={name} className="flex items-start gap-[12px] py-[9px] first:pt-0 last:pb-0">
          <dt className="shrink-0 text-[13px] font-medium text-staff-text-sub">{name}</dt>
          <dd className="min-w-0 flex-1 text-right text-[13px] text-staff-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 받은 근거 한 줄(데모 basis) — 12px 보조 글자, <b> 는 기본 글자 bold. */
function Basis({ children }: { children: ReactNode }) {
  return <p className="pt-[6px] text-[12px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">{children}</p>;
}

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
// 「새로 넣기」(데모 form)는 신고 정보 저장 api 가 아직 없어 흐린 「준비 중」으로 막아 둔다. 내 소속이 아니면(퇴직 · 남의 id) 404 다.
export default async function TaxProfilePage({ params }: PageProps<"/me/memberships/[staffMemberId]/tax-profile">) {
  const staffMemberId = parseStaffMemberId((await params).staffMemberId);
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

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="등록된 신고 정보" backHref="/me/memberships" />
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        {tax === null ? (
          <Alert tone="warning">
            <p>신고 정보를 지금 볼 수 없습니다. 잠시 뒤 다시 열어 주세요.</p>
          </Alert>
        ) : !profile ? (
          <Notice>
            <strong>{storeName}</strong>에는 아직 신고 정보를 내지 않았습니다. 근로계약 날인을 마친 뒤 넣게 됩니다.
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
                <b>주민등록번호</b> — 4대보험 취득 신고와 근로소득 원천징수를 위해 <b>법령에 따라</b> 받습니다. 동의 없이 받으며, 신고 서류를
                만들 때만 씁니다.
              </Basis>
              <Basis>
                <b>급여 계좌</b> — <b>근로계약에 따라</b> 급여를 보내기 위해 받습니다. 급여 지급 외에는 쓰지 않습니다.
              </Basis>
            </Sunken>
            <Notice>
              이 정보는 <strong>{storeName}(사업주)</strong>이 받으며, WHALE ERP 는 {storeName}의 위탁을 받아 암호화해 보관합니다.
            </Notice>
            <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
              관리자 화면에도 <strong>가려진 형태로만</strong> 보입니다. 원본은 신고 서류를 만들 때만 꺼내 씁니다.
            </Notice>
          </>
        )}
      </div>
      <Dock>
        <Button variant="ghost" disabled>
          새로 넣기 <span className="text-[12px] font-normal">준비 중</span>
        </Button>
      </Dock>
    </div>
  );
}
