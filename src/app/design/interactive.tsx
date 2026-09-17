"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { FIELD } from "./field";

// /design 샘플에서 클릭 상태가 필요한 유닛. 나머지 유닛은 units.tsx 의 서버 컴포넌트다.

const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";

// 열려 있는 동안 바깥을 누르거나 Esc 를 누르면 close 를 부른다.
function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return ref;
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return { open, setOpen, ref };
}

// 트리거 아래에 뜨는 팝업. 항상 마운트해 두고 전환으로 여닫아서, 연타해도 현재 상태에서 방향만 바뀐다.
// Figma 는 테두리를 안쪽에 그리므로 여백을 24 가 아닌 23 으로 두어 전체 크기를 맞춘다.
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
        {/* 항목이 버튼이라 ul 에 trim 을 걸면 안쪽까지 닿지 않는다. 첫 항목 위, 마지막 항목 아래만 잘라 Figma 높이(114)를 맞춘다. */}
        <ul
          role="listbox"
          aria-label="점포"
          className="text-[14px] leading-[2] text-erp-ink [text-box-edge:cap_alphabetic] [&>li:first-child>button]:[text-box-trim:trim-start] [&>li:last-child>button]:[text-box-trim:trim-end]"
        >
          {STORES.slice(1).map((s) => (
            <li key={s} role="option" aria-selected={s === store}>
              <button
                type="button"
                onClick={() => {
                  setStore(s);
                  setOpen(false);
                }}
                className="block w-full text-left whitespace-nowrap hover:text-erp-brand"
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
        <p className="text-[15px] leading-[2] font-medium text-[#111] [text-box:trim-both_cap_alphabetic]">MY PAGE</p>
        <hr className="mt-[12px] mb-[18px] border-erp-button-line" />
        <ul role="menu" className="text-[14px] leading-[2] [text-box:trim-both_cap_alphabetic]">
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

// 1depth 메뉴와, 그 아래 펼쳐지는 2depth 줄. Figma Top 의 Property 1=ON.
// 1depth 를 누르면 열리고, 같은 메뉴를 다시 누르거나 헤더 바깥을 누르거나 Esc 로 닫힌다.
const MENUS: Record<string, string[]> = {
  기초정보관리: ["상품 정보 관리", "가격 정보 관리", "카테고리 정보 관리", "자재 정보 관리"],
  점포관리: ["점포 정보 관리", "계약서 템플릿 관리", "계약서 관리", "시설물 및 장비 관리", "점검표 템플릿 관리", "점검 결과 관리"],
  직원관리: ["직원 정보 관리", "근로계약 관리", "급여명세서 관리", "근무 스케줄 관리", "출·퇴근 현황 조회", "TO-DO List 관리"],
  매출조회: ["매출 조회", "매출 통계", "매출 분석"],
  재무관리: ["입·출금 관리", "매출/매입 거래 등록", "계정별 현황 조회"],
  환경설정: ["관리자 관리", "권한 관리", "공통코드 관리", "휴일 관리"],
  고객지원: ["부가서비스 구독 관리", "구독료 청구 및 납부 현황", "결제수단 관리", "정산 현황 조회", "공지사항", "문의하기"],
};

export function GlobalHeader() {
  // 어떤 메뉴를 보여줄지와 열려 있는지를 따로 둔다. 닫히는 동안에도 마지막 메뉴의 항목이 남아 있어야
  // 줄이 접히면서 빈 줄로 바뀌지 않는다.
  const [menu, setMenu] = useState("점포관리");
  const [open, setOpen] = useState(false);
  // 화면에 그려진 2depth. 열린 채 다른 메뉴로 바꾸면 이것이 먼저 흐려지고(120ms),
  // 다 흐려진 뒤 새 메뉴로 바뀌어 다시 나타난다(180ms). 연달아 바꿔도 마지막 메뉴로 수렴한다.
  const [shown, setShown] = useState(menu);
  const ref = useDismiss<HTMLElement>(open, () => setOpen(false));
  const toggle = (next: string) => {
    if (!open) setShown(next);
    setOpen(!(open && menu === next));
    setMenu(next);
  };

  return (
    <header ref={ref} className="bg-white">
      <div className="flex h-[71px] items-center gap-[54px] border-b border-erp-bar-line px-[24px]">
        <div className="flex w-[177px] shrink-0 items-center gap-[10px]">
          <Image src="/design/logo-whale.svg" alt="" width={53} height={40} />
          <p className="leading-[1.3] text-[#252525]">
            <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
            <span className="block text-[12px]">Management System</span>
          </p>
        </div>
        <nav className="flex flex-1 items-center gap-[44px] pl-[150px]">
          {Object.keys(MENUS).map((label, i) => (
            <button
              key={label}
              type="button"
              aria-expanded={open && menu === label}
              onClick={() => toggle(label)}
              className={`flex h-[52px] shrink-0 items-center text-[16px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand ${
                i === 0 ? "pr-[20px]" : "px-[20px]"
              } ${open && menu === label ? "text-erp-brand" : "text-erp-ink"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-[15px]">
          <StoreSelect />
          <LoginInfo />
        </div>
      </div>
      {/* 1depth 첫 메뉴 글자 시작점(404px)에 맞춘 2depth 줄. 높이 41 = 위아래 12 + 글자 16 + 테두리 1.
          자주 여닫는 메뉴라 200ms 로 짧게 펼친다. 줄 높이가 본문을 밀어내야 해서 grid 행 높이를 전환한다. */}
      <div
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-200 ${EASE_OUT} motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && shown !== menu) setShown(menu);
            }}
            className={`flex gap-[24px] border-b border-erp-bar-line py-[12px] pl-[404px] text-[13.5px] leading-[16px] text-erp-ink transition-opacity ease-out ${
              shown === menu ? "opacity-100 duration-[180ms]" : "opacity-0 duration-[120ms]"
            }`}
          >
            {MENUS[shown].map((item) => (
              <li key={item}>
                <a href="#" className="whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

// 검색 입력칸. 브라우저 기본 지우기(X) 버튼을 숨기고, 값이 있을 때만 같은 선 굵기(1.5)의 X 를 보여 준다.
// Figma 에 지우기 아이콘이 없어 기존 아이콘(1.5 선, #3C4046 계열)에 맞춰 그렸다.
export function SearchField({ defaultValue, ...props }: Omit<ComponentProps<"input">, "value" | "onChange" | "type">) {
  const [value, setValue] = useState(String(defaultValue ?? ""));
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <input
        {...props}
        ref={input}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${FIELD} pr-[52px] [&::-webkit-search-cancel-button]:appearance-none`}
      />
      <button
        type="button"
        aria-label="입력 지우기"
        tabIndex={value ? 0 : -1}
        onClick={() => {
          setValue("");
          input.current?.focus();
        }}
        className={`group absolute top-1/2 right-[32px] grid size-[18px] -translate-y-1/2 place-items-center rounded-full bg-erp-subtle transition-[opacity,background-color] duration-150 ease-out hover:bg-erp-field-line ${
          value ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg viewBox="0 0 8 8" className="size-[8px] stroke-erp-label transition-colors duration-150 ease-out group-hover:stroke-erp-ink" aria-hidden>
          <path d="M1 1l6 6M7 1L1 7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>
      <button type="button" aria-label="검색" className="absolute top-0 right-0 grid size-[34px] place-items-center">
        <Image src="/design/search.svg" alt="" width={12} height={12} />
      </button>
    </div>
  );
}
