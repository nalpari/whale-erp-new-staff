// 종이 계약 직원의 신고 정보 안내(WHALEERP-775, 운영 정책 CTR-23 「종이 계약 직원은 가입 뒤 날인 없이 신고 정보 입력으로 넘어간다」)의
// 순수 판정. 전자계약은 서명 완료 화면(contracts/[contractId]/done)이 신고 정보 입력으로 잇지만, 종이 계약은 그 화면을 지나지 않아
// 가입 완료 · 근무지 추가(복귀 확인) 완료 · 홈이 이 판정으로 안내한다. 신고 정보를 이미 냈는지는 부른 쪽이 소속마다 조회한다.
// node --test 가 직접 읽는다.
import type { ContractListItem } from "./contracts";
import { membershipStatusOf } from "./profile.ts";

type Membership = { staffMemberId: number; store: { storeId: number }; retiredDate: string | null };
type Contract = Pick<ContractListItem, "storeId" | "status" | "contractMethod">;

/**
 * 서명 완료(종이 계약은 관리자 등록)된 종이 계약이 있는 지금 소속 — 소속 목록 순서 그대로. 퇴직한 소속(퇴직일이 오늘 앞)은 뺀다.
 * 소속 목록(GET /me/memberships)은 퇴직한 소속을 빼지만 퇴직 배치가 늦은 날 섞일 수 있어 다시 본다. today 는 한국 날짜 YYYY-MM-DD.
 */
export function paperSignedMemberships<M extends Membership>(memberships: readonly M[], contracts: readonly Contract[], today: string): M[] {
  const stores = new Set(contracts.filter((c) => c.status === "SIGNED" && c.contractMethod === "PAPER").map((c) => c.storeId));
  return memberships.filter((m) => stores.has(m.store.storeId) && membershipStatusOf(m.retiredDate, today) !== "retired");
}

/**
 * 신고 정보 조회 결과로 그 소속에 넣으라고 안내할지. 조회하지 못했으면(null) keepUnknown 그대로 — 완료 화면은 안내하고(입력 화면이 다시
 * 가른다) 홈 카드는 뺀다. 퇴직한 근무지(`editable: false`)는 넣을 수 없어, 이미 냈으면(`taxProfile`) 넣을 것이 없어 안내하지 않는다.
 * editable 은 false 일 때만 막는다(칸이 없는 옛 api — 처음 넣기 화면과 같다).
 */
export function taxProfileDueOf(tax: { taxProfile: unknown; editable?: boolean } | null, keepUnknown: boolean): boolean {
  if (tax === null) return keepUnknown;
  return tax.editable !== false && !tax.taxProfile;
}

/** 그 소속의 신고 정보 처음 넣기 화면. */
export const taxProfileNewHref = (staffMemberId: number) => `/me/memberships/${staffMemberId}/tax-profile/new`;
