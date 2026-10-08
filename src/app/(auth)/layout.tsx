import type { ReactNode } from "react";
import { StaffRoot } from "@/components/common";

// 직원 근무 앱 화면 틀. 휴대전화 한 열이고, 데스크톱에서는 가운데 430px 로 보인다.
// (auth) 와 (app) 은 같은 틀이다. 폴더를 나눈 것은 proxy 의 로그인 판정이 달라서다.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <StaffRoot>
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-staff-bg">{children}</main>
    </StaffRoot>
  );
}
