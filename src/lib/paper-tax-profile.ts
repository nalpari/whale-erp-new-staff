// 종이 계약 직원의 신고 정보 안내(WHALEERP-775, 운영 정책 CTR-23 「종이 계약 직원은 가입 뒤 날인 없이 신고 정보 입력으로 넘어간다」)의
// 순수 판정. 전자계약은 서명 완료 화면(contracts/[contractId]/done)이 신고 정보 입력으로 잇지만, 종이 계약은 그 화면을 지나지 않아
// 가입 완료 · 근무지 추가(복귀 확인) 완료 · 홈이 이 판정으로 안내한다. 신고 정보를 냈는지는 소속 목록의 taxProfileSubmitted(api)로 본다.
// node --test 가 직접 읽는다.
import type { ContractListItem } from "./contracts";
import { membershipStatusOf } from "./profile.ts";

type Membership = { staffMemberId: number; retiredDate: string | null };
type Contract = Pick<ContractListItem, "staffMemberId" | "status" | "contractMethod" | "awaitingSignature">;

/**
 * 서명 완료(종이 계약은 관리자 등록)된 종이 계약이 있는 지금 소속 — 소속 목록 순서 그대로. 퇴직한 소속(퇴직일이 오늘 앞)은 뺀다.
 * 소속 목록(GET /me/memberships)은 퇴직한 소속을 빼지만 퇴직 배치가 늦은 날 섞일 수 있어 다시 본다. today 는 한국 날짜 YYYY-MM-DD.
 * 계약과 소속은 직원 레코드 id(staffMemberId)로 맞춘다 — 근무지로 맞추면 퇴직 뒤 재입사한 직원의 옛 레코드 종이 계약이(퇴직 처리는 체결
 * 완료 계약을 닫지 않는다, api contract-duplicates) 지금 소속을 대상으로 만든다(재입사는 새 레코드, api #65). 같은 소속에 서명을 기다리는
 * 계약이 있으면 서명이 먼저라 뺀다(서명 대기 카드 · 팝업이 안내한다). staffMemberId 가 없는 옛 api 응답이면 아무 소속도 대상이 아니다.
 */
export function paperSignedMemberships<M extends Membership>(memberships: readonly M[], contracts: readonly Contract[], today: string): M[] {
  const paper = new Set(contracts.filter((c) => c.status === "SIGNED" && c.contractMethod === "PAPER").map((c) => c.staffMemberId));
  const signing = new Set(contracts.filter((c) => c.awaitingSignature).map((c) => c.staffMemberId));
  return memberships.filter(
    (m) => paper.has(m.staffMemberId) && !signing.has(m.staffMemberId) && membershipStatusOf(m.retiredDate, today) !== "retired",
  );
}

/**
 * 서명 완료 종이 계약이 있는 지금 소속 중 신고 정보를 아직 내지 않은 것 — 소속 목록(GET /me/memberships)의 taxProfileSubmitted 로
 * 가른다(api 가 신고 정보 조회와 같은 판정으로 싣는다 — 소속마다 신고 정보를 풀어 보지 않는다). 칸이 없는 옛 api 응답이면 냈는지
 * 모르므로 안내하지 않는다.
 */
export function taxProfileDueMemberships<M extends Membership & { taxProfileSubmitted?: boolean }>(
  memberships: readonly M[],
  contracts: readonly Contract[],
  today: string,
): M[] {
  return paperSignedMemberships(memberships, contracts, today).filter((m) => m.taxProfileSubmitted === false);
}

/**
 * 종이 계약 소속의 신고 정보를 냈다고 확인했는지 — 가입 완료가 「할 일 없음」을 확정할 때 쓴다. 냈다는 값(true)이 있어야만 참이고,
 * 짝을 맞추지 못했거나(staffMemberId 없음) 냈는지 모르면(칸이 없는 옛 api) 거짓이라 지금 안내를 그대로 둔다.
 */
export function paperTaxProfileConfirmed<M extends Membership & { taxProfileSubmitted?: boolean }>(
  memberships: readonly M[],
  contracts: readonly Contract[],
  today: string,
): boolean {
  return paperSignedMemberships(memberships, contracts, today).some((m) => m.taxProfileSubmitted === true);
}

/**
 * 근무지 추가 · 복귀 확인 수락에 함께 온 계약(contractIds)이 모두 종이 계약인지 — 그러면 날인할 것이 없어 신고 정보 입력으로 잇는다.
 * found 는 내 계약 목록에서 찾은 그 계약들이다. 하나라도 찾지 못했으면(목록 실패 · 늦음) false — 못 찾은 것이 전자계약이면 서명 안내가 사라져서다.
 * 겹친 id 는 하나로 본다.
 */
export function allPaper(contractIds: readonly number[], found: readonly Pick<ContractListItem, "contractId" | "contractMethod">[]): boolean {
  const ids = new Set(contractIds);
  return ids.size > 0 && ids.size === new Set(found.map((c) => c.contractId)).size && found.every((c) => c.contractMethod === "PAPER");
}

/** 그 소속의 신고 정보 처음 넣기 화면. */
export const taxProfileNewHref = (staffMemberId: number) => `/me/memberships/${staffMemberId}/tax-profile/new`;
