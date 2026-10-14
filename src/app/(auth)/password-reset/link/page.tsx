import type { Metadata } from "next";
import { LinkScreen } from "./link-screen";

export const metadata: Metadata = { title: "새 비밀번호 · Whale ERP" };

// 관리자가 보낸 재설정 링크(WHALEERP-173). 토큰이 주소의 fragment(#token=)라 서버는 읽지 못한다 — 화면이 브라우저에서 읽어 확인한다.
export default function PasswordResetLinkPage() {
  return <LinkScreen />;
}
