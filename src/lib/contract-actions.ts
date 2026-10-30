// 근로계약 날인 · 거절 · 수정 요청(WHALEERP-147, api WHALEERP-145)의 순수 계산 — 넣은 값 거르기, 서명 이미지 확인, api 실패를
// 화면 상태로 바꾸기. api 를 부르는 쪽은 src/app/(app)/contracts/[contractId]/actions.ts 다.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { RATE_LIMITED, isHangulReason, type ApiFailure } from "./action-errors.ts";
import type { Schemas } from "./api";
import type { ContractStatus } from "./contracts";

export type ContractAction = "sign" | "reject" | "correction";
export type IdentityField = Schemas["IdentityField"];
/** enum 조회(`getEnumOrEmpty`)가 준 값 · 한글 목록. 순수 모듈이라 enums.ts 를 값으로 가져오지 않고 모양만 받는다. */
type EnumLabels = readonly { value: string; label: string }[];

/**
 * 다른 본인 대조 항목을 api 순서대로 「이름 · 생년월일」. 한글은 api enum `IdentityField`(GET /enums)에서 받는다. 한글이 없는 값이
 * 하나라도 있으면(enum 을 못 받음 · api 가 항목을 더함) null — 화면은 영어 값 대신 「다른 항목이 있습니다」 같은 일반 문구를 쓴다.
 */
export function mismatchText(mismatches: readonly string[], labels: EnumLabels): string | null {
  const names = mismatches.map((m) => labels.find((l) => l.value === m)?.label);
  return names.length > 0 && names.every((n) => n !== undefined) ? names.join(" · ") : null;
}

/**
 * 근로계약서 거절 · 소속 추가 거절의 요청 본문 — 사유를 싣지 않는다(WHALEERP-635). 빈 JSON 으로 두는 것은 사유 DTO 를 아직 받는
 * 옛 api 가 본문 없는 요청을 400 으로 막지 않게(앱이 api 보다 먼저 나간다). 테스트가 이 값을 고정한다.
 */
export const REJECT_BODY: Readonly<Record<string, never>> = Object.freeze({});

/** 수정 요청 사유 상한 — api(WHALEERP-635 api PR 의 CORRECTION_REASON_MAX)와 같은 기준: NFC 로 맞추고 앞뒤 공백을 지운 뒤 `.length` 로 센다. */
export const CORRECTION_REASON_MAX = 100;

/** 수정 요청 사유 칸 — 필수(WHALEERP-635). 비거나 넘치면 칸 오류. */
export function readCorrectionReason(raw: FormDataEntryValue | null): { reason: string } | { error: string } {
  const reason = typeof raw === "string" ? raw.normalize("NFC").trim() : "";
  if (!reason) return { error: "수정 요청 사유를 입력해 주세요" };
  if (reason.length > CORRECTION_REASON_MAX) return { error: `수정 요청 사유는 ${CORRECTION_REASON_MAX}자 이하로 입력해 주세요` };
  return { reason };
}

/** 서명 이미지 상한(api SIGNATURE_MAX_BYTES, 1MB). */
export const SIGNATURE_MAX_BYTES = 1024 * 1024;
/**
 * 화면이 만드는 서명 PNG 의 목표 크기. 서버 액션 요청 본문은 Next 기본 1MB 까지라(multipart 머리 몫 포함) api 상한보다 작게
 * 잡는다 — 넘으면 줄여 다시 만든다. 손가락 서명 한 장은 보통 수십 KB 다.
 */
export const SIGNATURE_TARGET_BYTES = 900 * 1024;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** 받은 서명 이미지를 api 로 넘기기 전에 거른다 — 비었거나 1MB 를 넘거나 PNG 가 아니면 문구. 이미지 내용은 api 가 다시 본다. */
export function signatureProblem(bytes: Uint8Array): string | null {
  if (bytes.length === 0) return "서명을 받지 못했습니다. 다시 그려 주세요";
  if (bytes.length > SIGNATURE_MAX_BYTES) return "서명 이미지가 너무 큽니다. 다시 그려 주세요";
  if (!PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return "서명 이미지를 읽을 수 없습니다. 다시 그려 주세요";
  return null;
}

/** 날인에 보내는 발송 일시 — 상세가 준 값 그대로. 시간대 표기(Z · +09:00)가 있는 ISO 시각이어야 한다(api 와 같은 판정). */
export const isSentAt = (value: unknown): value is string =>
  typeof value === "string" && /T.*(Z|[+-]\d{2}:?\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));

/**
 * 버튼 결과. message 는 화면 문구다. stale 이면 계약이 그사이 바뀌어(상태 · 재발송 · 기한 · 대조 · 퇴직) 이 화면에서 다시 할 수
 * 없다 — 화면은 「계약서 다시 보기」로 이끈다. 아니면 같은 버튼으로 다시 시도한다. field 는 문구를 붙일 칸(수정 요청 사유)이다.
 */
export interface ContractActionState {
  message?: string;
  stale?: boolean;
  field?: "reason";
}

/** 버튼마다 끝난 뒤의 상태 — 그사이 이미 그렇게 됐다는 409 는 성공으로 친다(연결이 끊겨 결과를 모른 채 다시 누른 경우). */
const DONE_STATUS: Record<ContractAction, ContractStatus> = {
  sign: "SIGNED",
  reject: "REJECTED",
  correction: "CORRECTION_REQUESTED",
};

/** 서명 기한이 지남(409 SIGN_DEADLINE_PASSED) — api 문구 대신 화면 문구. */
export const SIGN_DEADLINE_PASSED = "서명 기한이 지났습니다. 근무지 관리자에게 다시 보내 달라고 요청해 주세요";

/** 결과를 모름 — 서버가 처리했을 수도 있다. 다시 누르면 api 가 지금 상태로 알려 준다(이미 처리됐으면 409 → 성공). */
export const OUTCOME_UNKNOWN = "처리됐는지 확인하지 못했습니다. 계약서를 다시 열어 확인하거나 다시 시도해 주세요";

/**
 * api 실패를 화면 상태로. body 는 오류 응답의 JSON 본문 그대로다(409 의 status · mismatches 를 읽는다).
 * identityLabels 는 api enum `IdentityField` 의 값 · 한글(409 IDENTITY_MISMATCH 의 다른 항목을 적을 때만 쓴다).
 * - 409 CONTRACT_STATUS_CONFLICT 인데 지금 상태가 이 버튼의 결과면 done — 앞선 요청이 이미 처리됐다.
 * - 409(상태 · 기한 · 퇴직 · 재발송 · 대조) · 404 는 stale.
 * - 400 은 날인이면 서명 이미지 문제(다시 그리기), 수정 요청이면 사유 칸(수정 요청의 400 은 지금 사유 검사뿐이다 — 다른 400 이
 *   생기면 칸을 가려야 한다).
 * - 429 · 503 · 5xx · 연결 실패는 다시 시도. 5xx · 연결 실패는 처리됐는지 모른다.
 * log 는 예상하지 못한 응답(영어 원문 400 · 그 밖의 4xx)일 때 남기라는 뜻이다.
 */
export function contractActionFailure(
  action: ContractAction,
  failure: ApiFailure,
  body: unknown,
  identityLabels: EnumLabels = [],
): { done: true } | { state: ContractActionState; log: boolean } {
  if (failure === "network") return { state: { message: `서버에 연결하지 못했습니다. ${OUTCOME_UNKNOWN}` }, log: false };
  const { status, message, code } = failure;
  const fields = (body ?? {}) as { status?: unknown; mismatches?: unknown };
  if (status === 409) {
    if (code === "CONTRACT_STATUS_CONFLICT" && fields.status === DONE_STATUS[action]) return { done: true };
    if (code === "IDENTITY_MISMATCH") {
      const items = Array.isArray(fields.mismatches) ? mismatchText(fields.mismatches.map(String), identityLabels) : null;
      return {
        state: { stale: true, message: `계약서의 직원 정보${items ? `(${items})` : ""}가 가입한 정보와 다릅니다. 계약서로 돌아가 수정을 요청해 주세요` },
        log: false,
      };
    }
    // api 문구는 「날인 기한」이라 용어집(2026-10-28 재영 — 화면은 「서명」)에 맞춰 화면 문구로 바꾼다
    if (code === "SIGN_DEADLINE_PASSED") return { state: { stale: true, message: SIGN_DEADLINE_PASSED }, log: false };
    // CONTRACT_STATUS_CONFLICT · STAFF_RETIRED · CONTRACT_RESENT 는 api 가 한글 사유를 준다
    const known = code !== undefined && isHangulReason(message);
    return { state: { stale: true, message: known ? message : "계약서 상태가 바뀌었습니다. 계약서를 다시 열어 확인해 주세요" }, log: !known };
  }
  if (status === 404) return { state: { stale: true, message: "계약서를 찾을 수 없습니다. 목록에서 다시 열어 주세요" }, log: false };
  if (status === 429) return { state: { message: RATE_LIMITED }, log: false };
  if (status === 400) {
    const hangul = isHangulReason(message);
    if (action === "correction")
      return { state: { field: "reason", message: hangul ? message : "수정 요청 사유를 확인해 주세요" }, log: !hangul };
    if (action === "sign") return { state: { message: hangul ? message : "서명 이미지를 보내지 못했습니다. 다시 그려 주세요" }, log: !hangul };
  }
  // 503 은 저장소 문제로 날인 전에 멈췄다(api 가 「잠시 뒤 다시 시도」 사유를 준다). 그 밖의 5xx 는 커밋 뒤에 끊겼을 수 있다.
  if (status === 503 && isHangulReason(message)) return { state: { message }, log: false };
  if (status >= 500) return { state: { message: OUTCOME_UNKNOWN }, log: false };
  return { state: { message: "처리하지 못했습니다. 계약서를 다시 열어 확인해 주세요" }, log: true };
}
