// 서명 요청 팝업(WHALEERP-148, 데모 home 의 sign-req)의 순수 판정 — 띄울 계약 고르기(서버 화면이 부른다). 「다음에 하기」 판정은
// 클라이언트가 쓰는 sign-request-seen.ts, 기억은 sign-request-popup-memory.ts, 화면은 src/app/(app)/home/home-popups.tsx.
// node --test 가 직접 읽는다.
import { deadlineOf, deadlineValue } from "./contract-rules.ts";
import type { ContractListItem } from "./contracts";

export interface SignRequest {
  contract: ContractListItem;
  /**
   * 그 계약서 상세 — 데모 sign-req 처럼 상세에서 조항을 보고 서명한다(146: 서명 · 거절 버튼이 조항과 한 화면). 본인 대조가 다른 계약도
   * 상세에서 다른 항목과 수정 요청을 본다 — 수정을 요청하면 서명 대기가 아니게 되어(awaitingSignature 거짓) 팝업이 멈춘다.
   * `?store=` 를 붙여 상세의 뒤로 가기가 그 근무지 계약서 목록으로 간다.
   */
  href: string;
  /** 「2026년 10월 11일 10:23까지 · 26일 남음」(당일은 「오늘 마감」, 상세 머리 카드와 같은 규칙 deadlineValue). 기한이 없으면 null. */
  deadline: string | null;
  /** 「다음에 하기」로 기억할 값 — 지금 서명을 기다리는 계약 모두의 id@발송 일시(isSignRequestDismissed 가 부분집합으로 본다). */
  key: string;
}

type Sent = ContractListItem & { sentAt: string };
const isWaiting = (c: ContractListItem): c is Sent => c.awaitingSignature && c.contractMethod !== "PAPER" && c.sentAt !== null;

/** 팝업에 올릴 계약 — 서명을 기다리는 전자계약(api awaitingSignature, 종이 계약 제외 CTR-23) 가운데 기한이 가장 급한 것. 없으면 null. */
export function signRequestOf(items: readonly ContractListItem[], now: Date): SignRequest | null {
  const waiting = items.filter(isWaiting);
  const deadlineMs = (c: ContractListItem) => (c.signDeadlineAt ? Date.parse(c.signDeadlineAt) : Infinity);
  const contract = waiting.reduce<Sent | null>((pick, c) => (!pick || deadlineMs(c) < deadlineMs(pick) ? c : pick), null);
  if (!contract) return null;
  const d = deadlineOf(contract, now);
  return {
    contract,
    href: `/contracts/${contract.contractId}?store=${contract.storeId}`,
    deadline: d && deadlineValue(d, "detail"),
    key: waiting
      .map((c) => `${c.contractId}@${c.sentAt}`)
      .sort()
      .join(","),
  };
}
