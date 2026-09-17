"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from "react";
import { EASE_OUT } from "./theme";

// 열려 있는 동안 ref 바깥을 누르거나, 포커스가 바깥으로 나가거나, Esc 를 누르면 close 를 부른다.
// Esc 로 닫을 때 포커스가 안쪽에 있었다면 열려 있던 트리거(aria-expanded="true")로 되돌린다.
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  const onClose = useEffectEvent(close);

  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => !ref.current?.contains(e.target as Node);
    const onPointer = (e: PointerEvent) => {
      if (outside(e)) onClose();
    };
    const onFocus = (e: FocusEvent) => {
      if (outside(e)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const root = ref.current;
      if (root?.contains(document.activeElement)) {
        root.querySelector<HTMLElement>('[aria-expanded="true"]')?.focus();
      }
      onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return ref;
}

// 트리거 + Popup 한 쌍. id 는 트리거의 aria-controls 와 Popup 의 id 로 쓴다.
export function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const id = useId();
  return { open, setOpen, ref, id };
}

// 트리거 아래에 뜨는 팝업. 트리거와 함께 relative 부모 안에 둔다.
// 항상 마운트해 두고 전환으로 여닫아서, 연타해도 현재 상태에서 방향만 바뀐다.
// Figma 는 테두리를 안쪽에 그리므로 여백을 24 가 아닌 23 으로 두어 전체 크기를 맞춘다.
//  - fold: 위에서부터 펼쳐지고 아래에서부터 말려 올라간다. 아래 가장자리를 clip-path 로 움직인다.
//          동작 줄이기 설정이면 접힘과 이동을 빼고 투명도만 바꾼다.
//  - fade: 투명도만 바꾼다.
const MOTION = {
  fold: {
    base: "transition-[clip-path,visibility] motion-reduce:transition-[opacity,visibility] motion-reduce:[clip-path:none]",
    open: "visible duration-[260ms] [clip-path:inset(-8px_-8px_-8px_-8px)]",
    closed: "invisible duration-[180ms] motion-reduce:opacity-0 [clip-path:inset(-8px_-8px_100%_-8px)]",
    innerOpen: "translate-y-0 duration-[260ms]",
    innerClosed: "-translate-y-[6px] duration-[180ms]",
  },
  fade: {
    base: "transition-[opacity,visibility]",
    open: "visible opacity-100 duration-200",
    closed: "invisible opacity-0 duration-150",
    innerOpen: "",
    innerClosed: "",
  },
};

export function Popup({
  id,
  open,
  motion,
  tail,
  className = "",
  children,
}: {
  id?: string;
  open: boolean;
  motion: keyof typeof MOTION;
  /** 트리거를 가리키는 꼬리 */
  tail?: boolean;
  /** 위치(right-0 등)와 폭 */
  className?: string;
  children: ReactNode;
}) {
  const m = MOTION[motion];
  return (
    <div
      id={id}
      inert={!open}
      className={`absolute top-[calc(100%+8px)] z-20 rounded-[2px] border border-[#ebebeb] bg-white p-[23px] ${EASE_OUT} ${m.base} ${
        open ? m.open : m.closed
      } ${className}`}
    >
      {tail && (
        <span className="absolute -top-[5px] left-1/2 size-[8px] -translate-x-1/2 -rotate-45 rounded-tr-[1px] border-t border-r border-[#ebebeb] bg-white" />
      )}
      <div className={`transition-transform ${EASE_OUT} motion-reduce:transform-none ${open ? m.innerOpen : m.innerClosed}`}>
        {children}
      </div>
    </div>
  );
}
