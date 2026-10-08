import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PIN_RESEND_MS, PIN_VALID_MS, isPinExpired, maskEmail, readPasswordReset } from "@/lib/password-reset";
import { PinForm } from "./pin-form";

export const metadata: Metadata = { title: "인증번호 · Whale ERP" };

export default async function PinPage() {
  const state = await readPasswordReset();
  if (!state) redirect("/password-reset");
  // timeout 은 비밀값이 아니라 주소에 둬도 된다.
  if (isPinExpired(state)) redirect("/password-reset?timeout=1");
  return (
    <PinForm
      maskedEmail={maskEmail(state.email)}
      issuedAt={state.issuedAt}
      validMs={PIN_VALID_MS}
      resendMs={PIN_RESEND_MS}
    />
  );
}
