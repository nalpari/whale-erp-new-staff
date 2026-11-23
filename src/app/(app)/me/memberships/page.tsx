import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Alert, Badge, BottomNav, MaskIcon, Notice, PageHeader } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { invitationTypeLabel } from "@/lib/affiliation-requests";
import { formatTelephone } from "@/lib/contract-rules";
import { getContract, getContracts } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { kstToday } from "@/lib/join";
import { getMyInvitations } from "@/lib/my-invitations";
import { getMyAffiliationRequests, getMyMemberships, getMyTaxProfile } from "@/lib/my-profile";
import { pendingRequestRows } from "@/lib/pending-requests";
import { dateLabel, kstMonthDayLabel, membershipStatusOf } from "@/lib/profile";

export const metadata: Metadata = { title: "내 근무지 · Whale ERP" };

// 내 정보의 내 근무지(데모 docs/demo/me 의 sites). 근무지와 고용 형태는 근로계약으로만 바뀌어 여기서 고치지 않는다.
// 맨 위에 「확인을 기다리는 요청」을 고정하고 받은 때 최신순으로 보인다(ME-8, 2026-10-28 김민식 · 재영) — 가입한 사람이 받은 가입 초대
// (WHALEERP-604, 초대 코드 없이 여기서 수락) · 근무지 추가 확인 · 복귀 확인(WHALEERP-144, 홈 팝업을 닫아도 여기서 찾는다)을 한 칸에 섞는다.
// 그 아래 지금 근무지, 그 뒤 퇴직한 근무지(ME-7, api includeRetired — 퇴직일 최근 순).
// 근무지마다 신고 정보 · 근로계약서 · 급여명세서로 간다(2026-10-20 기획, api #79). 근로계약서 · 급여명세서는 그 근무지 것만 거른 목록으로 간다.
// 퇴직한 근무지는 신고 정보도 볼 수 없어(api 404) 세 칸을 두지 않는다.
// 카드(2026-11-23 사용자 지정): 이름 · 배지, 라벨 없는 회색 두 줄(고용 형태 · 직무 / 근무 시작), [지도 보기] · [전화하기](근로계약서의 근무지 주소 · 전화),
// 맨 아래 세 칸(선 아이콘 · 이름, 많이 쓰는 급여명세서가 오른쪽). 맨 위 상태 칩으로 거른다.

/** 카드 안 이름 · 값 한 줄 — 이름 칸 폭 고정 · 값 왼쪽 정렬(값이 길어도 같은 칸 안에서 줄바꿈). */
const ACTION_CELL =
  "flex h-[72px] min-w-0 flex-1 flex-col items-center justify-center gap-[6px] text-[13px] font-medium [&+&]:border-l [&+&]:border-staff-border-light";

/** 카드 맨 아래 세 칸 중 하나(선 아이콘 위 · 이름 아래, 2026-11-23 사용자 지정). 신고 정보는 급여 계좌가 들어 있는 것이 보이게 「신고정보 · 계좌」 한 줄(칸이 좁아 붙여 쓴다) */
function ActionCell({ icon, label, href, badge }: { icon: string; label: string; href: string; badge?: ReactNode }) {
  return (
    <Link href={href} transitionTypes={["nav-forward"]} className={`${ACTION_CELL} text-staff-text active:bg-staff-info-bg ${PRESS}`}>
      <span className="relative flex text-staff-text-sub">
        <MaskIcon src={icon} size={20} />
        {badge}
      </span>
      {label}
    </Link>
  );
}

/**
 * 근무지별 위치 · 연락처 — 계정 근무지 응답(MyStoreDto)엔 주소 · 전화가 없어, 그 점포의 내 근로계약 중 api 순서 첫 장의 상세에서 「사업주」의 근무지 주소 · 전화를 가져온다
 * (2026-11-23 사용자 지정 — api 를 고치지 않는 안). 서명한 계약은 서명할 때의 값이라 점포가 바꾸면 옛 값일 수 있다.
 * 값이 없거나 못 받으면 그 줄을 두지 않는다(목록은 그대로 보인다).
 */
type StoreContact = { address: string | null; mapQuery: string | null; phone: string | null };
async function getStoreContacts(): Promise<Map<number, StoreContact>> {
  const contacts = new Map<number, StoreContact>();
  try {
    const firstByStore = new Map<number, number>();
    for (const c of await getContracts()) if (!firstByStore.has(c.storeId)) firstByStore.set(c.storeId, c.contractId);
    const details = await Promise.all(
      [...firstByStore.values()].map((id) =>
        getContract(id).catch((error) => {
          unstable_rethrow(error); // 로그인 만료 이동(redirect)은 삼키지 않는다
          return null;
        }),
      ),
    );
    for (const d of details) {
      if (!d) continue;
      const e = d.employer;
      const address = [e.storeAddress, e.storeAddressDetail].filter(Boolean).join(" ") || null;
      // 지도 검색은 기본 주소만 — 층 · 호수까지 넣으면 카카오맵이 찾지 못한다
      contacts.set(d.storeId, { address, mapQuery: e.storeAddress, phone: formatTelephone(e.storePhone) });
    }
  } catch (error) {
    unstable_rethrow(error);
  }
  return contacts;
}

/**
 * 근무지 위치 · 전화 — 반반 나눈 두 버튼(2026-11-23 사용자 지정). 주소는 다 보이지 않고 [지도 보기]가 카카오맵에서 그 주소를 찾는다
 * (앱이 있으면 앱, 없으면 웹). 하나만 있으면 그 버튼이 줄을 채우고, 둘 다 없으면 줄을 두지 않는다.
 */
async function StoreContactButtons({
  storeId,
  storeName,
  contacts,
}: {
  storeId: number;
  storeName: string;
  contacts: Promise<Map<number, StoreContact>>;
}) {
  const contact = (await contacts).get(storeId);
  if (!contact || (!contact.mapQuery && !contact.phone)) return null;
  return (
    <div className="flex gap-[8px] pt-[4px]">
      {contact.mapQuery && (
        <a
          href={`https://map.kakao.com/link/search/${encodeURIComponent(contact.mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${storeName} 위치 지도에서 보기 — ${contact.address}`}
          className={`flex h-[36px] min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[8px] border border-staff-border bg-white text-[13px] font-medium text-staff-text ${PRESS}`}
        >
          <span className="flex text-staff-text-sub">
            <MaskIcon src="/icons/map-pin-line.svg" size={15} />
          </span>
          지도 보기
        </a>
      )}
      {contact.phone && (
        <a
          href={`tel:${contact.phone.replace(/-/g, "")}`}
          aria-label={`${storeName} 전화하기 ${contact.phone}`}
          className={`flex h-[36px] min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[8px] border border-staff-border bg-white text-[13px] font-medium text-staff-text ${PRESS}`}
        >
          <span className="flex text-staff-text-sub">
            <MaskIcon src="/icons/phone-call.svg" size={15} />
          </span>
          전화하기
        </a>
      )}
    </div>
  );
}

/**
 * 신고 정보를 아직 내지 않은 근무지 — 「신고정보 · 계좌」 아이콘 오른쪽 위에 빨간 꼬리표 「미입력」(2026-11-23 사용자 지정). 근무지 목록 api 에
 * 입력 여부가 없어 그 소속의 신고 정보를 따로 받는다(Suspense — 목록은 먼저 뜬다). 못 받으면 아무것도 두지 않는다.
 * 세 칸 높이가 흔들리지 않게 아이콘 위에 띄운다.
 */
async function TaxMissingBadge({ staffMemberId }: { staffMemberId: number }) {
  const tax = await getMyTaxProfile(staffMemberId);
  if (!tax || tax.taxProfile) return null;
  return (
    <span className="absolute -top-[6px] left-[14px] rounded-full bg-staff-error px-[5px] text-[10px] leading-[16px] font-semibold whitespace-nowrap text-white">
      미입력
    </span>
  );
}

type StatusFilter = "all" | "working" | "retiring" | "retired";
const STATUS_CHIPS: readonly [StatusFilter, string][] = [
  ["all", "전체"],
  ["working", "근무 중"],
  ["retiring", "퇴직 예정"],
  ["retired", "퇴직"],
];
const EMPTY_TEXT: Record<Exclude<StatusFilter, "all">, string> = {
  working: "근무 중인 근무지가 없습니다.",
  retiring: "퇴직 예정인 근무지가 없습니다.",
  retired: "퇴직한 근무지가 없습니다.",
};
const statusFilterOf = (raw: string | string[] | undefined): StatusFilter => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "working" || v === "retiring" || v === "retired" ? v : "all";
};

/**
 * 맨 위 상태 칩 — [전체 N] [근무 중 N] [퇴직 예정 N] [퇴직 N](0건도 보인다). 누르면 그 상태의 근무지만 보이고 주소(?status=)에 남아 뒤로 갔다 와도
 * 그대로다. 고른 칩은 남보라(급여 필터 칩과 같은 모양)(2026-11-23 사용자 지정)
 */
function StatusChips({ counts, current }: { counts: Record<StatusFilter, number>; current: StatusFilter }) {
  return (
    <nav aria-label="근무지 상태" className="flex flex-wrap gap-[8px]">
      {STATUS_CHIPS.map(([key, label]) => {
        const on = key === current;
        return (
          <Link
            key={key}
            href={key === "all" ? "/me/memberships" : `/me/memberships?status=${key}`}
            replace
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={`flex h-[36px] items-center gap-[4px] rounded-full border px-[14px] text-[13px] font-semibold ${
              on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text-sub"
            }`}
          >
            {label} <span className="tabular-nums">{counts[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default async function MembershipsPage({ searchParams }: PageProps<"/me/memberships">) {
  const filter = statusFilterOf((await searchParams).status);
  // 연락처(계약 목록 + 근무지 수만큼 상세)는 기다리지 않는다 — 카드마다 Suspense 로 받아 근무지 목록이 먼저 뜬다
  const storeContacts = getStoreContacts();
  const [memberships, employmentTypes] = await Promise.all([getMyMemberships(true), getEnumOrEmpty("EmploymentType")]);
  const today = kstToday();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="내 근무지" backHref="/me" />
      <div className="flex flex-col gap-[12px] px-[16px] pt-[20px] pb-[24px] leading-[1.5]">
        {memberships !== null && memberships.items.length > 0 && (
          <StatusChips
            current={filter}
            counts={{
              all: memberships.items.length,
              working: memberships.items.filter((m) => membershipStatusOf(m.retiredDate, today) === "working").length,
              retiring: memberships.items.filter((m) => membershipStatusOf(m.retiredDate, today) === "retiring").length,
              retired: memberships.items.filter((m) => membershipStatusOf(m.retiredDate, today) === "retired").length,
            }}
          />
        )}
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
        ) : filter !== "all" && !memberships.items.some((m) => membershipStatusOf(m.retiredDate, today) === filter) ? (
          <Notice>{EMPTY_TEXT[filter]}</Notice>
        ) : (
          <ul className="flex flex-col gap-[12px]">
            {memberships.items
              .filter((m) => filter === "all" || membershipStatusOf(m.retiredDate, today) === filter)
              .map((m) => {
                const status = membershipStatusOf(m.retiredDate, today);
                const retired = status === "retired";
                return (
                  <li key={m.staffMemberId} className="overflow-hidden rounded-[16px] border border-staff-border bg-white">
                    <div className="flex flex-col gap-[10px] px-[20px] pt-[18px] pb-[14px]">
                      <div className="flex items-start gap-[10px]">
                        {/* 이 화면은 카드마다 근무지라 점포명 앞 아이콘을 두지 않는다 — 아래 메뉴 줄 아이콘과 겹쳐 헷갈렸다(2026-11-23 사용자 지정) */}
                        {/* 퇴직한 근무지는 흐리게 보이되 글자 대비가 떨어지지 않게 투명도 대신 보조 글자 토큰을 쓴다. */}
                        <h2 className={`min-w-0 flex-1 text-[17px] font-bold break-keep ${retired ? "text-staff-text-sub" : ""}`}>
                          {m.store.storeName}
                        </h2>
                        {/* 퇴직 예정도 소속이다(퇴직일까지). 배지 글자로 갈라 보인다. */}
                        {retired ? (
                          <Badge tone="waiting">퇴직</Badge>
                        ) : status === "retiring" ? (
                          <Badge tone="waiting">{dateLabel(m.retiredDate!)} 퇴직 예정</Badge>
                        ) : (
                          <Badge tone="working">근무 중</Badge>
                        )}
                      </div>
                      {/* 고용 형태 · 근무 기간은 이름(라벨) 없이 점포명 아래 회색 두 줄 — 라벨 칸 때문에 안쪽으로 들여 써져 보였다(2026-11-23 사용자 지정) */}
                      <div className="flex flex-col gap-[2px] text-[14px] text-staff-text-sub">
                        <p>
                          {labelOf(employmentTypes, m.employmentType)} · {m.jobTitle}
                        </p>
                        {retired ? (
                          <p>
                            {m.hiredDate ? `${dateLabel(m.hiredDate)} – ` : ""}
                            {dateLabel(m.retiredDate!)} 근무
                          </p>
                        ) : (
                          m.hiredDate && <p>{dateLabel(m.hiredDate)}부터 근무</p>
                        )}
                        {/* 퇴직한 근무지에는 [지도 보기] · [전화하기]를 두지 않는다 — 더 다니지 않는 곳이다(2026-11-23 사용자 지정) */}
                        {!retired && (
                          <Suspense>
                            <StoreContactButtons storeId={m.store.storeId} storeName={m.store.storeName} contacts={storeContacts} />
                          </Suspense>
                        )}
                      </div>
                    </div>
                    {/* 신고 정보 · 근로계약서 · 급여명세서 한 줄 세 칸 — 많이 쓰는 것을 오른쪽에(2026-11-23 사용자 지정, 처음 기획 2026-10-20). */}
                    {!retired && (
                      <div className="flex border-t border-staff-border-light">
                        <ActionCell
                          icon="/icons/id-card-line.svg"
                          label="신고정보 · 계좌"
                          href={`/me/memberships/${m.staffMemberId}/tax-profile`}
                          badge={
                            <Suspense>
                              <TaxMissingBadge staffMemberId={m.staffMemberId} />
                            </Suspense>
                          }
                        />
                        {/* 그 근무지 계약서만(ME-7 · TAX-8) — 앱 전역에서 고른 근무지와 관계없다 */}
                        <ActionCell icon="/icons/doc-line.svg" label="근로계약서" href={`/contracts?store=${m.store.storeId}`} />
                        {/* 그 근무지 급여명세서만 — 급여 화면의 점포 칩(?store=)으로 거른다(2026-11-23 사용자 지정, 전엔 api 가 없어 막힌 「준비 중」 칸) */}
                        <ActionCell icon="/icons/payslip-line.svg" label="급여명세서" href={`/pay?from=sites&store=${m.store.storeId}`} />
                      </div>
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
      {/* 목록 · 보기 화면은 하단 메뉴를 둔다(입력 화면은 두지 않는다 — 탭을 눌러 쓰던 내용을 잃지 않게, 2026-11-23 사용자 지정) */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/me" />
      </div>
    </div>
  );
}

/**
 * 확인을 기다리는 요청 — 데모 me 의 sites(ME-8, staff #43): 줄마다 점포 · 「고용 형태 · 받은 날 받음 / 만료일 만료」 · 초대 종류 배지,
 * 그 아래 「내 근무지」 제목. 둘 다 없으면 아무것도 두지 않는다. 한쪽만 못 받았으면 받은 쪽을 보이고 못 받은 사정을 한 줄 덧붙인다
 * (가입 초대는 여기서만 찾는다 — 근무지 추가 요청(144)은 홈 팝업 · 알림톡 링크로도 간다).
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
