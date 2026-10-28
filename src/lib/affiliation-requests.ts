// 소속 추가 확인 요청(WHALEERP-144, api #164)의 순수 계산 — 거절 사유 거르기, 수락 · 거절 실패를 화면 상태로 바꾸기, 팝업에 보일 요약.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { CONNECTION_FAILED, RATE_LIMITED, RETRY_LATER, type ApiFailure } from "./action-errors.ts";
import type { Schemas } from "./api";

export type AffiliationRequest = Schemas["AffiliationRequestDto"];

/** 거절 사유 상한 — api 의 REJECT_REASON_MAX(근로계약서 거부 사유와 같다). */
export const REJECT_REASON_MAX = 500;

/**
 * 확인 화면에 남는 상태 — 다시 누를 수 있는 실패(요청 제한 · 연결 실패 등)의 문구. acceptBlocked 면 수락은 막고 거절만 남긴다
 * (이 점포에 이미 재직 중 — api 는 요청을 보냄으로 남겨 목록 · 팝업에 남으므로 거절로 닫게 한다).
 */
export type AnswerState = { error?: string; acceptBlocked?: boolean };

export const INITIAL_ANSWER_STATE: AnswerState = {};

/**
 * 답한 결과 — 수락 · 거절했거나 더 답할 수 없는 요청(이미 답함 · 끝남 · 찾을 수 없음). 결과 경로(`/affiliations/done`)로 보내 그린다.
 * 액션 상태로만 그리면 액션 요청에서 proxy 가 토큰을 갱신해 쿠키를 쓸 때 Next 가 화면을 다시 그려(답한 요청이 목록에서 빠져)
 * 결과가 사라진다. 하이드레이션 전 제출(폼 POST)도 같다.
 */
export type AnswerResult =
  | { kind: "accepted"; contractCount: number }
  | { kind: "rejected" }
  | { kind: "closed"; reason: ClosedReason };

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

export type ClosedReason = keyof typeof CLOSED;

/** 더 답할 수 없는 요청의 제목 · 설명. */
export const closedMessage = (reason: ClosedReason) => CLOSED[reason];

/**
 * 결과 화면의 제목 · 설명 — 문서 title 과 첫 제목에 같이 쓴다. 수락이면 쿠키로 넘어온 점포 이름(없으면 빼고)을 넣는다.
 * 문서 title 이 결과마다 바뀌어야 화면 낭독기가 결과를 알린다.
 */
export function contentOf(result: AnswerResult, storeName: string | null = null): { title: string; message: string } {
  if (result.kind === "accepted")
    return {
      title: storeName ? `${storeName} 소속이 추가되었습니다` : "소속이 추가되었습니다",
      message: "기존 계정은 그대로이고, 계정의 이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부만 이 근무지의 새 직원 레코드에 이어졌습니다.",
    };
  if (result.kind === "rejected")
    return { title: "소속 추가를 거절했습니다", message: "기존 소속과 계정은 그대로입니다. 함께 온 근로계약서는 거부로 닫혔습니다." };
  return closedMessage(result.reason);
}

/** 이 점포에 이미 재직 중(code 없는 409)일 때의 문구. 수락은 막고 거절로 요청을 닫게 한다. */
export const ALREADY_EMPLOYED =
  "이 점포의 소속이 이미 계정에 이어져 있어 수락할 수 없습니다. 이 요청은 거절해 닫아 주세요. 거절해도 지금 소속과 계정은 그대로입니다.";

const closed = (reason: ClosedReason): { result: AnswerResult; log: false } => ({ result: { kind: "closed", reason }, log: false });
const retry = (error: string, log: boolean): { state: AnswerState; log: boolean } => ({ state: { error }, log });

/**
 * 수락 · 거절 실패를 결과(결과 경로로 보냄) 또는 확인 화면에 남는 상태로. log 는 계약 어긋남(예상 밖 4xx)으로 남길지다 — 5xx · 연결
 * 실패는 request() 가 남겼다. 404 · 409 는 code 로 가른다. 수락의 code 없는 409 만 「이 점포에 이미 재직 중」이라 수락을 막고 거절은
 * 남긴다. 그 밖의 code 없는 404 · 409(라우트 없음 · api 배포 전 등)는 예상 밖이라 다시 누를 수 있는 오류로 두고 남긴다.
 */
export function answerFailure(
  failure: ApiFailure,
  answer: "accept" | "reject",
): { result: AnswerResult; log: boolean } | { state: AnswerState; log: boolean } {
  if (failure === "network") return retry(CONNECTION_FAILED, false);
  const { status, code } = failure;
  if (code === "AFFILIATION_REQUEST_ENDED") return closed("ended");
  if (code === "AFFILIATION_REQUEST_NOT_FOUND") return closed("notFound");
  if (code === "AFFILIATION_REQUEST_ANSWERED") return closed("answered");
  if (status === 409 && answer === "accept" && code === undefined)
    return { state: { error: ALREADY_EMPLOYED, acceptBlocked: true }, log: false };
  if (status === 429) return retry(RATE_LIMITED, false);
  return retry(`요청을 처리하지 못했습니다. ${RETRY_LATER}`, status < 500);
}

/** 결과 경로에 싣는 계약 수의 상한 — 「발송되었습니다」 갈래만 가르므로 크게 받을 일이 없다. */
const RESULT_CONTRACTS_MAX = 99;
const CLOSED_REASONS = Object.keys(CLOSED) as ClosedReason[];

/**
 * 답한 결과의 경로(`/affiliations/done?…`). 점포 이름은 싣지 않는다 — 주소 · 기록에 남고, 남이 만든 링크로 가짜 「○○ 소속이
 * 추가되었습니다」를 보일 수 있어서다. 결과 갈래 · 사유 · 계약 수(0~99)만 싣는다.
 */
export function resultHref(result: AnswerResult): string {
  const params = new URLSearchParams({ result: result.kind });
  if (result.kind === "accepted") params.set("contracts", String(Math.min(Math.max(result.contractCount, 0), RESULT_CONTRACTS_MAX)));
  if (result.kind === "closed") params.set("reason", result.reason);
  return `/affiliations/done?${params}`;
}

type SearchParams = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** 결과 경로의 쿼리를 결과로. 주소로 들어오는 값이라 정한 것만 받는다 — 모르는 result · reason, 0~99 가 아닌 계약 수는 null. */
export function parseResult(params: SearchParams): AnswerResult | null {
  const kind = one(params.result);
  if (kind === "rejected") return { kind };
  if (kind === "closed") {
    const reason = one(params.reason);
    return CLOSED_REASONS.includes(reason as ClosedReason) ? { kind, reason: reason as ClosedReason } : null;
  }
  if (kind === "accepted") {
    const contracts = one(params.contracts) ?? "";
    return /^\d{1,2}$/.test(contracts) ? { kind, contractCount: Number(contracts) } : null;
  }
  return null;
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
