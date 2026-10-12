import type { Metadata } from "next";
import { Alert, Card, Dock } from "@/components/common";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { requireSession } from "@/lib/session";
import { LogoutSheet } from "./logout-sheet";

export const metadata: Metadata = { title: "홈 · Whale ERP" };

// 임시 홈 — 로그인 뒤 갈 곳. 실제 홈(WHALEERP-311 개인 근무 대시보드 · 313 앱 홈 카드)은
// 다른 작업자가 이 파일을 바꿔 채운다. 로그아웃의 실제 자리는 내 정보 화면(WHALEERP-193)이다.
export default async function HomePage() {
  const { account } = await requireSession();
  // 한글 이름 하나 때문에 화면 전체를 오류로 만들지 않는다. 못 받으면 labelOf 가 값 그대로 보인다.
  const statuses = await getEnumOrEmpty("AccountStatus");

  return (
    <>
      <div className="flex flex-col gap-[16px] px-[24px] pt-[52px] pb-[24px] leading-[1.5]">
        <h1 className="text-[26px] font-bold">{account.realName}님</h1>
        {account.status === "LINK_HOLD" && (
          <Alert tone="warning">
            <strong>관리자가 가입 연결을 확인하고 있습니다.</strong> 확인이 끝나면 근무 정보가 보입니다.
          </Alert>
        )}
        <Card>
          <p className="text-[13px] font-semibold text-staff-text-sub">계정</p>
          <p className="pt-[6px] text-[14px]">{account.email}</p>
          <p className="text-[13px] text-staff-text-sub">{labelOf(statuses, account.status)}</p>
        </Card>
      </div>
      <Dock>
        <LogoutSheet />
      </Dock>
    </>
  );
}
