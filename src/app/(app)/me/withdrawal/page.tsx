import type { Metadata } from "next";
import { PageHeader } from "@/components/common";
import type { Schemas } from "@/lib/api";
import { authedRequest } from "@/lib/session";
import { WithdrawalForm } from "./withdrawal-form";

export const metadata: Metadata = { title: "회원 탈퇴 · Whale ERP" };

// 내 정보 → 「회원 탈퇴」(WHALEERP-770). 들어올 때 탈퇴할 수 있는지(재직 근무지 · 종료될 대기 계약)를 받는다. 못 받으면 error.tsx.
export default async function WithdrawalPage() {
  const eligibility = await authedRequest<Schemas["MyWithdrawalEligibilityResponseDto"]>("/me/profile/withdrawal-eligibility");
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="회원 탈퇴" backHref="/me" />
      <WithdrawalForm
        canWithdraw={eligibility.canWithdraw}
        employedStores={eligibility.employedStores}
        pendingContractCount={eligibility.pendingContractCount}
      />
    </div>
  );
}
