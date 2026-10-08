import type { Metadata } from "next";
import { RequestPinForm } from "./request-pin-form";

export const metadata: Metadata = { title: "비밀번호 재설정 · Whale ERP" };

export default async function PasswordResetPage({ searchParams }: PageProps<"/password-reset">) {
  const { timeout } = await searchParams;
  return <RequestPinForm timedOut={timeout !== undefined} />;
}
