// 서명 요청 팝업(WHALEERP-148, 데모 home 의 sign-req)의 순수 판정 — 띄울 계약 고르기, 「다음에 하기」로 기억할 값. 화면은
// src/app/(app)/home/sign-request-popup.tsx, 기억은 sign-request-popup-memory.ts. node --test 가 직접 읽는다.
import { deadlineOf, deadlineValue } from "./contract-rules.ts";
import type { ContractListItem } from "./contracts";

export interface SignRequest {
  contract: ContractListItem;
  /** 서명 화면 주소 — 상세의 「서명하기」와 같다(목록이 준 발송 일시를 그대로 실어 그사이 다시 발송됐으면 서명 화면이 알린다). */
  href: string;
  /** 「2026년 10월 11일 10:23까지 · 26일 남음」(당일은 「오늘 마감」, 상세 머리 카드와 같은 규칙 deadlineValue). 기한이 없으면 null. */
  deadline: string | null;
  /** 「다음에 하기」로 기억할 값 — 지금 서명을 기다리는 계약 모두의 id@발송 일시. 새 계약이 오거나 다시 발송되면 달라져 다시 뜬다. */
  key: string;
}

/** 팝업에 올릴 계약 — 서명을 기다리는 전자계약(api awaitingSignature, 종이 계약 제외 CTR-23) 가운데 기한이 가장 급한 것. 없으면 null. */
type Sent = ContractListItem & { sentAt: string };
const isWaiting = (c: ContractListItem): c is Sent => c.awaitingSignature && c.contractMethod !== "PAPER" && c.sentAt !== null;

export function signRequestOf(items: readonly ContractListItem[], now: Date): SignRequest | null {
  const waiting = items.filter(isWaiting);
  const deadlineMs = (c: ContractListItem) => (c.signDeadlineAt ? Date.parse(c.signDeadlineAt) : Infinity);
  const contract = waiting.reduce<Sent | null>((pick, c) => (!pick || deadlineMs(c) < deadlineMs(pick) ? c : pick), null);
  if (!contract) return null;
  const d = deadlineOf(contract, now);
  return {
    contract,
    href: `/contracts/${contract.contractId}/sign?sentAt=${encodeURIComponent(contract.sentAt)}`,
    deadline: d && deadlineValue(d, "detail"),
    key: waiting
      .map((c) => `${c.contractId}@${c.sentAt}`)
      .sort()
      .join(","),
  };
}

/** 팝업을 닫아 둘지 — 지금 기다리는 계약 묶음이 「다음에 하기」로 닫은 묶음과 같을 때만. 이 탭 안에서만 기억한다(HOME-4: 앱을 열 때마다 다시). */
export const isSignRequestDismissed = (key: string, seen: string | null) => key === seen;

/**
 * HOME-4 「서명하기 전까지 앱을 열 때마다 띄운다」의 「앱을 열 때」— 새로 띄움(새 탭 · 앱 다시 시작, sessionStorage 가 비어 있음)과,
 * 설치한 홈 화면 앱 · 탭을 백그라운드로 보냈다가(화면 숨김) 이만큼 넘게 지나 다시 보이게 한 것을 모두 연 것으로 본다. 잠깐 다른 앱을
 * 보고 오거나 화면을 껐다 켠 정도로는 다시 띄우지 않는다. 소속 추가 요청 팝업에는 이 규칙을 두지 않았다(새로 띄울 때만).
 */
export const REOPEN_AFTER_MS = 10 * 60 * 1000;

/**
 * 화면 보임이 바뀔 때 — 숨으면 그 시각을 기록하고, 다시 보이면 숨은 지 REOPEN_AFTER_MS 를 넘었는지(forget — 「다음에 하기」 기억을
 * 지울지) 판정하고 기록을 비운다.
 */
export function onVisibilityChange(
  hiddenAt: number | null,
  visibility: "hidden" | "visible",
  now: number,
): { hiddenAt: number | null; forget: boolean } {
  if (visibility === "hidden") return { hiddenAt: hiddenAt ?? now, forget: false };
  return { hiddenAt: null, forget: hiddenAt !== null && now - hiddenAt > REOPEN_AFTER_MS };
}
