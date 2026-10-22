import type { Metadata } from "next";
import { InviteLinkScreen } from "./invite-link-screen";

export const metadata: Metadata = { title: "초대 확인 · Whale ERP" };

// 알림톡 · 문자의 초대 링크(WHALEERP-141, 가이드 JOIN-7). 토큰이 주소의 fragment(#token=)라 서버는 읽지 못한다 — 화면이 브라우저에서
// 읽어 넘기면 쿠키에 두고 초대 확인(/join/invitation)으로 간다.
export default function InvitePage() {
  return <InviteLinkScreen />;
}
