"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// 펼침 · 접힘 상자(2026-11-26 실기기 피드백 — 내 정보 주소 줄 · 출퇴근 현황 주 줄이 뚝 열리고 닫혔다).
// 높이를 0 ↔ 내용 높이로 움직이고 함께 흐려졌다 나타난다. 접힌 동안은 hidden 이라 화면 낭독기 · 탭 이동에서 빠지되, 안의 입력 값은 남는다.
// Web Animations 로 움직인다 — CSS 높이 transition 은 auto 로 못 가고, Safari · 웹뷰에서 새로 그린 칸에 걸리지 않았다(바텀시트와 같은 까닭).

const OPEN_MS = 240;
const CLOSE_MS = 180;
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

export function Collapse({ open, id, className, children }: { open: boolean; id?: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const running = useRef<Animation | null>(null);
  const mounted = useRef(false);
  // 화면에 그리는지 — 열 때는 바로 켜고, 닫을 때는 다 접힌 뒤에 끈다.
  const [visible, setVisible] = useState(open);
  if (open && !visible) setVisible(true);

  useLayoutEffect(() => {
    const el = ref.current;
    // 처음 그릴 때는 움직이지 않는다(열린 채로 오면 그대로).
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!el) return;
    // 닫힘이 끝나는 순간 다시 열면 직접 쓴 hidden 이 남아 있을 수 있다 — 열 때는 먼저 보이게 한다.
    if (open) el.hidden = false;
    // 움직이는 중이면 지금 높이에서 이어 간다.
    const from = running.current ? el.getBoundingClientRect().height : open ? 0 : el.scrollHeight;
    running.current?.cancel();
    running.current = null;
    const to = open ? el.scrollHeight : 0;
    const still = typeof el.animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // 움직이지 않을 때 · 실패했을 때 닫기는 바로 다음 차례에 감춘다(effect 안에서 곧장 상태를 바꾸지 않게)
    const hideSoon = () => queueMicrotask(() => setVisible(false));
    if (still) {
      if (!open) hideSoon();
      return;
    }
    try {
      const animation = el.animate(
        [
          { height: `${from}px`, opacity: open ? 0 : 1, overflow: "hidden" },
          { height: `${to}px`, opacity: open ? 1 : 0, overflow: "hidden" },
        ],
        { duration: open ? OPEN_MS : CLOSE_MS, easing: open ? EASE : "ease-in", fill: open ? "none" : "forwards" },
      );
      running.current = animation;
      animation.onfinish = () => {
        if (running.current !== animation) return;
        running.current = null;
        if (!open) {
          // 먼저 감추고 나서 붙잡아 둔 0 높이를 푼다 — 상태가 그려지기 전 한 장면 동안 다 펼친 채 번쩍이지 않게
          el.hidden = true;
          animation.cancel();
          setVisible(false);
        }
      };
    } catch (error) {
      // 움직이지 못해도 열림 · 닫힘은 맞춘다.
      console.error("[collapse] 펼침 애니메이션 실패", error);
      if (!open) hideSoon();
    }
  }, [open]);

  return (
    <div ref={ref} id={id} hidden={!visible} className={className}>
      {children}
    </div>
  );
}
