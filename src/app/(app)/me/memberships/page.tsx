import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Alert, Badge, MaskIcon, Notice, PageHeader } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { invitationTypeLabel } from "@/lib/affiliation-requests";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { kstToday } from "@/lib/join";
import { getMyInvitations } from "@/lib/my-invitations";
import { getMyAffiliationRequests, getMyMemberships } from "@/lib/my-profile";
import { pendingRequestRows } from "@/lib/pending-requests";
import { dateLabel, kstMonthDayLabel, membershipStatusOf } from "@/lib/profile";

export const metadata: Metadata = { title: "내 근무지 · Whale ERP" };

// 내 정보의 내 근무지(데모 docs/demo/me 의 sites). 근무지와 고용 형태는 근로계약으로만 바뀌어 여기서 고치지 않는다.
// 맨 위에 「확인을 기다리는 요청」을 고정하고 받은 때 최신순으로 보인다(ME-8, 2026-10-28 김민식 · 재영) — 가입한 사람이 받은 가입 초대
// (WHALEERP-604, 초대 코드 없이 여기서 수락) · 소속 추가 확인 · 복귀 확인(WHALEERP-144, 홈 팝업을 닫아도 여기서 찾는다)을 한 칸에 섞는다.
// 그 아래 지금 근무지, 그 뒤 퇴직한 근무지(ME-7, api includeRetired — 퇴직일 최근 순).
// 근무지마다 근로계약서 · 급여명세서 · 신고 정보로 간다(2026-10-20 기획, api #79). 근로계약서는 그 근무지 계약서 목록으로 가고,
// 급여명세서는 계정 api 가 아직 없어 「준비 중」으로 막아 둔다. 퇴직한 근무지는 신고 정보도 볼 수 없어(api 404) 줄을 두지 않는다.
// 정돈 시안 A안(2026-11-20 사용자 지정): 근무지마다 카드 한 장 — 이름 · 배지, 이름 칸 폭을 고정한 「고용 형태 · 근무 시작」 줄,
// 그 아래 누르는 줄(아이콘 · 이름 · 꺾쇠). 전엔 한 카드에 근무지를 쌓고 세 칸 버튼이었다.

/** 카드 안 이름 · 값 한 줄 — 이름 칸 폭 고정 · 값 왼쪽 정렬(값이 길어도 같은 칸 안에서 줄바꿈). */
function ValueLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-[12px] text-[14px]">
      <span className="w-[64px] shrink-0 text-staff-text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-keep">{children}</span>
    </div>
  );
}

const ACTION_ROW = "flex min-h-[52px] items-center gap-[12px] border-t border-staff-border-light px-[20px] text-[15px]";

/** 카드 아래 누르는 줄(아이콘 · 이름 · 꺾쇠). href 가 없으면 막힌 줄 — 오른쪽에 「준비 중」. */
function ActionRow({ icon, label, href }: { icon: string; label: string; href?: string }) {
  if (!href)
    return (
      <div className={`${ACTION_ROW} text-staff-placeholder`}>
        <MaskIcon src={icon} size={18} />
        <span className="flex-1">
          {label}
        </span>
        <Badge tone="waiting">준비 중</Badge>
      </div>
    );
  return (
    <Link href={href} transitionTypes={["nav-forward"]} className={`${ACTION_ROW} active:bg-staff-info-bg ${PRESS}`}>
      <span className="flex text-staff-text-sub">
        <MaskIcon src={icon} size={18} />
      </span>
      <span className="flex-1">{label}</span>
      <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
    </Link>
  );
}

export default async function MembershipsPage() {
  const [memberships, employmentTypes] = await Promise.all([getMyMemberships(true), getEnumOrEmpty("EmploymentType")]);
  const today = kstToday();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="내 근무지" backHref="/me" />
      <div className="flex flex-col gap-[12px] px-[16px] pt-[16px] pb-[24px] leading-[1.5]">
        {/* 요청 목록은 근무지와 따로 받아 api 가 느려도 근무지를 먼저 보인다(받으면 위에 붙는다). */}
        <Suspense>
          <PendingRequests />
        </Suspense>
        {memberships === null ? (
          <Alert tone="warning">
            <p>근무지를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
          </Alert>
        ) : memberships.items.length === 0 ? (
          <Notice>근로계약이 체결된 근무지가 아직 없습니다.</Notice>
        ) : (
          <ul className="flex flex-col gap-[12px]">
            {memberships.items.map((m) => {
              const status = membershipStatusOf(m.retiredDate, today);
              const retired = status === "retired";
              return (
                <li key={m.staffMemberId} className="overflow-hidden rounded-[16px] border border-staff-border bg-white">
                  <div className="flex flex-col gap-[10px] px-[20px] pt-[18px] pb-[14px]">
                    <div className="flex items-start gap-[10px]">
                      <span className={`flex pt-[4px] ${retired ? "text-staff-text-muted" : "text-staff-text-sub"}`}>
                        <MaskIcon src="/icons/store-small.svg" size={18} />
                      </span>
                      {/* 퇴직한 근무지는 흐리게 보이되 글자 대비가 떨어지지 않게 투명도 대신 보조 글자 토큰을 쓴다. */}
                      <h2 className={`min-w-0 flex-1 text-[17px] font-bold break-keep ${retired ? "text-staff-text-sub" : ""}`}>{m.store.storeName}</h2>
                      {/* 퇴직 예정도 소속이다(퇴직일까지). 배지 글자로 갈라 보인다. */}
                      {retired ? (
                        <Badge tone="waiting">퇴직</Badge>
                      ) : status === "retiring" ? (
                        <Badge tone="waiting">{dateLabel(m.retiredDate!)} 퇴직 예정</Badge>
                      ) : (
                        <Badge tone="working">근무 중</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-[6px] pl-[28px]">
                      <ValueLine label="고용 형태">
                        {labelOf(employmentTypes, m.employmentType)} · {m.jobTitle}
                      </ValueLine>
                      {retired ? (
                        <ValueLine label="근무 기간">
                          {m.hiredDate ? `${dateLabel(m.hiredDate)} – ` : ""}
                          {dateLabel(m.retiredDate!)}
                        </ValueLine>
                      ) : (
                        m.hiredDate && <ValueLine label="근무 시작">{dateLabel(m.hiredDate)}</ValueLine>
                      )}
                    </div>
                  </div>
                  {/* 근로계약서 · 급여명세서 · 신고 정보(2026-10-20 기획). 급여명세서는 계정 api 가 없어 막힌 「준비 중」 줄이다. */}
                  {!retired && (
                    <>
                      {/* 그 근무지 계약서만(ME-7 · TAX-8) — 앱 전역에서 고른 근무지와 관계없다 */}
                      <ActionRow icon="/icons/contract.svg" label="근로계약서" href={`/contracts?store=${m.store.storeId}`} />
                      <ActionRow icon="/icons/nav-pay.svg" label="급여명세서" />
                      <ActionRow icon="/icons/nav-me.svg" label="신고 정보" href={`/me/memberships/${m.staffMemberId}/tax-profile`} />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="px-[4px] pt-[6px] text-[13px] break-keep text-staff-text-muted">
          근무지와 고용 형태는 근로계약에 따라 정해집니다.
          <br />
          변경이 필요하면 근무지 관리자에게 문의해 주세요.
        </p>
      </div>
    </div>
  );
}

/**
 * 확인을 기다리는 요청 — 데모 me 의 sites(ME-8, staff #43): 줄마다 점포 · 「고용 형태 · 받은 날 받음 / 만료일 만료」 · 초대 종류 배지,
 * 그 아래 「내 근무지」 제목. 둘 다 없으면 아무것도 두지 않는다. 한쪽만 못 받았으면 받은 쪽을 보이고 못 받은 사정을 한 줄 덧붙인다
 * (가입 초대는 여기서만 찾는다 — 소속 추가 확인은 홈 팝업 · 알림톡 링크로도 간다).
 */
async function PendingRequests() {
  const [invitations, affiliations, employmentTypes] = await Promise.all([
    getMyInvitations(),
    getMyAffiliationRequests(),
    getEnumOrEmpty("EmploymentType"),
  ]);
  const rows = pendingRequestRows(invitations ?? [], affiliations ?? [], (v) => labelOf(employmentTypes, v), invitationTypeLabel);
  const failed = invitations === null || affiliations === null;
  if (rows.length === 0 && !failed) return null;
  // 둘 다 못 받았으면 요청이 있는지조차 모르니 눈에 띄게 알린다. 한쪽만이면 받은 쪽을 보이고 한 줄 덧붙인다.
  if (invitations === null && affiliations === null)
    return (
      <Alert tone="warning">
        <p>받은 요청을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
      </Alert>
    );
  return (
    <>
      <section aria-labelledby="pending-requests" className="flex flex-col gap-[8px]">
        <h2 id="pending-requests" className="px-[4px] text-[13px] font-semibold text-staff-text-sub">
          확인을 기다리는 요청
        </h2>
        {rows.length > 0 && (
          <ul className="flex flex-col gap-[8px]">
            {rows.map((r) => (
              <li key={r.key}>
                <Link
                  href={r.href}
                  transitionTypes={["nav-forward"]}
                  className={`flex w-full items-start gap-[12px] rounded-[16px] border border-staff-border-light bg-white p-[16px] text-left active:bg-staff-info-bg ${PRESS}`}
                >
                  <span className="flex pt-[3px] text-staff-text-sub">
                    <MaskIcon src="/icons/store-small.svg" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold break-keep">{r.storeName}</span>
                    <span className="block text-[12px] text-staff-text-sub">
                      {r.employment} · {kstMonthDayLabel(r.sentAt)} 받음
                      <br />
                      {kstMonthDayLabel(r.expiresAt)} 만료
                    </span>
                  </span>
                  <Badge tone="warning">{r.kind}</Badge>
                  <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="mt-[6px] -scale-y-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {failed && <p className="px-[4px] text-[12px] text-staff-text-muted">받은 요청 일부를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>}
      </section>
      <h2 className="px-[4px] text-[13px] font-semibold text-staff-text-sub">내 근무지</h2>
    </>
  );
}
