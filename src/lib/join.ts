// 초대 코드 입력 · 초대 확인 · 가입(WHALEERP-141 · 142, 진입 · 가입 화면 가이드 JOIN-7)의 순수 계산.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import type { Schemas } from "./api";
import { lockOf, type AttemptLock } from "./attempt-lock.ts";
import { checkPasswordRules } from "./password-rules.ts";

/**
 * 초대를 찾는 값 — 초대 링크의 토큰, 또는 휴대전화번호 + 초대 코드. 확인을 마치면 쿠키에 두고 가입까지 들고 간다
 * (api 는 가입 요청에서 초대를 다시 찾는다).
 */
export type InvitationLookup = { token: string } | { phone: string; code: string };

/** 초대 링크의 토큰(base64url 43자) — api InvitationLookupDto 와 같은 모양. */
const INVITATION_TOKEN = /^[A-Za-z0-9_-]{43}$/;
/** 초대 코드 — 대문자 · 숫자 8자리, 헷갈리는 0 · O · 1 · I 는 없다. */
const INVITE_CODE = /^[A-HJ-NP-Z2-9]{8}$/;
export const INVITE_CODE_LENGTH = 8;

export const isInvitationToken = (token: string) => INVITATION_TOKEN.test(token);
export const isInviteCode = (code: string) => INVITE_CODE.test(code);

/** 초대 코드 칸의 값 — 공백을 빼고 대문자로 맞춘다(api 도 소문자를 대문자로 맞춰 본다). */
export const normalizeInviteCode = (raw: string) => raw.replace(/\s/g, "").toUpperCase();

/**
 * 휴대전화번호 칸에 보일 값 — 숫자만 남겨 하이픈을 넣는다(가이드 ①: 숫자만 받고 하이픈은 화면이 넣는다). 11자리를 넘는 숫자는
 * 버린다. 10자리 이하는 3-3-4, 11자리는 3-4-4 다.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const middle = digits.length === 11 ? 4 : 3;
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middle)}-${digits.slice(3 + middle)}`;
}

/** 초대 쿠키의 값. 모양이 다르면(손으로 고친 값 · 옛 쿠키) 없는 것으로 본다 — 화면은 처음 단계로 돌려보낸다. */
export function parseInvitationLookup(raw: string | undefined): InvitationLookup | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { token, phone, code } = value as Record<string, unknown>;
  if (typeof token === "string" && isInvitationToken(token)) return { token };
  if (typeof phone === "string" && /^\d{10,11}$/.test(phone) && typeof code === "string" && isInviteCode(code)) return { phone, code };
  return null;
}

/**
 * 초대 확인 · 가입의 api 실패를 가른다. 가르는 기준은 본문의 code 다(메시지는 api 가 고칠 수 있다).
 * - not-found: 번호나 코드가 틀림(INVITATION_NOT_FOUND). 링크의 토큰이면 끝난 초대와 같은 안내다.
 * - ended: 기한 · 다시 보냄 · 번호 변경 · 퇴직 · 가입 불가로 끝난 초대.
 * - joined: 이미 가입을 마친 초대. has-account: 그 번호로 계정이 이미 있음. 둘 다 로그인으로 보낸다.
 * - locked: 같은 번호로 5번 틀려 30분 잠김(해제 시각과 함께). rate-limited: 공개 경로의 요청 제한.
 * - under-age · birth-date-in-future · email-taken: 가입에서만 온다.
 * - unknown: 그 밖(형식 검증 400 · 5xx 등) — 부른 쪽이 상태 코드와 메시지로 다룬다.
 * `ApiError` 를 그대로 넘긴다.
 */
export type InvitationProblem =
  | { kind: "not-found" | "ended" | "joined" | "has-account" | "rate-limited" }
  | { kind: "locked"; attemptLock: AttemptLock }
  | { kind: "under-age" | "birth-date-in-future" | "email-taken" }
  | { kind: "unknown" };

export function invitationProblemOf(error: { status: number; body: unknown }, serverNow = Date.now()): InvitationProblem {
  const body = error.body;
  const code = typeof body === "object" && body !== null && "code" in body ? body.code : undefined;
  if (error.status === 404 && code === "INVITATION_NOT_FOUND") return { kind: "not-found" };
  if (error.status === 404 && code === "INVITATION_ENDED") return { kind: "ended" };
  if (error.status === 409 && code === "INVITATION_ALREADY_JOINED") return { kind: "joined" };
  if (error.status === 409 && code === "ACCOUNT_EXISTS") return { kind: "has-account" };
  if (error.status === 409 && code === "ACCOUNT_EMAIL_TAKEN") return { kind: "email-taken" };
  if (error.status === 400 && code === "SIGNUP_UNDER_AGE") return { kind: "under-age" };
  if (error.status === 400 && code === "BIRTH_DATE_IN_FUTURE") return { kind: "birth-date-in-future" };
  if (error.status === 429) {
    // 잠금의 429 에는 code 와 해제 시각이 있고, 요청 제한의 429 에는 둘 다 없다. 잠금인데 해제 시각을 읽지 못하면 계약이 어긋난 것이다.
    if (code !== "INVITATION_CODE_LOCKED") return { kind: "rate-limited" };
    const lock = lockOf(error, serverNow);
    return lock.kind === "locked" ? { kind: "locked", attemptLock: lock.attemptLock } : { kind: "unknown" };
  }
  return { kind: "unknown" };
}

/** api StaffSignupDto 의 성별 값(어긋나면 타입 오류). 한글 이름은 enum `Gender` 로 받는다. */
export const GENDERS = ["MALE", "FEMALE"] as const satisfies readonly Schemas["StaffSignupDto"]["gender"][];
export const isGender = (value: string): value is (typeof GENDERS)[number] => (GENDERS as readonly string[]).includes(value);
/** api StaffSignupDto 의 이름 최대 길이. api 는 NFC 로 바꾼 뒤 센다. */
export const SIGNUP_NAME_MAX = 50;

export type SignupField = "name" | "birthDate" | "gender" | "email" | "newPassword" | "newPasswordConfirmation" | "address" | "form";

/**
 * 가입 400 의 한글 사유를 붙일 칸. api 의 사유는 비밀번호 규칙(validateNewPassword) · 이메일 형식 · 생년월일 형식이 한글이다.
 * 「아이디로 쓰는 이메일이나 그 앞부분은 비밀번호로…」처럼 둘 다 든 사유는 비밀번호 규칙이라 비밀번호를 먼저 본다. 모르는 사유는 버튼 위(form).
 */
export function signupFieldOf(message: string): SignupField {
  if (message.includes("비밀번호")) return "newPassword";
  if (message.includes("생년월일")) return "birthDate";
  if (message.includes("이메일")) return "email";
  return "form";
}

export const BAD_BIRTH_DATE = "생년월일 8자리를 넣어 주세요. 19990412 처럼 넣어 주세요";

/** 계정 등록 칸의 값. 앞뒤 공백은 뗐고 생년월일은 normalizeBirthDate 를 거쳤다. */
export interface SignupFields {
  name: string;
  birthDate: string;
  gender: string;
  email: string;
  newPassword: string;
  newPasswordConfirmation: string;
  zipCode: string;
  address: string;
}

/**
 * api 에 보내기 전에 칸별로 먼저 알릴 문제 — 화면 위에서 아래 순서로 처음 하나. 없으면 null. 비밀번호 규칙은 화면의 조건 목록과
 * 같은 checkPasswordRules 다. 판정은 api 가 다시 한다(없는 날짜 · 오늘 뒤 날짜 · 이메일 형식 · 이메일 중복).
 */
export function signupFieldProblem(fields: SignupFields): { field: SignupField; error: string } | null {
  const { name, birthDate, gender, email, newPassword } = fields;
  if (!name) return { field: "name", error: "이름을 넣어 주세요" };
  if (name.normalize("NFC").length > SIGNUP_NAME_MAX) return { field: "name", error: `이름은 ${SIGNUP_NAME_MAX}자까지 넣을 수 있습니다` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return { field: "birthDate", error: BAD_BIRTH_DATE };
  if (!isGender(gender)) return { field: "gender", error: "성별을 골라 주세요" };
  if (!email) return { field: "email", error: "이메일을 넣어 주세요" };
  const rules = checkPasswordRules(newPassword, email);
  if (!rules.kinds || !rules.length || !rules.notEmail) return { field: "newPassword", error: "아래 비밀번호 조건을 확인해 주세요" };
  if (newPassword !== fields.newPasswordConfirmation) return { field: "newPasswordConfirmation", error: "두 칸의 비밀번호가 다릅니다" };
  if (!fields.zipCode || !fields.address) return { field: "address", error: "주소를 검색해 골라 주세요" };
  return null;
}

/** 글자(코드 포인트) 단위로 자른다 — UTF-16 단위로 자르면 경계의 이모지가 반쪽만 남아 쿠키에 넣을 때 URIError 가 난다. */
export const clipChars = (text: string, max: number) => Array.from(text).slice(0, max).join("");
