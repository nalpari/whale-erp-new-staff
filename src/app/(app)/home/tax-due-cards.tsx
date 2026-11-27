import Link from "next/link";
import { MaskIcon } from "@/components/common";
import type { ContractListItem } from "@/lib/contracts";
import { paperTaxProfileDue } from "@/lib/my-profile";
import { taxProfileNewHref } from "@/lib/paper-tax-profile";
import type { Schemas } from "@/lib/api";
import { CARD } from "./sign-waiting-cards";

/**
 * 홈의 신고 정보 카드(WHALEERP-775, CTR-23) — 근로계약을 종이로 맺은 소속에 신고 정보가 없으면 「○○점 신고 정보를 입력해 주세요」.
 * 종이 계약은 날인이 없어 서명 완료 화면(신고 정보 입력으로 잇는 곳)을 지나지 않는다. 가입 완료에서 넘어가지 않았어도 여기서 다시 간다.
 * 서명 대기 카드와 같은 모양이다. 소속 · 계약 목록을 못 받았거나 신고 정보를 조회하지 못한 소속은 두지 않는다 — 이미 낸 직원에게 띄우지 않게.
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
  const due = await paperTaxProfileDue(memberships, items, false);
  if (due.length === 0) return null;
  return (
    <div className="flex flex-col gap-[8px]">
      {due.map((m) => (
        <Link key={m.staffMemberId} href={taxProfileNewHref(m.staffMemberId)} transitionTypes={["nav-forward"]} className={CARD}>
          <MaskIcon src="/icons/id-card-line.svg" size={18} />
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[14px] font-semibold break-keep">{m.store.storeName} 신고 정보를 입력해 주세요</span>
            <span className="sr-only">, </span>
            <span className="text-[12px]">급여 지급과 신고에 필요한 정보입니다</span>
          </span>
          <MaskIcon src="/icons/chevron-right-muted.svg" size={12} flipY />
        </Link>
      ))}
    </div>
  );
}
