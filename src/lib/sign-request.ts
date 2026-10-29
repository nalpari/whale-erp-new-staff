// 서명 요청 팝업(WHALEERP-148, 데모 home 의 sign-req) · 홈 서명 대기 카드(146)의 순수 판정 — 띄울 계약 고르기(서버 화면이 부른다).
// 「다음에 하기」 판정은 클라이언트가 쓰는 sign-request-seen.ts, 기억은 sign-request-popup-memory.ts, 화면은 src/app/(app)/home/.
// node --test 가 직접 읽는다.
import { deadlineOf, deadlineValue, isDeadlineNear } from "./contract-rules.ts";
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
const detailHref = (c: ContractListItem) => `/contracts/${c.contractId}?store=${c.storeId}`;
const isWaiting = (c: ContractListItem): c is Sent => c.awaitingSignature && c.contractMethod !== "PAPER" && c.sentAt !== null;
const deadlineMs = (c: ContractListItem) => (c.signDeadlineAt ? Date.parse(c.signDeadlineAt) : Number.MAX_SAFE_INTEGER);

/** 서명을 기다리는 전자계약을 기한이 급한 순으로(기한 없음은 맨 뒤, 같으면 api 순서) — 팝업은 맨 앞 하나, 홈 카드는 모두. */
const waitingByDeadline = (items: readonly ContractListItem[]): Sent[] =>
  items.filter(isWaiting).sort((a, b) => deadlineMs(a) - deadlineMs(b));

/** 팝업에 올릴 계약 — 서명을 기다리는 전자계약(api awaitingSignature, 종이 계약 제외 CTR-23) 가운데 기한이 가장 급한 것. 없으면 null. */
export function signRequestOf(items: readonly ContractListItem[], now: Date): SignRequest | null {
  const waiting = waitingByDeadline(items);
  const contract = waiting[0];
  if (!contract) return null;
  const d = deadlineOf(contract, now);
  return {
    contract,
    href: detailHref(contract),
    deadline: d && deadlineValue(d, "detail"),
    key: waiting
      .map((c) => `${c.contractId}@${c.sentAt}`)
      .sort()
      .join(","),
  };
}

export interface SignWaitingCard {
  contractId: number;
  storeName: string;
  /** 그 계약서 상세(팝업과 같은 곳) */
  href: string;
  /** 남은 날(한국 달력). 기한이 없으면 null */
  daysLeft: number | null;
  /**
   * 근무지가 있을 때의 기한 줄 — 「남은 기한 N일」, 오늘 · 내일이면 시각까지 「오늘 14:00 마감」 · 「내일 10:30 마감」(목록과 같은 까닭 —
   * 기한은 발송 시각 + 30일 그 시각이라 날만 보이면 그날 저녁까지 남은 줄 안다). 기한이 없으면 null
   */
  left: string | null;
  /** 남은 날이 7일 이내 — 홈 카드는 기한 글자만 강조한다(146 · CON-4) */
  urgent: boolean;
  /** 「2026년 10월 11일까지」 — 기한이 오늘 · 내일이면 시각까지(목록과 같은 규칙, 기한은 발송 시각 + 30일 그 시각). 기한이 없으면 null */
  until: string | null;
}

/**
 * 홈의 서명 대기 카드(146, 데모 home 의 todo · empty) — 팝업과 같은 계약(서명을 기다리는 전자계약)을 기한이 급한 순으로 모두.
 * 팝업은 「다음에 하기」로 닫을 수 있어, 닫은 뒤에도 이 카드로 서명할 계약서에 간다.
 */
export function signWaitingCards(items: readonly ContractListItem[], now: Date): SignWaitingCard[] {
  return waitingByDeadline(items).map((c) => {
    const d = deadlineOf(c, now);
    const time = d?.dateTime.split(" ").at(-1);
    return {
      contractId: c.contractId,
      storeName: c.storeName,
      href: detailHref(c),
      daysLeft: d?.daysLeft ?? null,
      left: d && (isDeadlineNear(d) ? `${d.daysLeft === 0 ? "오늘" : "내일"} ${time} 마감` : `남은 기한 ${d.daysLeft}일`),
      urgent: d?.urgent ?? false,
      until: d && `${isDeadlineNear(d) ? d.dateTime : d.date}까지`,
    };
  });
}
