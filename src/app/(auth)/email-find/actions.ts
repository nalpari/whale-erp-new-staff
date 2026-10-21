"use server";

import { headers } from "next/headers";
import { ApiError, NetworkError, logUnexpected } from "@/lib/api";
import { type AttemptLock, lockOf } from "@/lib/attempt-lock";
import { findEmails } from "@/lib/auth";
import { clientIpFrom } from "@/lib/client-ip";
import { normalizeBirthDate, normalizePhone } from "@/lib/email-find";
import { CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";

/** 넣은 값. 다시 넣을 때 칸에 되돌려 놓는다. */
export interface EmailFindValues {
  name: string;
  phone: string;
  birthDate: string;
}

/**
 * 이메일 찾기 결과. 찾은 이메일은 쿠키 · 저장소에 남기지 않고 이 상태로만 들고 있다.
 * - input: 입력 화면. error 는 field 칸 아래(form 이면 버튼 위 알림)에 보인다.
 * - not-found: 맞는 계정 없음(어느 값이 틀렸는지 api 가 알리지 않는다).
 * - locked: 그 번호가 5번 틀려 막혔다. lockExpiresAt 은 api 서버, serverNow 는 이 Next 서버의 시각이다. 화면은 serverNow 에
 *   맞춰 세고 두 서버 시계의 차이(보통 몇 초 아래)는 무시한다 — 일찍 풀려 보여도 다시 넣으면 막힘이 다시 뜰 뿐이다.
 */
export type EmailFindState =
  | { step: "input"; values: EmailFindValues; error?: string; field?: "name" | "phone" | "birthDate" | "form" }
  | { step: "found"; emails: string[] }
  | { step: "not-found"; values: EmailFindValues }
  | ({ step: "locked"; values: EmailFindValues } & AttemptLock);

const RATE_LIMITED_MESSAGE = "시도가 많아 잠시 막았습니다. 잠시 뒤에 다시 시도해 주세요";
const BAD_BIRTH_DATE = "생년월일을 확인해 주세요. 1999-04-12 처럼 넣어 주세요";
/** api EmailFindDto 의 이름 최대 길이. api 는 NFC 로 바꾼 뒤 센다. */
const NAME_MAX = 50;

export async function findEmailAction(_previous: EmailFindState, formData: FormData): Promise<EmailFindState> {
  const values: EmailFindValues = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    birthDate: String(formData.get("birthDate") ?? "").trim(),
  };
  // 결과 화면의 「다시 넣기」. api 를 부르지 않고 넣은 값을 칸에 되돌린 입력 화면을 돌려준다.
  if (formData.get("intent") === "retry") return { step: "input", values };
  const input = (field: "name" | "phone" | "birthDate" | "form", error: string): EmailFindState => ({
    step: "input",
    values,
    field,
    error,
  });
  // api 가 400 으로 거를 모양은 먼저 칸별로 알린다. 400 은 번호 잠금 횟수에 들지 않지만 요청 제한에는 든다.
  if (!values.name) return input("name", "이름을 넣어 주세요");
  // 칸의 maxLength 는 화면만 막는다. JS 없이 보낸 긴 이름이 api 400 이 되어 생년월일 오류로 보이지 않게 여기서 거른다.
  if (values.name.normalize("NFC").length > NAME_MAX) return input("name", `이름은 ${NAME_MAX}자까지 넣을 수 있습니다`);
  const phone = normalizePhone(values.phone);
  if (!/^\d{10,11}$/.test(phone)) return input("phone", "휴대전화번호를 확인해 주세요. 010-1234-5678 처럼 넣어 주세요");
  const birthDate = normalizeBirthDate(values.birthDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return input("birthDate", BAD_BIRTH_DATE);

  try {
    const { emails } = await findEmails({ name: values.name, phone, birthDate }, clientIpFrom(await headers()));
    return { step: "found", emails };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { step: "not-found", values };
      if (error.status === 429) {
        const lock = lockOf(error);
        if (lock.kind === "locked") return { step: "locked", values, ...lock.attemptLock };
        // 해제 시각 칸이 있는데 읽지 못하면 api 계약이 어긋난 것이다. 요청 제한 문구로 버티고 남긴다.
        if (lock.kind === "malformed") logUnexpected("email-find", error);
        return input("form", RATE_LIMITED_MESSAGE);
      }
      // 이름 · 번호 · 날짜 모양은 위에서 걸렀으니 남는 400 은 없는 날짜(2월 30일 등)다.
      if (error.status === 400) return input("birthDate", BAD_BIRTH_DATE);
      // 5xx 는 request() 가 남겼다. 예상하지 못한 4xx 는 여기서 남긴다.
      if (error.status < 500) logUnexpected("email-find", error);
      return input("form", "처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
    }
    if (error instanceof NetworkError) return input("form", CONNECTION_FAILED_MESSAGE);
    throw error;
  }
}
