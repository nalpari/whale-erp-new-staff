import type { ReactNode } from "react";
import { STAFF_THEME } from "./theme";

// 직원앱 화면의 최상위. 밝은 테마와 font-staff 를 이 안에만 걸고, 화면 높이를 채운다.
// 글꼴 자체는 여기서 불러오지 않는다 — 루트 layout 의 <html> 에 pretendard.variable(src/app/fonts.ts)이 붙어 있어야
// --font-staff 가 채워진다. 빠지면 조용히 시스템 글꼴로 떨어진다.
export function StaffRoot({ children }: { children: ReactNode }) {
  return <div className={`${STAFF_THEME} min-h-[100dvh]`}>{children}</div>;
}
