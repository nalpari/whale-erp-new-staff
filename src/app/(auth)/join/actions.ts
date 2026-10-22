"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { RATE_LIMITED, isHangulReason } from "@/lib/action-errors";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import type { AttemptLock } from "@/lib/attempt-lock";
import { checkInvitation, signup } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { normalizeBirthDate, normalizePhone } from "@/lib/email-find";
import { clearInvitation, readInvitation, saveInvitation, saveJoinedStore } from "@/lib/invitation-cookie";
import {
  BAD_BIRTH_DATE,
  invitationProblemOf,
  isGender,
  isInvitationToken,
  isInviteCode,
  normalizeInviteCode,
  signupFieldOf,
  signupFieldProblem,
  type SignupField,
} from "@/lib/join";
import { readDeviceId, saveDeviceId, saveLogin } from "@/lib/session";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

/** 번호 · 코드에 맞는 초대가 없다. 어느 쪽이 틀렸는지, 그 번호로 초대가 있는지 알리지 않는다(JOIN-7). */
const CODE_MISMATCH = "휴대전화번호나 초대 코드를 다시 확인해 주세요";

/** 초대가 끝났거나(ended) · 이미 가입을 마쳤거나(joined) · 그 번호로 계정이 있다(has-account). 화면이 각 안내로 바뀐다. */
export type InvitationEnd = "ended" | "joined" | "has-account";

/**
 * 초대 코드 입력(가이드 ①) 결과. 맞으면 초대를 쿠키에 두고 초대 확인(/join/invitation)으로 가므로 상태로 돌아오지 않는다.
 * - input: 입력 화면. field 가 phone · code 면 그 칸 아래, form 이면 버튼 위 알림.
 * - locked: 같은 번호로 5번 틀려 30분 잠김. 해제 시각과 그때의 서버 시각을 든다.
 */
export type InviteCodeState =
  | { step: "input"; error?: string; field?: "phone" | "code" | "form" }
  | ({ step: "locked" } & AttemptLock)
  | { step: InvitationEnd };

export async function checkInviteCodeAction(_previous: InviteCodeState, formData: FormData): Promise<InviteCodeState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const code = normalizeInviteCode(String(formData.get("code") ?? ""));
  const input = (field: "phone" | "code" | "form", error: string): InviteCodeState => ({ step: "input", field, error });
  // 모양이 틀린 값은 api 에 보내지 않는다 — 형식 오류로는 잠금 횟수가 쌓이지 않지만 요청 제한에는 든다.
  if (!/^\d{10,11}$/.test(phone)) return input("phone", "휴대전화번호를 확인해 주세요. 010-1234-5678 처럼 넣어 주세요");
  if (!isInviteCode(code)) return input("code", "초대 코드 8자리를 확인해 주세요. 0 · O · 1 · I 는 쓰지 않습니다");

  try {
    await checkInvitation({ phone, code }, clientIpFrom(await headers()));
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      if (problem.kind === "not-found") return input("form", CODE_MISMATCH);
      if (problem.kind === "ended" || problem.kind === "joined" || problem.kind === "has-account") return { step: problem.kind };
      if (problem.kind === "locked") return { step: "locked", ...problem.attemptLock };
      if (problem.kind === "rate-limited") return input("form", RATE_LIMITED);
      // 5xx 는 request() 가 남겼다. 모양은 위에서 걸렀으니 4xx 는 api 계약이 어긋난 것이다.
      if (error.status < 500) logUnexpected("join", error);
      return input("form", "초대를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
    }
    if (error instanceof NetworkError) return input("form", CONNECTION_FAILED_MESSAGE);
    throw error;
  }
  await saveInvitation({ phone, code });
  redirect("/join/invitation");
}

/**
 * 초대 링크(`/invite#token=…`)를 열 때 부른다. fromHash 는 주소의 토큰이다. 모양이 맞으면 쿠키에 두고 초대 확인으로 가고(확인은 그
 * 화면이 한다), 없거나 모양이 틀리면 invalid 를 돌려준다. 링크 화면을 히스토리에 남기지 않는다 — 뒤로 가면 토큰 없는 주소가 된다.
 */
export async function openInviteLinkAction(fromHash: string | null): Promise<{ status: "invalid" }> {
  // 서버 액션은 누구나 아무 값으로 부를 수 있다. 문자열이 아니면 주소에 토큰이 없는 것으로 본다.
  if (typeof fromHash !== "string" || !isInvitationToken(fromHash)) return { status: "invalid" };
  await saveInvitation({ token: fromHash });
  redirect("/join/invitation", RedirectType.replace);
}

/**
 * 계정 등록(가이드 ③) 결과. 가입을 마치면 로그인 쿠키를 굽고 가입 완료(/join/done)로 가므로 상태로 돌아오지 않는다.
 * - input: 입력 화면. error 는 field 칸 아래(form 이면 버튼 위 알림)에 보인다.
 * - expired: 초대 쿠키(30분)가 없다 — 처음부터 다시.
 * - under-age: 만 19세 미만이라 가입하지 않았다(초대는 가입 불가가 됨). 다시 시도하는 길은 두지 않는다(ACC-22).
 * - locked: 그사이 같은 번호가 잠겼다(번호 + 코드로 온 경우).
 * 쿠키를 지우면 Next 가 이 화면을 서버에서 다시 그려 초대를 다시 확인하므로, 실패에서는 초대 쿠키를 건드리지 않는다(30분이면 사라진다).
 */
export type SignupState =
  | { step: "input"; error?: string; field?: SignupField }
  | { step: InvitationEnd | "expired" | "under-age" }
  | ({ step: "locked" } & AttemptLock);

/** 가입 요청의 결과를 모른다(5xx · 연결 실패 · 시간 초과). 다시 누르면 api 가 지금 상태로 답한다. */
const SIGNUP_UNKNOWN = "가입 결과를 확인하지 못했습니다. 잠시 뒤 「가입하기」를 다시 누르면 결과를 알려 드립니다";

export async function signupAction(_previous: SignupState, formData: FormData): Promise<SignupState> {
  const lookup = await readInvitation();
  if (!lookup) return { step: "expired" };
  // 기기 쿠키는 읽기만 하고, 없으면 가입에 성공한 뒤에 굽는다 — 실패에서 쿠키를 바꾸면 Next 가 화면을 서버에서 다시 그려
  // 초대를 다시 확인하고, 만 19세 미만으로 끝난 초대는 그때 「끝난 초대」로 보여 가입 불가 안내가 덮인다.
  const existingDeviceId = await readDeviceId();
  const deviceIdentifier = existingDeviceId ?? crypto.randomUUID();
  const text = (name: string) => String(formData.get(name) ?? "");
  const name = text("name").trim();
  const birthDate = normalizeBirthDate(text("birthDate"));
  const gender = text("gender");
  const email = text("email").trim();
  const newPassword = text("newPassword");
  const zipCode = text("zipCode");
  const address = text("address");
  const input = (field: SignupField, error: string): SignupState => ({ step: "input", field, error });

  // 화면 위에서 아래 순서로 먼저 칸별로 알린다. 판정은 api 가 다시 한다.
  const invalid = signupFieldProblem({
    name,
    birthDate,
    gender,
    email,
    newPassword,
    newPasswordConfirmation: text("newPasswordConfirmation"),
    zipCode,
    address,
  });
  if (invalid) return input(invalid.field, invalid.error);
  // 위에서 걸렀다 — 타입만 좁힌다.
  if (!isGender(gender)) return input("gender", "성별을 골라 주세요");

  let result;
  try {
    result = await signup(
      {
        ...lookup,
        name,
        birthDate,
        gender,
        isForeigner: formData.get("isForeigner") === "true",
        email,
        password: newPassword,
        zipCode,
        address,
        addressDetail: text("addressDetail").trim() || undefined,
        // 체크 칸은 api 가 물을 때(asksHqSharingConsent)만 그려진다. 묻지 않는 초대에 보내도 api 는 저장하지 않는다.
        ...(formData.get("hqSharingConsented") === "on" ? { hqSharingConsented: true } : {}),
        deviceIdentifier,
      },
      clientIpFrom(await headers()),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      const problem = invitationProblemOf(error);
      // 번호 + 코드가 그사이 바뀌었으면(재발송) not-found 다. 확인을 마친 초대가 끝난 것과 같은 안내다.
      if (problem.kind === "not-found" || problem.kind === "ended") return { step: "ended" };
      if (problem.kind === "joined" || problem.kind === "has-account" || problem.kind === "under-age") return { step: problem.kind };
      if (problem.kind === "locked") return { step: "locked", ...problem.attemptLock };
      if (problem.kind === "rate-limited") return input("form", RATE_LIMITED);
      if (problem.kind === "birth-date-in-future") return input("birthDate", "생년월일을 다시 확인해 주세요");
      if (problem.kind === "email-taken") return input("email", "이미 가입한 이메일입니다. 다른 이메일을 쓰거나 로그인해 주세요");
      // 400 의 한글 사유(비밀번호 규칙 · 이메일 · 생년월일 형식)는 그 칸에 그대로 보인다. 영어 원문은 화면과 api 의 계약이 어긋난 신호다.
      if (error.status === 400 && isHangulReason(error.message)) {
        const field = signupFieldOf(error.message);
        // 없는 날짜(19991340)의 api 사유는 YYYY-MM-DD 형식을 말한다. 화면은 8자리로 받으니 화면 문구로 바꾼다.
        return input(field, field === "birthDate" ? BAD_BIRTH_DATE : error.message);
      }
      if (error.status < 500) logUnexpected("join-signup", error);
      // api 는 가입을 커밋한 뒤 접속 상태를 연다 — 5xx 여도 가입은 됐을 수 있다. 다시 누르면 「이미 가입을 마친 초대」로 알려 준다.
      return input("form", error.status >= 500 ? SIGNUP_UNKNOWN : "가입하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
    }
    // 응답을 받지 못했다 — 연결 실패든 시간 초과든 가입이 됐는지 모른다.
    if (error instanceof NetworkError) return input("form", SIGNUP_UNKNOWN);
    throw error;
  }
  // 저장은 try 밖이다. 여기서 나는 오류는 api 응답 모양이 바뀐 결함이라 연결 실패로 숨기지 않는다.
  await saveLogin(result);
  if (!existingDeviceId) await saveDeviceId(deviceIdentifier);
  await clearInvitation();
  // 계정 등록 화면이 숨은 칸에 실은 근무지 이름이다. 보낸 사람이 바꿀 수 있지만 자기 화면에만 보이고 글자로만 그린다.
  await saveJoinedStore(text("storeName"));
  // 계정 등록 화면을 히스토리에 남기지 않는다. 뒤로 가면 다 쓴 초대를 다시 확인하게 된다.
  redirect("/join/done", RedirectType.replace);
}
