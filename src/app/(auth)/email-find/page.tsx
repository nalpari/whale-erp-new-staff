import type { Metadata } from "next";
import { EmailFindForm } from "./email-find-form";

export const metadata: Metadata = { title: "이메일 찾기 · Whale ERP" };

// 진입 링크는 아직 없다 — 로그인 화면은 버튼 둘(Figma 01.Login, 2026-10-12 재영)이라 어디에 둘지 정해지면 붙인다(WHALEERP-179).
export default function EmailFindPage() {
  return <EmailFindForm />;
}
