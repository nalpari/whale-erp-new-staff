import { ViewTransition, type ReactNode } from "react";

// 목업 화면 사이를 옮길 때 방향 있는 슬라이드. 링크에 transitionTypes 로 방향을 붙인다:
//   더 깊은 화면으로 — ["nav-forward"] (새 화면이 오른쪽에서)
//   돌아가기 — ["nav-back"] (새 화면이 왼쪽에서)
// 방향이 없는 이동(브라우저 뒤로 가기, 새로 고침)은 움직이지 않는다. 애니메이션은 globals.css 의 .nav-forward·.nav-back.
// 레이아웃은 화면이 바뀌어도 남아 있어 enter·exit 이 안 생기므로, 화면(page.tsx)마다 이것으로 감싼다.
const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

export function PageSlide({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      {children}
    </ViewTransition>
  );
}
