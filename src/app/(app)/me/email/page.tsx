import type { Metadata } from "next";
import { PageHeader } from "@/components/common";
import { getMyProfile } from "@/lib/my-profile";
import { EmailForm } from "./email-form";

export const metadata: Metadata = { title: "이메일 변경 · Whale ERP" };

// 내 정보 → 이메일 「변경」(WHALEERP-195, api 191). 지금 아이디는 내 정보에서 받는다 — 로그인 쿠키의 이메일은 로그인한 순간의
// 값이라 이메일을 바꾼 뒤에는 옛 값이다. 바꿔도 지금 접속은 이어지고, 다음 로그인부터 새 이메일을 쓴다(바꾸기 전에는 이전 이메일).
export default async function EmailPage() {
  const { email } = await getMyProfile();
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="이메일 변경" backHref="/me" />
      <EmailForm currentEmail={email} />
    </div>
  );
}
