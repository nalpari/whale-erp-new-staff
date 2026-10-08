"use client";

import { useSyncExternalStore } from "react";

// 1초마다 바뀌는 지금 시각. 서버와 하이드레이션 때는 null 이라 시계를 비워 두고, 그 뒤부터 센다.
const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 1000);
  return () => clearInterval(timer);
};
// 초 단위로 내려 같은 초 안에서는 같은 값을 돌려준다(useSyncExternalStore 는 같은 값이어야 다시 그리지 않는다).
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const getServerSnapshot = () => null;

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 핀 입력 · 새 비밀번호가 함께 쓰는 남은 시간(한 시계). 안내용이고 판정은 api 가 한다. */
export function Countdown({ deadline }: { deadline: number }) {
  const now = useNow();
  const left = now === null ? null : Math.max(0, deadline - now);
  const text =
    left === null
      ? "--:--"
      : `${String(Math.floor(left / 60_000)).padStart(2, "0")}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, "0")}`;
  return (
    <span>
      남은 시간 <b className="text-staff-text tabular-nums">{text}</b>
    </span>
  );
}
