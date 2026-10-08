import { requireSession } from "@/lib/session";

// 임시 홈 — 로그인 뒤 갈 곳. 실제 홈(WHALEERP-311 개인 근무 대시보드 · 313 앱 홈 카드)은
// 다른 작업자가 이 파일을 바꿔 채운다.
export default async function HomePage() {
  const { account } = await requireSession();
  return <h1 className="px-[24px] pt-[52px] text-[26px] font-bold">{account.realName}님</h1>;
}
