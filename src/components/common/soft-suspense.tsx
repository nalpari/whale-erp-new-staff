import { Suspense, ViewTransition, type ReactNode } from "react";

/**
 * 받는 동안 자리(스켈레톤)에서 받은 내용으로 부드럽게 바뀌는 Suspense(2026-11-26 실기기 피드백 — 홈으로 돌아올 때 깜빡였다).
 * 스켈레톤은 흐려지며 빠지고(soft-out) 내용은 흐려진 채 나타난다(soft-in) — 전에는 스켈레톤이 뚝 사라지고 카드가 뚝 나타나거나,
 * 자리 없이 늦게 온 묶음이 갑자기 끼어들어 깜빡여 보였다. 애니메이션은 globals.css. View Transitions 를 못 쓰는 브라우저에서는 전처럼 바로 바뀐다.
 */
export function SoftSuspense({ fallback, children }: { fallback?: ReactNode; children: ReactNode }) {
  return (
    <Suspense fallback={fallback === undefined ? undefined : <ViewTransition exit="soft-out">{fallback}</ViewTransition>}>
      <ViewTransition enter="soft-in" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}
