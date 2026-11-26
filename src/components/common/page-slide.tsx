"use client";

import { usePathname } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";

// 화면 사이를 옮길 때의 움직임(2026-11-26 실기기 피드백 — 화면 전환이 딱딱했다). 목업(design/(mockup)/page-slide.tsx)에서 정한 것을 실제 화면에 건다.
//   링크에 transitionTypes 로 방향을 붙인 이동 — 더 깊이 ["nav-forward"](새 화면이 오른쪽에서), 돌아가기 ["nav-back"](왼쪽에서)
//   방향이 없는 이동(router.push · 브라우저 · 앱의 뒤로 가기) — 짧게 겹쳐 흐려지며 바뀐다(page-fade)
// 애니메이션은 globals.css. 레이아웃은 화면이 바뀌어도 남아 enter · exit 이 생기지 않으므로 경로(pathname)를 key 로 줘 화면마다 새로 잡는다.
// 같은 화면 안의 주소 값만 바뀌는 이동(?tab= · ?month=)과 router.refresh 는 경로가 같아 움직이지 않는다.
const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-fade" };

export function PageSlide({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter={SLIDE} exit={SLIDE} default="none">
      {children}
    </ViewTransition>
  );
}
