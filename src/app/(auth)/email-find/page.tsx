import type { Metadata } from "next";
import { EmailFindForm } from "./email-find-form";

export const metadata: Metadata = { title: "이메일 찾기 · Whale ERP" };

// 진입은 비밀번호 재설정 화면(`/password-reset`)의 이메일 칸 아래 링크다. 로그인 화면에는 버튼이 없다(데모 forgot, 2026-10-20 재영, WHALEERP-179).
export default function EmailFindPage() {
  return <EmailFindForm />;
}
