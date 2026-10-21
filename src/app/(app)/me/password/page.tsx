import type { Metadata } from "next";
import { PageHeader } from "@/components/common";
import { getMyProfile } from "@/lib/my-profile";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "비밀번호 변경 · Whale ERP" };

// 내 정보 → 비밀번호 「변경」(WHALEERP-194). 이메일은 「이메일 아이디와 겹치지 않기」 조건을 보이려고 받는다 — 로그인 쿠키의
// 이메일은 로그인한 순간의 값이라(이메일을 바꾼 뒤에는 옛 값) 내 정보에서 지금 값을 받는다.
export default async function PasswordPage() {
  const { email } = await getMyProfile();
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="비밀번호 변경" backHref="/me" />
      <PasswordForm email={email} />
    </div>
  );
}
