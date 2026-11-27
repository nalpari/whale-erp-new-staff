import type { Schemas } from "@/lib/api";
import type { ContractListItem } from "@/lib/contracts";
import { kstToday } from "@/lib/join";
import { taxProfileDueMemberships, taxProfileNewHref } from "@/lib/paper-tax-profile";
import { WaitingCard } from "./sign-waiting-cards";

/**
 * 홈의 신고 정보 카드(WHALEERP-775, CTR-23) — 근로계약을 종이로 맺은 소속에 신고 정보가 없으면 「○○ 신고 정보를 입력해 주세요」.
 * 종이 계약은 날인이 없어 서명 완료 화면(신고 정보 입력으로 잇는 곳)을 지나지 않는다. 가입 완료에서 넘어가지 않았어도 여기서 다시 간다.
 * 서명 대기 카드와 같은 카드다. 신고 정보를 냈는지는 소속 목록의 taxProfileSubmitted 로 본다 — 홈을 열 때마다 소속마다 신고 정보를 풀어
 * 보지 않는다. 소속 · 계약 목록을 못 받았으면 두지 않는다.
 * 앱 전체를 막지는 않는다(TAX-05 전체 차단은 하지 않기로 2026-10-28).
 */
export async function TaxDueCards({
  contracts,
  memberships,
}: {
  contracts: Promise<ContractListItem[] | null>;
  memberships: readonly Schemas["MyMembershipDto"][] | null;
}) {
  const items = await contracts;
  if (!items || !memberships) return null;
  const due = taxProfileDueMemberships(memberships, items, kstToday());
  if (due.length === 0) return null;
  return (
    <div className="flex flex-col gap-[8px]">
      {due.map((m) => (
        <WaitingCard
          key={m.staffMemberId}
          href={taxProfileNewHref(m.staffMemberId)}
          icon="/icons/id-card-line.svg"
          title={`${m.store.storeName} 신고 정보를 입력해 주세요`}
          sub="급여 지급과 신고에 필요한 정보입니다"
        />
      ))}
    </div>
  );
}
