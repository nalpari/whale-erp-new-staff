"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { EASE_OUT } from "./theme";

// 체크박스(데모 ui.mjs 의 checkBox 를 올린 것). TO-DO 체크칸과 같은 모양 — 28px · radius 2 · 꺼짐 옅은 남보라 · 켜짐 남보라에
// 흰 체크. 글자(14px 보조 글자)까지 눌리고 누르는 칸은 최소 44px 다. 진짜 <input type="checkbox"> 라 키보드 · 화면 낭독기가
// 그대로 다룬다. checked 는 쓰는 쪽이 상태로 든다.
// React 19 폼 액션은 제출 뒤 form.reset() 을 불러 체크 박스의 실제 체크를 처음 값으로 되돌리는데, 상태로 든 checked 는 다시
// 맞춰 주지 않는다(텍스트 칸과 다르다). 그래서 폼에는 숨은 칸(켜졌을 때만 name 이 "on" 으로 실림)으로 싣고, 초기화 뒤 실제 체크도 상태로 되돌린다.
export function CheckBox({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(checked);
  useEffect(() => {
    latest.current = checked;
  }, [checked]);
  // 폼이 초기화되면 실제 체크를 상태로 되돌린다(화면 낭독기가 읽는 값). reset 이벤트는 초기화하기 전에 오므로 그 뒤에 맞춘다.
  useEffect(() => {
    const element = input.current;
    const form = element?.form;
    if (!element || !form) return;
    const restore = () => queueMicrotask(() => (element.checked = latest.current));
    form.addEventListener("reset", restore);
    return () => form.removeEventListener("reset", restore);
  }, []);
  return (
    <label className="flex min-h-[44px] items-center gap-[10px] text-[14px] leading-[1.5] text-staff-text-sub">
      <input ref={input} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      {checked && <input type="hidden" name={name} value="on" />}
      <span
        aria-hidden
        className={`flex size-[28px] shrink-0 items-center justify-center rounded-[2px] transition-colors duration-150 ${EASE_OUT} peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-staff-primary ${
          checked ? "bg-staff-primary" : "bg-staff-primary-inactive"
        }`}
      >
        <Image src={checked ? "/icons/todo-check-on.svg" : "/icons/todo-check-off.svg"} alt="" width={12} height={9} />
      </span>
      {children}
    </label>
  );
}
