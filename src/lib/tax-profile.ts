// 신고 정보(TAX-8, WHALEERP-333 · api 334)의 순수 계산 — 주소의 소속 id 읽기(parseStaffMemberId), 주민등록번호 앞자리 · 생년월일
// 맞춰 보기(rrnBirthMismatch), 고치기 폼 값 읽기 · 거르기(readTaxProfileForm · validateTaxProfileEdit), 신고 정보가 없으면 고치지 않기
// (taxProfileEditBlocked), 저장 실패를 화면 상태로 바꾸기(taxProfileSaveFailure), 날인 뒤 처음 넣기(WHALEERP-150)의 거르기 · 실패
// (validateTaxProfileCreate · taxProfileCreateFailure). api 를 부르는 쪽은 me/memberships/[staffMemberId]/tax-profile 의 edit/actions.ts · new/actions.ts 다.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
// 주민등록번호 · 계좌번호 · 지금 비밀번호 원문은 api 본문(validateTaxProfileEdit · validateTaxProfileCreate 의 body)에만 싣고, 화면 상태(TaxProfileEditState) · 문구에는 싣지 않는다.
import {
  CONNECTION_FAILED,
  RATE_LIMITED,
  REPORT_IF_REPEATED,
  RETRY_LATER,
  type ApiFailure,
  type Problem,
} from "./action-errors.ts";
import { CURRENT_PASSWORD_MISMATCH } from "./password-change.ts";
import type { Schemas } from "./api";

export type SaveTaxProfileBody = Schemas["SaveMyTaxProfileDto"];

/** 주소의 id. api 의 StaffMemberIdPipe 처럼 양의 정수(int4)만 받고, 나머지는 api 를 부르지 않고 없는 화면이다. */
export function parseStaffMemberId(raw: unknown): number | null {
  if (typeof raw !== "string" || !/^[1-9][0-9]{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id <= 2_147_483_647 ? id : null;
}

/** 주민등록번호 뒷자리 첫 자리 → 출생 세기. 외국인등록번호(5~8)도 같다 — api my-memberships.service 의 CENTURY 와 같은 표. */
const CENTURY: Record<string, number> = { "9": 1800, "0": 1800, "1": 1900, "2": 1900, "5": 1900, "6": 1900, "3": 2000, "4": 2000, "7": 2000, "8": 2000 };

/**
 * 주민등록번호 앞 6자리 · 뒷자리 첫 자리가 가입한 생년월일(YYYY-MM-DD)과 다른지. 아직 판단할 수 없으면(앞 6자리 · 뒷자리 첫 자리가
 * 다 들어오지 않음) false — 넣는 동안 칸을 빨갛게 하지 않는다. 판정은 api 가 다시 한다(RRN_BIRTH_MISMATCH).
 */
export function rrnBirthMismatch(front: string, back: string, birthDate: string): boolean {
  if (!/^\d{6}$/.test(front) || !/^\d/.test(back)) return false;
  const century = CENTURY[back[0]];
  return `${century + Number(front.slice(0, 2))}-${front.slice(2, 4)}-${front.slice(4, 6)}` !== birthDate;
}

/** 오류를 붙일 칸. 주민등록번호 두 칸은 한 묶음(rrn), 은행 · 계좌번호 · 지금 비밀번호는 따로, 그 밖은 버튼 위(form). */
export type TaxProfileField = "rrn" | "bank" | "account" | "currentPassword" | "form";

export interface TaxProfileEditState {
  problem?: Problem<TaxProfileField>;
}

export interface TaxProfileEditInput {
  rrnFront: string;
  rrnBack: string;
  bankCode: string;
  payrollAccountNumber: string;
  /** 지금 비밀번호 — 고치기에서만 받는다(본인 확인, api 334 후속 2026-10-23). 공백을 지우지 않는다. */
  currentPassword: string;
}

/** 지금 비밀번호를 비웠을 때 — 비밀번호 변경 화면(validatePasswordChange)과 같은 문구. */
export const CURRENT_PASSWORD_EMPTY = "지금 비밀번호를 넣어 주세요";
export { CURRENT_PASSWORD_MISMATCH };

/** 은행 · 계좌번호 한쪽만 넣었을 때. api TAX_PROFILE_ACCOUNT_INCOMPLETE 의 화면 쪽 문구. */
export const ACCOUNT_INCOMPLETE = "급여 계좌는 은행과 계좌번호를 함께 넣어 주세요";
/** 주민등록번호 앞자리 · 가입 생년월일이 다를 때 — 데모 tax 의 mismatch 문구(생년월일 값은 넣지 않는다, 운영 정책 TAX-09). */
export const RRN_BIRTH_MISMATCH = "주민등록번호 앞자리가 가입 때 넣은 생년월일과 다릅니다. 근무지 관리자에게 생년월일 정정을 요청해 주세요.";
export const RRN_SHAPE = "주민등록번호 앞 6자리와 뒤 7자리를 숫자로 넣어 주세요";
export const ACCOUNT_SHAPE = "계좌번호는 숫자 10~16자리입니다";
export const NOTHING_TO_CHANGE = "바꿀 주민등록번호나 급여 계좌를 넣어 주세요";

const problem = (field: TaxProfileField, message: string): TaxProfileEditState => ({ problem: { field, message } });

/** 보기 화면의 조회 실패(5xx · 연결 실패) 안내. */
export const TAX_VIEW_UNAVAILABLE = "신고 정보를 지금 볼 수 없습니다. 잠시 뒤 다시 열어 주세요.";
/** 저장하고 돌아왔는데 보기 화면 조회가 실패했을 때 — 저장은 됐다는 것을 같이 알린다. */
export const TAX_VIEW_UNAVAILABLE_AFTER_SAVE = "신고 정보를 바꿨습니다. 바뀐 값은 지금 볼 수 없으니 잠시 뒤 다시 열어 주세요.";

/**
 * 보기 화면이 고치고 돌아온 뒤(`?changed=1`) 무엇을 보일지. 주소의 `?changed=` 는 changed 면 늘 지운다(ChangedToast).
 * - toast: 「신고 정보를 바꿨습니다」 알림 — 조회가 실패했어도(tax 가 null) 띄운다. 저장은 끝났다.
 * - unavailable: 조회 실패 안내 문구 — 고치고 돌아왔으면 저장된 것을 덧붙인 문구.
 * 고치고 왔는데 신고 정보가 없으면(그사이 지워짐 등) 알림은 띄우지 않는다 — 「바꿨습니다」와 「내지 않았습니다」가 함께 보이지 않게.
 */
export function taxViewAfterChange(changed: boolean, tax: { taxProfile: unknown } | null): { toast: boolean; unavailable: string } {
  return {
    toast: changed && (tax === null || Boolean(tax.taxProfile)),
    unavailable: changed ? TAX_VIEW_UNAVAILABLE_AFTER_SAVE : TAX_VIEW_UNAVAILABLE,
  };
}

/** 이 소속에 낸 신고 정보가 없을 때 — 이 화면은 고치기만 한다(WHALEERP-333 첫 입력은 날인 뒤 흐름 150 몫, 2026-10-23 노영주). */
export const TAX_PROFILE_MISSING = "이 근무지에 낸 신고 정보가 없어 여기서 고칠 수 없습니다. 신고 정보 화면에서 다시 열어 주세요";

/**
 * 저장 전에 지금 신고 정보를 보고 고칠 수 있는지. 없으면(`taxProfile: null`) PUT 하지 않고 이 상태를 돌려준다 — 서버 액션은 누구나
 * 직접 부를 수 있어, 화면이 버튼을 숨긴 것만으로는 첫 입력(셋 다 보내면 api 가 만든다)을 막지 못한다. 있으면 null.
 */
export function taxProfileEditBlocked(current: { taxProfile: unknown }): TaxProfileEditState | null {
  return current.taxProfile ? null : problem("form", TAX_PROFILE_MISSING);
}

/** api 처럼 하이픈 · 공백을 지운다. */
const digitsOnly = (value: string) => value.replace(/[\s-]/g, "");

/** 폼 값 읽기. 없는 칸은 빈 글자다. */
export function readTaxProfileForm(formData: { get(name: string): unknown }): TaxProfileEditInput {
  const raw = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const text = (name: string) => raw(name).trim();
  return {
    rrnFront: text("rrnFront"),
    rrnBack: text("rrnBack"),
    bankCode: text("bankCode"),
    payrollAccountNumber: text("payrollAccountNumber"),
    // 비밀번호는 공백도 글자다 — 지우지 않는다.
    currentPassword: raw("currentPassword"),
  };
}

/**
 * 고치기(이미 낸 신고 정보가 있을 때)의 값 거르기. 맞으면 api 본문, 아니면 화면 상태. 서버 액션은 누구나 직접 부를 수 있어
 * 화면이 막은 것도 다시 본다. 비워 둔 쪽은 보내지 않아 그대로 둔다 — 주민등록번호만 · 급여 계좌(은행 + 계좌번호)만 · 둘 다.
 * 둘 다 비었거나 은행 · 계좌번호 한쪽만이면 막는다(2026-10-23 노영주). 생년월일 맞춰 보기는 화면이 하고 api 가 다시 본다.
 * 지금 비밀번호는 늘 필요하다(고치기의 본인 확인, 2026-10-23 노영주) — 비었으면 막고, api 상한(128자)을 넘으면 맞을 수 없어 불일치로 본다.
 */
export function validateTaxProfileEdit(input: TaxProfileEditInput): { body: SaveTaxProfileBody } | TaxProfileEditState {
  const front = digitsOnly(input.rrnFront);
  const back = digitsOnly(input.rrnBack);
  const account = digitsOnly(input.payrollAccountNumber);
  const body: SaveTaxProfileBody = {};
  if (front || back) {
    if (!/^\d{6}$/.test(front) || !/^\d{7}$/.test(back)) return problem("rrn", RRN_SHAPE);
    body.rrn = front + back;
  }
  if (input.bankCode || account) {
    if (!input.bankCode) return problem("bank", ACCOUNT_INCOMPLETE);
    if (!account) return problem("account", ACCOUNT_INCOMPLETE);
    // api 의 상한(MaxLength 20). 목록에 없는 코드는 api 가 BANK_CODE_UNKNOWN 으로 막는다.
    if (input.bankCode.length > 20) return problem("bank", "은행을 다시 골라 주세요");
    if (!/^\d{10,16}$/.test(account)) return problem("account", ACCOUNT_SHAPE);
    body.bankCode = input.bankCode;
    body.payrollAccountNumber = account;
  }
  if (body.rrn === undefined && body.bankCode === undefined) return problem("form", NOTHING_TO_CHANGE);
  if (!input.currentPassword) return problem("currentPassword", CURRENT_PASSWORD_EMPTY);
  if (input.currentPassword.length > 128) return problem("currentPassword", CURRENT_PASSWORD_MISMATCH);
  body.currentPassword = input.currentPassword;
  return { body };
}

/**
 * 저장 전 조회(`GET`) · 저장(`PUT /me/memberships/:id/tax-profile`) 실패를 화면 상태로. 두 호출의 404 · 503 · 500 은 뜻이 같다. 400 은 본문의 code 로 가른다(메시지는 api 가 고칠 수 있다).
 * log 는 화면이 미리 막았어야 할 응답(TAX_PROFILE_* · 형식 사유 · 영어 사유의 400, 예상 밖 4xx)을 계약 어긋남으로 남길지다.
 * 5xx · 연결 실패는 request() 가 남겼다. 문구에 넣은 값을 싣지 않는다.
 */
export function taxProfileSaveFailure(failure: ApiFailure): { state: TaxProfileEditState; log: boolean } {
  if (failure === "network") return { state: problem("form", CONNECTION_FAILED), log: false };
  const { status, message, code } = failure;
  if (status === 400) {
    if (code === "CURRENT_PASSWORD_MISMATCH") return { state: problem("currentPassword", CURRENT_PASSWORD_MISMATCH), log: false };
    if (code === "RRN_BIRTH_MISMATCH") return { state: problem("rrn", RRN_BIRTH_MISMATCH), log: false };
    if (code === "BANK_CODE_UNKNOWN") return { state: problem("bank", "은행을 다시 골라 주세요"), log: false };
    if (code === "TAX_PROFILE_ACCOUNT_INCOMPLETE") return { state: problem("account", ACCOUNT_INCOMPLETE), log: true };
    if (code === "TAX_PROFILE_EMPTY") return { state: problem("form", NOTHING_TO_CHANGE), log: true };
    // 이 화면은 이미 낸 신고 정보만 고친다. 그사이 신고 정보가 없어졌다(처음 넣기는 날인 뒤 흐름 몫).
    if (code === "TAX_PROFILE_INCOMPLETE") return { state: problem("form", TAX_PROFILE_MISSING), log: true };
    // 형식 검증(class-validator)의 한글 사유 — 화면이 미리 걸러 대개 오지 않는다.
    if (message.includes("주민등록번호")) return { state: problem("rrn", RRN_SHAPE), log: true };
    if (message.includes("계좌번호")) return { state: problem("account", ACCOUNT_SHAPE), log: true };
    // 지금 비밀번호의 형식 검증(빈 글자 · 129자 이상)은 영어 원문이다.
    if (message.includes("currentPassword")) return { state: problem("currentPassword", CURRENT_PASSWORD_EMPTY), log: true };
    return { state: problem("form", "넣은 값을 다시 확인해 주세요"), log: true };
  }
  if (status === 404)
    return { state: problem("form", "이 근무지의 신고 정보를 고칠 수 없습니다. 소속 근무지에서 다시 열어 주세요"), log: false };
  if (status === 429) return { state: problem("form", RATE_LIMITED), log: false };
  // 503 — 서버에 암호화 키가 없음. 저장 전 조회(GET)의 503 사유는 「볼 수 없습니다」라 api 사유를 쓰지 않고 고정 문구다.
  if (status === 503) return { state: problem("form", `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}`), log: false };
  // 500 — 저장된 값을 풀 수 없음(키 다름 · 손상). 다시 해도 풀리지 않는다.
  if (status === 500) return { state: problem("form", `신고 정보를 저장하지 못했습니다. ${REPORT_IF_REPEATED}`), log: false };
  return { state: problem("form", `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}`), log: status < 500 };
}

/** 처음 넣기를 보냈는데 이 소속에 이미 낸 신고 정보가 있을 때 — 처음 넣기는 덮어쓰지 않는다. */
export const TAX_PROFILE_ALREADY_SUBMITTED = "이 근무지에는 이미 낸 신고 정보가 있습니다. 바꾸려면 신고 정보의 「새로 넣기」에서 바꿔 주세요";
/** 처음 넣기에서 은행을 고르지 않았을 때. */
export const BANK_REQUIRED = "급여를 받을 은행을 골라 주세요";
/** 처음 넣기의 api 404 — 내 소속이 아니다(퇴직 · 남의 id). */
export const TAX_PROFILE_CREATE_NOT_FOUND = "이 근무지에는 신고 정보를 넣을 수 없습니다. 소속 근무지에서 다시 열어 주세요";

/**
 * 날인 뒤 처음 넣기(WHALEERP-150)의 값 거르기. 주민등록번호 · 은행 · 계좌번호 셋 다 필수이고, 지금 비밀번호는 보내지 않는다 —
 * api 는 처음 작성에 비밀번호를 비교하지 않지만 빈 문자열은 형식 400 이다(api #138). 맞으면 api 본문, 아니면 화면 상태.
 */
export function validateTaxProfileCreate(input: TaxProfileEditInput): { body: SaveTaxProfileBody } | TaxProfileEditState {
  const front = digitsOnly(input.rrnFront);
  const back = digitsOnly(input.rrnBack);
  const account = digitsOnly(input.payrollAccountNumber);
  if (!/^\d{6}$/.test(front) || !/^\d{7}$/.test(back)) return problem("rrn", RRN_SHAPE);
  if (!input.bankCode) return problem("bank", BANK_REQUIRED);
  if (input.bankCode.length > 20) return problem("bank", "은행을 다시 골라 주세요");
  if (!/^\d{10,16}$/.test(account)) return problem("account", ACCOUNT_SHAPE);
  return { body: { rrn: front + back, bankCode: input.bankCode, payrollAccountNumber: account } };
}

/**
 * 처음 넣기의 저장 실패. alreadySaved 면 화면에 오류를 보이지 말고 다시 읽어 저장됐는지 본다 — 처음 작성을 두 번 동시에 보내면
 * 뒤쪽은 이미 낸 신고 정보를 고치는 것으로 읽혀 400 CURRENT_PASSWORD_MISMATCH 가 된다(api #138, 2026-10-23 노영주).
 * 그 밖은 고치기와 같고, 처음 넣기에서 뜻이 다른 것(빠진 칸 · 404)만 문구를 바꾼다.
 */
export function taxProfileCreateFailure(failure: ApiFailure): { state: TaxProfileEditState; log: boolean; alreadySaved: boolean } {
  if (failure !== "network" && failure.status === 400 && failure.code === "CURRENT_PASSWORD_MISMATCH")
    return { state: problem("form", `신고 정보를 저장했는지 확인하지 못했습니다. ${RETRY_LATER}`), log: false, alreadySaved: true };
  if (failure !== "network" && failure.status === 400 && (failure.code === "TAX_PROFILE_INCOMPLETE" || failure.code === "TAX_PROFILE_EMPTY"))
    return { state: problem("form", "주민등록번호와 급여 계좌를 모두 넣어 주세요"), log: true, alreadySaved: false };
  if (failure !== "network" && failure.status === 404)
    return { state: problem("form", TAX_PROFILE_CREATE_NOT_FOUND), log: false, alreadySaved: false };
  const { state, log } = taxProfileSaveFailure(failure);
  // 처음 넣기 화면에는 지금 비밀번호 칸이 없다 — 그 칸의 오류는 버튼 위로 옮긴다(보내지 않으므로 오면 계약이 어긋난 것).
  if (state.problem?.field === "currentPassword")
    return { state: problem("form", `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}`), log: true, alreadySaved: false };
  return { state, log, alreadySaved: false };
}
