"use client";

import { addTransitionType, startTransition, useEffect, useState, useSyncExternalStore } from "react";

export type DemoState = { id: string; label: string; note?: string };
export type DemoDirection = "nav-forward" | "nav-back";

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));

// 한 화면 안의 상태(목업의 data-when). 주소 끝 #상태 와 같이 움직여, 다른 화면에서 /demo/login#locked 로 바로 들어오고
// 브라우저 뒤로 가기가 앞 상태로 돌아간다. 모르는 값이면 첫 상태다.
// go(id, 방향) 은 상태를 startTransition 안에서 먼저 바꿔 PageSlide 가 방향 슬라이드를 하게 하고, 그린 뒤 주소를 맞춘다.
// hashchange 로 바뀐 값은 트랜지션 밖이라 슬라이드 없이 따라간다(뒤로 가기·주소 직접 입력).
export function useDemoState(states: readonly DemoState[]) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const fromHash = states.some((s) => s.id === hash) ? hash : states[0].id;
  const [moved, setMoved] = useState<string | null>(null);
  const [seen, setSeen] = useState(fromHash);
  if (seen !== fromHash) {
    setSeen(fromHash);
    setMoved(null);
  }
  useEffect(() => {
    if (moved && moved !== fromHash) window.location.hash = moved;
  }, [moved, fromHash]);

  const go = (id: string, direction: DemoDirection = "nav-forward") => {
    startTransition(() => {
      addTransitionType(direction);
      setMoved(id);
    });
    window.scrollTo(0, 0);
  };
  return [moved ?? fromHash, go] as const;
}
