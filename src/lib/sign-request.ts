// 서명 요청 팝업(WHALEERP-148, 데모 home 의 sign-req)의 순수 판정 — 띄울 계약 고르기, 「다음에 하기」로 기억할 값. 화면은
// src/app/(app)/home/sign-request-popup.tsx, 기억은 sign-request-popup-memory.ts. node --test 가 직접 읽는다.
import { deadlineOf } from "./contract-rules.ts";
import type { ContractListItem } from "./contracts";

export interface SignRequest {
  contract: ContractListItem;
  /** 서명 화면 주소 — 상세의 「서명하기」와 같다(목록이 준 발송 일시를 그대로 실어 그사이 다시 발송됐으면 서명 화면이 알린다). */
  href: string;
  /** 「2026년 10월 11일 10:23까지 · 26일 남음」(당일은 「오늘 마감」). 기한이 없으면 null. */
  deadline: string | null;
  /** 「다음에 하기」로 기억할 값 — 지금 서명을 기다리는 계약 모두의 id@발송 일시. 새 계약이 오거나 다시 발송되면 달라져 다시 뜬다. */
  key: string;
}

/** 팝업에 올릴 계약 — 서명을 기다리는 전자계약(api awaitingSignature, 종이 계약 제외 CTR-23) 가운데 기한이 가장 급한 것. 없으면 null. */
export function signRequestOf(items: readonly ContractListItem[], now: Date): SignRequest | null {
  const waiting = items.filter((c) => c.awaitingSignature && c.contractMethod !== "PAPER" && c.sentAt);
  const deadlineMs = (c: ContractListItem) => (c.signDeadlineAt ? Date.parse(c.signDeadlineAt) : Infinity);
  const contract = waiting.reduce<ContractListItem | null>((pick, c) => (!pick || deadlineMs(c) < deadlineMs(pick) ? c : pick), null);
  if (!contract) return null;
  const d = deadlineOf(contract, now);
  return {
    contract,
    href: `/contracts/${contract.contractId}/sign?sentAt=${encodeURIComponent(contract.sentAt!)}`,
    deadline: d && `${d.dateTime}까지 · ${d.daysLeft === 0 ? "오늘 마감" : `${d.daysLeft}일 남음`}`,
    key: waiting
      .map((c) => `${c.contractId}@${c.sentAt}`)
      .sort()
      .join(","),
  };
}

/** 팝업을 닫아 둘지 — 지금 기다리는 계약 묶음이 「다음에 하기」로 닫은 묶음과 같을 때만. 이 탭 안에서만 기억한다(HOME-4: 앱을 열 때마다 다시). */
export const isSignRequestDismissed = (key: string, seen: string | null) => key === seen;
