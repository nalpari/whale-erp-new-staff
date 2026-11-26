"use client";

import { useRef, type TouchEvent } from "react";
import { swipeStep } from "@/lib/attendance-history";

// 달력 두 곳(조회 기간 시트 · 근무스케줄 탭)이 같이 쓰는 달 넘기기 — 좌우로 밀기와, 달이 바뀔 때 새 달이 미끄러져 들어오는 움직임
// (2026-11-26 실기기 피드백 — 달이 넘어가도 움직임이 없어 바뀐 줄 몰랐고, 근무스케줄 달력은 밀어서 넘길 수 없었다).

/** 새 달이 들어오는 거리(px) · 시간(ms). 다음 달이면 오른쪽에서, 이전 달이면 왼쪽에서 들어온다. */
const SLIDE_PX = 28;
const SLIDE_MS = 240;

/**
 * 달이 [step] 만큼 넘어간 직후 [el](새 달 칸)을 그쪽에서 밀어 넣는다. step 이 0 이거나 「동작 줄이기」면 그대로 둔다.
 * Web Animations 로 움직인다 — CSS transition 은 Safari · 웹뷰에서 새로 그린 칸에 걸리지 않았다(바텀시트와 같은 까닭).
 */
export function slideMonthIn(el: HTMLElement | null, step: number) {
  if (!el || step === 0 || typeof el.animate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    el.animate(
      [
        { transform: `translateX(${Math.sign(step) * SLIDE_PX}px)`, opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: SLIDE_MS, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  } catch (error) {
    // 움직이지 못해도 새 달은 그려져 있다.
    console.error("[month-swipe] 달 넘김 애니메이션 실패", error);
  }
}

/**
 * 달력 칸에 붙일 터치 처리. 왼쪽으로 밀면 다음 달(+1), 오른쪽이면 이전 달(-1)로 [onStep] 을 부른다.
 * 가로 움직임이 짧거나 세로가 가로와 같거나 더 크면(화면 스크롤) 넘기지 않는다(`swipeStep`). 붙이는 칸에는 `touch-pan-y touch-pinch-zoom` 을 함께 준다.
 */
export function useMonthSwipe(onStep: (step: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      const t = e.changedTouches[0];
      start.current = null;
      if (!s || !t) return;
      const step = swipeStep(t.clientX - s.x, t.clientY - s.y);
      if (step !== 0) onStep(step);
    },
    onTouchCancel: () => {
      start.current = null;
    },
  };
}
