import type { Metadata } from "next";
import { InviteCodeForm } from "./invite-code-form";

export const metadata: Metadata = { title: "초대 코드로 가입 · Whale ERP" };

// 초대 코드 입력(WHALEERP-141, 가이드 ①). 진입은 로그인 화면의 「초대 코드로 가입」이다. 초대 링크로 열면 이 화면을 건너뛴다(/invite).
export default function JoinPage() {
  return <InviteCodeForm />;
}
