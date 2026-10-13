import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PIN_RESEND_MS, PIN_VALID_MS, maskEmail, readPasswordReset, readPinClock } from "@/lib/password-reset";
import { PinForm } from "./pin-form";

export const metadata: Metadata = { title: "인증번호 · Whale ERP" };

export default async function PinPage() {
  const state = await readPasswordReset();
  if (!state) redirect("/password-reset");
  const { serverNow, expired } = readPinClock(state);
  return (
    <PinForm
      expired={expired}
      maskedEmail={maskEmail(state.email)}
      issuedAt={state.issuedAt}
      serverNow={serverNow}
      validMs={PIN_VALID_MS}
      resendMs={PIN_RESEND_MS}
    />
  );
}
