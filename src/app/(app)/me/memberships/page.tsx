import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Alert, Badge, MaskIcon, Notice, PageHeader } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { AffiliationRequestList } from "@/app/_components/affiliation-request-list";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getMyAffiliationRequests, getMyMemberships } from "@/lib/my-profile";
import { dateLabel } from "@/lib/profile";

export const metadata: Metadata = { title: "소속 근무지 · Whale ERP" };

// 내 정보의 소속 근무지(데모 docs/demo/me 의 sites). 조회만 한다 — 소속과 고용 형태는 근로계약으로만 바뀐다.
// 소속마다 근로계약서 · 급여명세서 · 신고 정보로 간다(2026-10-20 기획, api #79). 근로계약서 · 급여명세서는 계정 api 가 아직 없어
// 「준비 중」으로 막아 둔다.
// 답하지 않은 소속 추가 요청(WHALEERP-144)은 소속 위에 따로 보인다 — 홈 팝업을 닫아도 여기서 찾아 확인 화면으로 간다.
// 소속 한 줄의 버튼 셋. 외곽선 버튼(Button outline)과 같은 44px · radius 12 · 14px semibold 지만, 세 칸이 한 줄(휴대전화에서 한 칸
// 약 100px)에 들어가도록 좌우 여백만 18 → 8 로 줄였다. 공통 Button 은 className 을 받지 않아 여기서 그린다.
const ROW_BUTTON = `inline-flex h-[44px] w-full items-center justify-center rounded-[12px] border border-staff-border bg-white px-[8px] text-[14px] font-semibold whitespace-nowrap text-staff-text active:bg-staff-primary-inactive ${PRESS}`;

export default async function MembershipsPage() {
  const [memberships, employmentTypes] = await Promise.all([getMyMemberships(), getEnumOrEmpty("EmploymentType")]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="소속 근무지" backHref="/me" />
      <div className="flex flex-col gap-[16px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
        {/* 요청 목록은 소속과 따로 받아 api 가 느려도 소속을 먼저 보인다(받으면 위에 붙는다). */}
        <Suspense>
          <PendingRequests />
        </Suspense>
        {memberships === null ? (
          <Alert tone="warning">
            <p>소속 근무지를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
          </Alert>
        ) : memberships.items.length === 0 ? (
          <Notice>근로계약이 체결된 근무지가 아직 없습니다.</Notice>
        ) : (
          <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
            {memberships.items.map((m) => (
              <li key={m.staffMemberId} className="flex flex-col gap-[10px] py-[14px]">
                <div className="flex items-start gap-[12px]">
                  <span className="flex pt-[3px] text-staff-text-sub">
                    <MaskIcon src="/icons/store-small.svg" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{m.store.storeName}</span>
                    <span className="block text-[12px] text-staff-text-sub">
                      {labelOf(employmentTypes, m.employmentType)} · {m.jobTitle}
                      {m.hiredDate && ` · ${dateLabel(m.hiredDate)}부터`}
                    </span>
                  </span>
                  {/* 퇴직 예정도 소속이다(퇴직일 전까지). 배지 글자로 갈라 보인다. */}
                  {m.retiredDate ? <Badge tone="waiting">{dateLabel(m.retiredDate)} 퇴직 예정</Badge> : <Badge tone="working">근무 중</Badge>}
                </div>
                {/* 근로계약서 · 급여명세서 · 신고 정보(2026-10-20 기획). 앞의 둘은 계정 api 가 없어 흐린 「준비 중」 버튼이다. */}
                <div className="grid grid-cols-3 gap-[8px]">
                  <button type="button" disabled className={ROW_BUTTON}>
                    근로계약서<span className="sr-only"> · 준비 중</span>
                  </button>
                  <button type="button" disabled className={ROW_BUTTON}>
                    급여명세서<span className="sr-only"> · 준비 중</span>
                  </button>
                  <Link href={`/me/memberships/${m.staffMemberId}/tax-profile`} transitionTypes={["nav-forward"]} className={ROW_BUTTON}>
                    신고 정보
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[12px] text-staff-text-muted">
          근로계약서 · 급여명세서는 준비 중입니다. 소속과 고용 형태는 근로계약이 새로 체결되어야 바뀝니다. 여기서는 고칠 수 없습니다.
        </p>
      </div>
    </div>
  );
}

/** 답하지 않은 소속 추가 요청. 없거나 못 받았으면 아무것도 두지 않는다 — 홈 팝업 · 알림톡 링크로도 확인 화면에 갈 수 있다. */
async function PendingRequests() {
  const requests = await getMyAffiliationRequests();
  if (!requests?.length) return null;
  return (
    <section aria-labelledby="affiliation-requests" className="flex flex-col gap-[8px]">
      <h2 id="affiliation-requests" className="px-[4px] text-[13px] font-semibold text-staff-text-sub">
        확인을 기다리는 요청
      </h2>
      <AffiliationRequestList items={requests} />
    </section>
  );
}
