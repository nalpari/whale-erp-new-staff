import type { ReactNode } from "react";
import { StaffRoot } from "@/components/common";

// 직원 근무 앱 화면 틀. 한 열이고 폭은 화면을 채운다 — 폴더블(Fold 펼침·Duo)처럼 넓은 화면도 폭을 고정하지 않고 맞춰 늘고 준다.
// (auth) 와 (app) 은 같은 틀이다. 로그인 없이 여는 화면과 로그인한 화면을 나눠 둔 것이고, proxy 는 폴더가 아니라
// 경로 목록(PUBLIC_PATHS)으로 판정한다 — (auth) 에 화면을 더하면 lib/login-return.ts 의 PUBLIC_PATHS 에도 더한다.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <StaffRoot>
      <main className="flex min-h-[100dvh] w-full flex-col bg-staff-bg">{children}</main>
    </StaffRoot>
  );
}
