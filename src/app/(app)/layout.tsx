import type { ReactNode } from "react";
import { StaffRoot } from "@/components/common";
import { PageSlide } from "@/components/common/page-slide";

// 직원 근무 앱 화면 틀. 한 열이고 폭은 화면을 채운다 — 폴더블(Fold 펼침·Duo)처럼 넓은 화면도 폭을 고정하지 않고 맞춰 늘고 준다.
// (auth) 와 (app) 은 같은 틀이다. 로그인 없이 여는 화면과 로그인한 화면을 나눠 둔 것이고, proxy 는 폴더가 아니라
// 경로 목록(PUBLIC_PATHS)으로 판정한다 — (auth) 에 화면을 더하면 lib/login-return.ts 의 PUBLIC_PATHS 에도 더한다.
// overflow-x-clip — 탭 내용(.tab-panel-in)이 옆에서 미끄러져 들어오는 동안 화면이 옆으로 넓어지지 않게(clip 이라 sticky 는 그대로 된다. 화면 이동 슬라이드는 ::view-transition 덧층이라 상관없다)
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StaffRoot>
      <main className="flex min-h-[100dvh] w-full flex-col overflow-x-clip bg-staff-bg">
        <PageSlide>{children}</PageSlide>
      </main>
    </StaffRoot>
  );
}
