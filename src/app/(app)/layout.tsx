import type { ReactNode } from "react";
import { StaffRoot } from "@/components/common";

// 직원 근무 앱 화면 틀. 휴대전화 한 열이고, 데스크톱에서는 가운데 430px 로 보인다.
// (auth) 와 (app) 은 같은 틀이다. 로그인 없이 여는 화면과 로그인한 화면을 나눠 둔 것이고, proxy 는 폴더가 아니라
// 경로 목록(PUBLIC_PATHS)으로 판정한다 — (auth) 에 화면을 더하면 proxy 의 PUBLIC_PATHS 에도 더한다.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StaffRoot>
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-staff-bg">{children}</main>
    </StaffRoot>
  );
}
