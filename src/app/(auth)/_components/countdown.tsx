"use client";

import { useState, useSyncExternalStore } from "react";

// 1초마다 바뀌는 지금 시각. 서버와 하이드레이션 때는 null 이라 시계를 비워 두고, 그 뒤부터 센다.
const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 1000);
  return () => clearInterval(timer);
};
// 초 단위로 내려 같은 초 안에서는 같은 값을 돌려준다(useSyncExternalStore 는 같은 값이어야 다시 그리지 않는다).
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const getServerSnapshot = () => null;

/**
 * 서버 시계로 옮긴 지금 시각. 발급 시각(issuedAt)은 서버 시계라 휴대폰 시계와 바로 비교하면, 휴대폰 시계가 틀린 만큼
 * 만료 · 다시 받기 판정이 어긋난다(10분 넘게 앞서면 핀을 받자마자 만료로 보인다). 화면을 그린 순간의 서버 시각
 * `serverNow` 와 휴대폰 시각의 차이를 처음 한 번 재 두고 그만큼 옮긴다. 오차는 서버가 그린 때부터
 * 화면이 하이드레이션될 때까지의 시간이고, 남은 시간이 그만큼 길게 보인다(안내용이라 판정은 api 가 한다).
 */
export function useNow(serverNow: number): number | null {
  const [offset] = useState(() => serverNow - Date.now());
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return now === null ? null : now + offset;
}

/** 남은 시간(핀 입력 · 새 비밀번호의 한 시계, 이메일 찾기 막힘). 안내용이고 판정은 api 가 한다. */
export function Countdown({ deadline, serverNow }: { deadline: number; serverNow: number }) {
  const now = useNow(serverNow);
  const text = now === null ? "--:--" : formatLeft(deadline - now);
  return (
    <span>
      남은 시간 <b className="text-staff-text tabular-nums">{text}</b>
    </span>
  );
}

/** 남은 시간을 mm:ss 로. 지났으면 00:00. */
export function formatLeft(ms: number): string {
  const left = Math.max(0, ms);
  return `${String(Math.floor(left / 60_000)).padStart(2, "0")}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, "0")}`;
}
