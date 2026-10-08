import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PIN_VALID_MS, isPinExpired, readPasswordReset } from "@/lib/password-reset";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "새 비밀번호 · Whale ERP" };

export default async function NewPasswordPage() {
  const state = await readPasswordReset();
  if (!state?.pin) redirect("/password-reset");
  if (isPinExpired(state)) redirect("/password-reset?timeout=1");
  return <NewPasswordForm email={state.email} deadline={state.issuedAt + PIN_VALID_MS} />;
}
