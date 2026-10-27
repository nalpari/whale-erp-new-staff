// 소속 추가 확인 요청(WHALEERP-144, api #164)의 순수 계산 — 거절 사유 거르기, 수락 · 거절 실패를 화면 상태로 바꾸기, 팝업에 보일 요약.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { CONNECTION_FAILED, RATE_LIMITED, RETRY_LATER, type ApiFailure } from "./action-errors.ts";
import type { Schemas } from "./api";

export type AffiliationRequest = Schemas["AffiliationRequestDto"];

/** 거절 사유 상한 — api 의 REJECT_REASON_MAX(근로계약서 거부 사유와 같다). */
export const REJECT_REASON_MAX = 500;

/**
 * 수락 · 거절의 화면 상태.
 * - input: 답하기 전. error 가 있으면 다시 누를 수 있는 실패(요청 제한 · 연결 실패 등)다. acceptBlocked 면 수락은 막고 거절만 남긴다
 *   (이 점포에 이미 재직 중 — api 는 요청을 보냄으로 남겨 목록 · 팝업에 남으므로 거절로 닫게 한다).
 * - accepted / rejected: 답했다.
 * - closed: 더 답할 수 없는 요청 — 이미 답함 · 끝남.
 */
export type AnswerState =
  | { step: "input"; error?: string; acceptBlocked?: boolean }
  | { step: "accepted"; storeName: string; contractCount: number }
  | { step: "rejected" }
  | { step: "closed"; title: string; message: string };

export const INITIAL_ANSWER_STATE: AnswerState = { step: "input" };

/** 거절 사유. api 와 같이 NFC · 앞뒤 공백을 지우고, 비면 보내지 않는다(undefined). 500자를 넘으면 오류 문구. */
export function parseRejectReason(raw: string): { ok: true; reason: string | undefined } | { ok: false; error: string } {
  const reason = raw.normalize("NFC").trim();
  if (reason.length > REJECT_REASON_MAX) return { ok: false, error: `거절 사유는 ${REJECT_REASON_MAX}자 이하로 입력해 주세요` };
  return { ok: true, reason: reason || undefined };
}

const CLOSED = {
  answered: {
    title: "이미 답한 요청입니다",
    message: "다른 기기나 화면에서 이미 수락하거나 거절했습니다. 수락했다면 내 정보 - 소속 근무지에서 볼 수 있습니다.",
  },
  ended: {
    title: "끝난 요청입니다",
    message: "확인 기한이 지났거나 새 요청으로 바뀌었습니다. 점포 관리자에게 다시 보내 달라고 요청해 주세요.",
  },
  notFound: {
    title: "요청을 찾을 수 없습니다",
    message: "이미 끝났거나 이 계정의 요청이 아닙니다. 점포 관리자에게 다시 보내 달라고 요청해 주세요.",
  },
} as const;

/** 이 점포에 이미 재직 중(code 없는 409)일 때의 문구. 수락은 막고 거절로 요청을 닫게 한다. */
export const ALREADY_EMPLOYED =
  "이 점포의 소속이 이미 계정에 이어져 있어 수락할 수 없습니다. 이 요청은 거절해 닫아 주세요. 거절해도 지금 소속과 계정은 그대로입니다.";

const closed = (key: keyof typeof CLOSED): AnswerState => ({ step: "closed", ...CLOSED[key] });

/**
 * 수락 · 거절 실패를 화면 상태로. log 는 계약 어긋남(예상 밖 4xx)으로 남길지다 — 5xx · 연결 실패는 request() 가 남겼다.
 * 404 · 409 는 code 로 가른다. 수락의 code 없는 409 만 「이 점포에 이미 재직 중」이라 수락을 막고 거절은 남긴다. 그 밖의 code 없는
 * 404 · 409(라우트 없음 · api 배포 전 등)는 예상 밖이라 다시 누를 수 있는 오류로 두고 남긴다.
 */
export function answerFailure(failure: ApiFailure, answer: "accept" | "reject"): { state: AnswerState; log: boolean } {
  if (failure === "network") return { state: { step: "input", error: CONNECTION_FAILED }, log: false };
  const { status, code } = failure;
  if (code === "AFFILIATION_REQUEST_ENDED") return { state: closed("ended"), log: false };
  if (code === "AFFILIATION_REQUEST_NOT_FOUND") return { state: closed("notFound"), log: false };
  if (code === "AFFILIATION_REQUEST_ANSWERED") return { state: closed("answered"), log: false };
  if (status === 409 && answer === "accept" && code === undefined)
    return { state: { step: "input", error: ALREADY_EMPLOYED, acceptBlocked: true }, log: false };
  if (status === 429) return { state: { step: "input", error: RATE_LIMITED }, log: false };
  return { state: { step: "input", error: `요청을 처리하지 못했습니다. ${RETRY_LATER}` }, log: status < 500 };
}

/** 소속 추가 확인 · 복귀 확인을 가르는 배지 글자. 화면 용어는 둘 다 「소속 추가 확인 요청」이다. */
export const invitationTypeLabel = ({ invitationType }: Pick<AffiliationRequest, "invitationType">) =>
  invitationType === "RETURN_CONFIRM" ? "복귀 확인" : "소속 추가 요청";

/**
 * 로그인 뒤 팝업에 보일 줄과 기억할 값. 요청이 하나면 점포와 고용 형태 · 직무(확인 화면 · 목록과 같은 줄), 여럿이면 첫 점포 「외 N곳」과
 * 요청 수 — 첫 요청의 고용 형태만 보이면 나머지도 같은 줄 안다.
 */
export function popupSummary(items: AffiliationRequest[]): { rows: { label: string; value: string }[]; key: string } | null {
  const first = items.at(0);
  if (!first) return null;
  const others = items.length - 1;
  return {
    rows:
      others > 0
        ? [
            { label: "점포", value: `${first.storeName} 외 ${others}곳` },
            { label: "요청", value: `${items.length}건` },
          ]
        : [
            { label: "점포", value: first.storeName },
            { label: "고용 형태", value: employmentLine(first) },
          ],
    // 「다음에 하기」를 눌렀을 때 기억하는 값(id 묶음). 새 요청이 오면 다시 뜬다(isPopupDismissed).
    key: items
      .map((item) => item.invitationId)
      .sort((a, b) => a - b)
      .join(","),
  };
}

const idsOf = (key: string | null) => new Set((key ?? "").split(",").filter(Boolean));

/** 팝업을 닫아 둘지 — 지금 요청이 모두 이미 본(닫은) 요청이면 닫아 둔다. 하나에 답해 줄었을 때는 다시 뜨지 않고, 새 요청이 있을 때만 뜬다. */
export function isPopupDismissed(currentKey: string, seenKey: string | null): boolean {
  const seen = idsOf(seenKey);
  return [...idsOf(currentKey)].every((id) => seen.has(id));
}

/** 「다음에 하기」로 닫을 때 기억할 값 — 이미 본 요청에 지금 요청을 더한다. */
export function mergeSeenKey(currentKey: string, seenKey: string | null): string {
  return [...new Set([...idsOf(seenKey), ...idsOf(currentKey)])]
    .map(Number)
    .sort((a, b) => a - b)
    .join(",");
}

/**
 * 목록 조회(`getMyAffiliationRequests`) 실패를 어떻게 다룰지. 이 목록은 팝업 · 배지 같은 곁들임이라 api 실패(4xx · 5xx · 연결 실패)는
 * 모두 null 로 받아 화면을 그대로 보인다 — api 배포 전 404 로 홈 전체가 오류 화면이 되지 않게. failure 가 null 이면 api 실패가 아니라
 * (401 의 만료 안내 redirect · 코드 결함) 그대로 던진다. 예상 밖 4xx 만 남긴다(5xx · 연결 실패는 request() 가 남겼다).
 */
export function requestsLoadFailure(failure: ApiFailure | null): "throw" | "log" | "ignore" {
  if (failure === null) return "throw";
  return failure !== "network" && failure.status < 500 ? "log" : "ignore";
}

/** 고용 형태 · 직무 한 줄(「파트타이머 · 바리스타」). 옛 레코드는 고용 형태가 비어 있을 수 있다. */
export const employmentLine = ({ employmentTypeLabel, jobTitle }: Pick<AffiliationRequest, "employmentTypeLabel" | "jobTitle">) =>
  [employmentTypeLabel ?? "고용 형태 미정", jobTitle].filter(Boolean).join(" · ");
