import type { Metadata } from "next";
import { StaffRoot } from "@/components/common";

export const metadata: Metadata = {
  title: "데모 · Whale ERP 직원 근무 앱",
  robots: { index: false },
};

// 직원 근무 앱 클릭 데모(docs/plans/2026-10-08-직원-근무-앱-데모.md). 가짜 값만 쓰고 API 는 부르지 않는다.
// 데스크톱에서도 휴대전화 폭(430px)으로 보이게 가운데 기둥에 담는다. 기둥 밖 바탕은 화면이 아니라 데모 틀이라 한 단계 어둡게 둔다.
export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <StaffRoot>
      <div className="min-h-[100dvh] bg-[#e4e8ef]">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-staff-bg">{children}</div>
      </div>
    </StaffRoot>
  );
}
