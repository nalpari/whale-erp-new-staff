"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

// /design 샘플에서 클릭 상태가 필요한 유닛. 나머지 유닛은 units.tsx 의 서버 컴포넌트다.

const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

// 트리거 아래에 뜨는 팝업. 항상 마운트해 두고 전환으로 여닫아서, 연타해도 현재 상태에서 방향만 바뀐다.
//  - fold: 위에서부터 펼쳐지고 아래에서부터 말려 올라간다. 아래 가장자리를 clip-path 로 움직인다.
//          동작 줄이기 설정이면 접힘과 이동을 빼고 투명도만 바꾼다.
//  - fade: 투명도만 바꾼다.
const POPUP_MOTION = {
  fold: {
    base: `transition-[clip-path,visibility] motion-reduce:transition-[opacity,visibility] motion-reduce:[clip-path:none]`,
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

function Popup({
  open,
  motion,
  tail,
  className,
  children,
}: {
  open: boolean;
  motion: keyof typeof POPUP_MOTION;
  /** 트리거를 가리키는 꼬리 */
  tail?: boolean;
  className: string;
  children: ReactNode;
}) {
  const m = POPUP_MOTION[motion];
  return (
    <div
      inert={!open}
      className={`absolute top-[calc(100%+8px)] z-20 rounded-[2px] border border-[#ebebeb] bg-white p-[24px] ${EASE_OUT} ${m.base} ${
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

const STORES = [
  "힘이나는커피생활 종로점 BP1234",
  "(상담중) 동해에서잡아온- BIM1234",
  "(운영) 동해물과 – BIM1111",
  "(종료) 동해횟집 – BIM0012",
];

export function StoreSelect() {
  const { open, setOpen, ref } = useDropdown();
  const [store, setStore] = useState(STORES[0]);

  return (
    <div ref={ref} className="relative w-[260px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-[34px] w-full text-left"
      >
        <span className="flex flex-1 items-center truncate rounded-l-[2px] border-y border-l border-erp-field-line bg-white pl-[10px] text-[14px] text-erp-ink">
          {store}
        </span>
        <span className="grid w-[34px] place-items-center rounded-r-[2px] border-y border-r border-erp-field-line bg-white">
          <Image
            src="/design/chevron-small.svg"
            alt=""
            width={5}
            height={8}
            className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-90" : "-rotate-90"}`}
          />
        </span>
      </button>
      <Popup open={open} motion="fold" className="right-0 w-[260px]">
        <ul role="listbox" aria-label="점포" className="text-[14px] leading-[2] text-erp-ink">
          {STORES.slice(1).map((s) => (
            <li key={s} role="option" aria-selected={s === store}>
              <button
                type="button"
                onClick={() => {
                  setStore(s);
                  setOpen(false);
                }}
                className="w-full truncate text-left hover:text-erp-brand"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      </Popup>
    </div>
  );
}

export function LoginInfo() {
  const { open, setOpen, ref } = useDropdown();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex items-center"
      >
        <span className="flex items-center gap-[4px] text-[15px] font-medium text-erp-ink">
          <span className="grid size-[24px] place-items-center">
            <Image src="/design/user.svg" alt="" width={18} height={18} />
          </span>
          김지영 (admin)
        </span>
        <Image
          src="/design/user-more.svg"
          alt=""
          width={34}
          height={34}
          className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-180" : ""}`}
        />
      </button>
      <Popup open={open} motion="fade" tail className="right-0 w-[154px]">
        <p className="text-[15px] leading-[2] font-medium text-[#111]">MY PAGE</p>
        <hr className="mt-[12px] mb-[18px] border-erp-button-line" />
        <ul role="menu" className="text-[14px] leading-[2]">
          <li role="none">
            <a role="menuitem" href="#" className="text-erp-ink hover:text-erp-brand">
              내정보 관리
            </a>
          </li>
          <li role="none">
            <a role="menuitem" href="#" className="text-erp-ink hover:text-erp-brand">
              비밀번호 변경
            </a>
          </li>
          <li role="none">
            <button role="menuitem" type="button" className="text-[#e93737]">
              로그아웃
            </button>
          </li>
        </ul>
      </Popup>
    </div>
  );
}

const PANEL_BUTTON = "grid h-[32px] place-items-center rounded-[2px] border border-erp-button-line bg-white px-[12px]";

// 필터 패널 폭을 226 ↔ 76 으로 바꾼다. 옆 테이블이 따라 늘어나야 해서 폭 자체를 전환한다.
// 안쪽 내용은 폭을 188 로 고정해 두고 잘라내므로, 줄어드는 동안 줄바꿈이 일어나지 않는다.
export function FilterShell({ header, children, className = "" }: { header: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`relative overflow-hidden rounded-[4px] border border-erp-panel-line bg-white transition-[width] duration-250 ${EASE_OUT} motion-reduce:transition-none ${
        open ? "w-[226px]" : "w-[76px]"
      } ${className}`}
    >
      <div
        inert={!open}
        className={`flex w-[224px] flex-col gap-[18px] px-[18px] pt-[18px] pb-[24px] transition-opacity ${
          open ? "opacity-100 duration-200" : "opacity-0 duration-100"
        }`}
      >
        <div className="flex items-center gap-[6px] border-b border-erp-divider pb-[18px]">
          {header}
          <button type="button" aria-label="필터 접기" aria-expanded onClick={() => setOpen(false)} className={PANEL_BUTTON}>
            <Image src="/design/collapse.svg" alt="" width={12} height={18} />
          </button>
        </div>
        {children}
      </div>
      <button
        type="button"
        aria-label="필터 펼치기"
        aria-expanded={false}
        inert={open}
        onClick={() => setOpen(true)}
        className={`absolute top-[18px] left-[18px] transition-opacity ${PANEL_BUTTON} ${
          open ? "opacity-0 duration-100" : "opacity-100 delay-100 duration-200"
        }`}
      >
        <Image src="/design/expand.svg" alt="" width={12} height={18} />
      </button>
    </aside>
  );
}
