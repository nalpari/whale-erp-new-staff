import { useEffect, useRef } from "react";

/**
 * 결과 화면이 붙을 때 제목에 초점을 옮긴다(`AuthScreen` 의 `titleRef` 에 넘긴다). 같은 화면에서 바뀌어 경로 알림이 없고,
 * 누른 버튼이 사라져 초점이 body 로 떨어진다. 이메일 찾기의 결과 화면 · 로그인 잠금 화면.
 */
export function useFocusedTitle() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}
