"use server";

import { headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { RATE_LIMITED, isHangulReason } from "@/lib/action-errors";
import { ApiError, NetworkError, logUnexpected, type Schemas } from "@/lib/api";
import type { AttemptLock } from "@/lib/attempt-lock";
import { checkInvitation, signup } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { normalizeBirthDate, normalizePhone } from "@/lib/email-find";
import { clearInvitation, readInvitation, saveInvitation, saveJoinedStore } from "@/lib/invitation-cookie";
import { invitationProblemOf, isInvitationToken, isInviteCode, normalizeInviteCode, signupFieldOf, type SignupField } from "@/lib/join";
import { checkPasswordRules } from "@/lib/password-rules";
import { getDeviceId, saveLogin } from "@/lib/session";
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
  await prepareDeviceId();
  redirect("/join/invitation");
}

/**
 * 기기 쿠키(가입 요청의 deviceIdentifier)를 초대를 확인할 때 미리 굽는다. 처음 쓰는 휴대폰이면 계정 등록의 액션이 이 쿠키를 새로
 * 굽게 되는데, 쿠키를 바꾼 액션 뒤에는 Next 가 화면을 서버에서 다시 그려 초대를 다시 확인한다 — 만 19세 미만으로 끝난 초대는 그때
 * 「끝난 초대」로 보여 가입 불가 안내가 덮인다.
 */
async function prepareDeviceId(): Promise<void> {
  await getDeviceId();
}

/**
 * 초대 링크(`/invite#token=…`)를 열 때 부른다. fromHash 는 주소의 토큰이다. 모양이 맞으면 쿠키에 두고 초대 확인으로 가고(확인은 그
 * 화면이 한다), 없거나 모양이 틀리면 invalid 를 돌려준다. 링크 화면을 히스토리에 남기지 않는다 — 뒤로 가면 토큰 없는 주소가 된다.
 */
export async function openInviteLinkAction(fromHash: string | null): Promise<{ status: "invalid" }> {
  // 서버 액션은 누구나 아무 값으로 부를 수 있다. 문자열이 아니면 주소에 토큰이 없는 것으로 본다.
  if (typeof fromHash !== "string" || !isInvitationToken(fromHash)) return { status: "invalid" };
  await saveInvitation({ token: fromHash });
  await prepareDeviceId();
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

const GENDERS = ["MALE", "FEMALE"] as const satisfies readonly Schemas["StaffSignupDto"]["gender"][];
const isGender = (value: string): value is (typeof GENDERS)[number] => (GENDERS as readonly string[]).includes(value);
/** api StaffSignupDto 의 이름 최대 길이. api 는 NFC 로 바꾼 뒤 센다. */
const NAME_MAX = 50;

export async function signupAction(_previous: SignupState, formData: FormData): Promise<SignupState> {
  const lookup = await readInvitation();
  if (!lookup) return { step: "expired" };
  // 초대를 확인할 때 구워 둔 기기 쿠키를 읽는다(prepareDeviceId).
  const deviceIdentifier = await getDeviceId();
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
  if (!name) return input("name", "이름을 넣어 주세요");
  if (name.normalize("NFC").length > NAME_MAX) return input("name", `이름은 ${NAME_MAX}자까지 넣을 수 있습니다`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return input("birthDate", "생년월일 8자리를 넣어 주세요. 19990412 처럼 넣어 주세요");
  if (!isGender(gender)) return input("gender", "성별을 골라 주세요");
  if (!email) return input("email", "이메일을 넣어 주세요");
  const rules = checkPasswordRules(newPassword, email);
  if (!rules.kinds || !rules.length || !rules.notEmail) return input("newPassword", "아래 비밀번호 조건을 확인해 주세요");
  if (newPassword !== text("newPasswordConfirmation")) return input("newPasswordConfirmation", "두 칸의 비밀번호가 다릅니다");
  if (!zipCode || !address) return input("address", "주소를 검색해 골라 주세요");

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
      if (error.status === 400 && isHangulReason(error.message)) return input(signupFieldOf(error.message), error.message);
      if (error.status < 500) logUnexpected("join-signup", error);
      return input("form", "가입하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
    }
    if (error instanceof NetworkError) return input("form", CONNECTION_FAILED_MESSAGE);
    throw error;
  }
  // 저장은 try 밖이다. 여기서 나는 오류는 api 응답 모양이 바뀐 결함이라 연결 실패로 숨기지 않는다.
  await saveLogin(result);
  await clearInvitation();
  await saveJoinedStore(text("storeName"));
  // 계정 등록 화면을 히스토리에 남기지 않는다. 뒤로 가면 다 쓴 초대를 다시 확인하게 된다.
  redirect("/join/done", RedirectType.replace);
}
