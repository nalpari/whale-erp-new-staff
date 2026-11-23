import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Alert, Button, Dock, IconTile, Notice, PageHeader } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCodesOrEmpty } from "@/lib/codes";
import { labelOf } from "@/lib/enums";
import { getMyMemberships, getMyTaxProfile } from "@/lib/my-profile";
import { kstDateTimeLabel } from "@/lib/profile";
import { parseStaffMemberId, purposeItems, taxViewAfterChange } from "@/lib/tax-profile";
import { TAX_KEEP_TEXT } from "@/app/_components/tax-profile-parts";
import { WorkplaceBox } from "@/app/_components/workplace-box";
import { ChangedToast } from "../../../changed-toast";

export const metadata: Metadata = { title: "신고 정보 · Whale ERP" };

const BOX = "rounded-[16px] border border-staff-border bg-staff-bg";

/** 가린 값 상자 — 이름(15 bold) · 값(18 bold) · 안내(13 muted). */
function ValueBox({ label, value, help }: { label: string; value: string; help: ReactNode }) {
  return (
    <div className={`${BOX} flex flex-col gap-[6px] p-[18px]`}>
      <p className="text-[15px] font-bold">{label}</p>
      <p className="text-[18px] font-bold tabular-nums">{value}</p>
      <p className="text-[13px] leading-[1.4] text-staff-text-muted">{help}</p>
    </div>
  );
}

/** 등록 정보 한 줄 — 이름(13 muted) 위 · 값(14) 아래. 이름 칸을 옆에 두면 수집 근거처럼 긴 값이 좁은 칸에서 어지럽게 꺾였다. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[4px] border-t border-staff-border-light px-[18px] py-[14px] first:border-t-0">
      <dt className="text-[13px] text-staff-text-muted">{label}</dt>
      <dd className="text-[14px]">{children}</dd>
    </div>
  );
}

/** 회색 점 목록 — 줄이 넘어가도 글자 시작선이 점 뒤에 맞는다. */
function DotList({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-[2px]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-[6px]">
          <span aria-hidden className="text-staff-placeholder">
            ·
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** 수집 근거 한 항목 — 대상(이용 목적 항목과 같은 14)을 앞세우고 조문 · 뜻은 작게(12 muted). 조문 번호는 법무 확인 필요(ATT-8). */
function BasisItem({ target, article, meaning }: { target: string; article: string; meaning: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p>{target}</p>
      <p className="pl-[0.5em] text-[12px] leading-[1.5] text-staff-text-muted">
        「개인정보 보호법」 {article}
        <br />
        {meaning}
      </p>
    </div>
  );
}

const LOCK = (
  <>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </>
);
const EYE = (
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

/** 개인정보 보호 한 줄 — 흰 동그라미 아이콘 · 제목(14 semibold) · 설명(13 sub). */
function GuardItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-[10px]">
      <span aria-hidden className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-white text-staff-text-sub">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[13px] leading-[1.5] text-staff-text-sub">{children}</p>
      </div>
    </div>
  );
}

// 소속별 신고 정보(TAX-8). 기준: 데모 docs/demo/tax 의 view(「등록된 신고 정보」). 가린 값만 보인다(원문은 api 가 내려 주지 않는다).
// 정돈 시안(2026-11-20 사용자 지정): 흰 바탕 · 근무지 상자(점포 아이콘 · 「근무지」 · 이름, 큰 제목은 화면 제목 줄과 겹쳐 뺐다), 가린 값 · 등록 정보 · 개인정보 보호를 연회색 둥근 상자로.
// 이용 목적은 점 목록, 수집 근거는 개인정보 보호법 조문(법무 확인 필요 · 3팀 확인), 보관 · 확인 범위 문구는 운영 정책 TAX-08 을 다듬은 것(3팀 확인).
// 「새로 넣기」(데모 form)는 이미 낸 신고 정보가 있을 때만 보이고 `./edit` 로 간다(WHALEERP-333). 아직 없으면 날인 뒤 흐름의
// 처음 넣기(`./new`, WHALEERP-150)로 가는 「넣기」를 둔다 — 날인 뒤 흐름을 중간에 닫은 직원이 다시 넣는 길이다.
// 고치고 돌아오면 `?changed=1` 로 와 알림을 띄우고 주소에서 지운다 — 다시 조회가 실패해도 지우고, 안내에 저장은 됐다고 덧붙인다(PR #26 참고). 내 소속이 아니면(퇴직 · 남의 id) 404 다.
const EMPTY_GUIDE: readonly [string, string][] = [
  ["왜 필요한가요?", "근무지가 급여 세금(원천징수)을 신고하고, 급여를 이체하는 데 사용합니다."],
  ["언제 입력하나요?", "근로계약서에 서명한 직후 입력합니다."],
  ["입력하지 않으면?", "근무지가 급여 계좌를 알 수 없어 급여 이체가 늦어질 수 있습니다."],
];

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
    <div className="flex flex-1 flex-col bg-white">
      <PageHeader title="신고 정보" backHref="/me/memberships" />
      <div className="flex flex-1 flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5] break-keep">
        {tax === null ? (
          <Alert tone="warning">
            <p>{after.unavailable}</p>
          </Alert>
        ) : !profile ? (
          // 빈 상태는 급여명세서 빈 화면처럼 아이콘 · 문구를 가운데에(2026-11-23 사용자 지정) — 맨 위 작은 안내 상자 아래가 휑했다
          <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[40px] text-center">
            <span className="mb-[6px] flex">
              <IconTile src="/icons/id-card-line.svg" size={44} />
            </span>
            <p className="text-[17px] font-bold">입력한 신고 정보가 없습니다</p>
            <p className="text-[14px] text-staff-text-sub">{storeName}</p>
            <p className="pt-[8px] text-[14px] text-staff-text-sub">
              근로계약서에 서명했다면
              <br />
              지금 입력해 주세요.
            </p>
            {/* 왜 · 언제 · 안 하면 — 신고 정보 정책 TAX-02 · 04 · 08. 앱 사용은 막지 않으므로 「늦어질 수 있습니다」까지만 말한다(2026-11-23 사용자 지정) */}
            <dl className="mt-[17px] flex w-full flex-col gap-[12px] rounded-[16px] bg-staff-bg px-[18px] py-[16px] text-left text-[13px] leading-[1.6]">
              {EMPTY_GUIDE.map(([q, a]) => (
                <div key={q}>
                  <dt className="font-semibold text-staff-text">
                    <span className="mr-[4px] text-staff-primary/50">Q.</span>
                    {q}
                  </dt>
                  <dd className="text-staff-text-sub">{a}</dd>
                </div>
              ))}
            </dl>
            {/* 입력 버튼은 화면 맨 아래 대신 안내 바로 아래에 — 빈 화면에서 멀리 떨어져 있었다(2026-11-23 사용자 지정) */}
            <div className="mt-[20px] w-full">
              <Button href={`/me/memberships/${staffMemberId}/tax-profile/new`} transitionTypes={["nav-forward"]}>
                신고 정보 입력하기
              </Button>
            </div>
          </div>
        ) : (
          <>
            <WorkplaceBox name={storeName} />
            <ValueBox
              label="주민등록번호"
              value={profile.rrnMasked}
              help={
                <>
                  개인정보 보호를 위해 뒷자리는 표시하지 않습니다.
                  <br />
                  변경하려면 다시 입력해 주세요.
                </>
              }
            />
            <ValueBox
              label="급여 계좌"
              value={`${labelOf(banks, profile.bankCode)} ${profile.payrollAccountNumberMasked}`}
              help="변경된 계좌는 다음 급여부터 적용됩니다."
            />
            <dl className={`${BOX} overflow-hidden`}>
              <InfoRow label="등록 일시">{kstDateTimeLabel(profile.collectedAt)}</InfoRow>
              <InfoRow label="이용 목적">
                <DotList items={purposeItems(profile.purpose)} />
              </InfoRow>
              <InfoRow label="수집 근거">
                <div className="flex flex-col gap-[10px]">
                  <BasisItem target="주민등록번호" article="제24조의2 제1항 제1호" meaning="법령에서 처리를 요구하는 경우" />
                  <BasisItem target="급여 계좌" article="제15조 제1항 제4호" meaning="계약의 이행을 위해 필요한 경우" />
                </div>
              </InfoRow>
            </dl>
            <section className="mt-[8px] flex flex-col gap-[8px]">
              <h2 className="px-[4px] text-[14px] font-semibold text-staff-text-sub">개인정보 보호</h2>
              <div className={`${BOX} flex flex-col gap-[14px] px-[18px] py-[16px]`}>
                <GuardItem icon={LOCK} title="정보 암호화 및 보관">
                  {TAX_KEEP_TEXT}
                </GuardItem>
                <GuardItem icon={EYE} title="사업주 확인 범위">
                  근로계약을 맺은 사업주에게는 주민등록번호 일부만 표시되며, 급여 계좌는 급여 지급을 위해 전체 표시됩니다.
                </GuardItem>
              </div>
            </section>
          </>
        )}
      </div>
      {profile ? (
        <Dock>
          <Button href={`/me/memberships/${staffMemberId}/tax-profile/edit`}>다시 입력하기</Button>
        </Dock>
      ) : null}
      {changed && (
        <ChangedToast path={`/me/memberships/${staffMemberId}/tax-profile`}>{after.toast ? "신고 정보를 바꿨습니다" : undefined}</ChangedToast>
      )}
    </div>
  );
}
