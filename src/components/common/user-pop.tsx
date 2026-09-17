"use client";

import Image from "next/image";
import Link from "next/link";
import { Popup, useDropdown } from "./popup";
import { EASE_OUT } from "./theme";

// href: 페이지 이동, action: 서버 액션(로그아웃 등, 서버 컴포넌트에서도 넘길 수 있다), onSelect: 클라이언트 콜백.
export type UserPopItem = { label: string; danger?: boolean } & (
  | { href: string }
  | { action: (formData: FormData) => void | Promise<void> }
  | { onSelect: () => void }
);

// Figma Login_infos. 이름을 누르면 MY PAGE 메뉴가 페이드로 뜬다.
export function UserPop({ name, items }: { name: string; items: UserPopItem[] }) {
  const { open, setOpen, ref } = useDropdown();

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center">
        <span className="flex items-center gap-[4px] text-[15px] font-medium text-erp-ink">
          <span className="grid size-[24px] place-items-center">
            <Image src="/icons/user.svg" alt="" width={18} height={18} />
          </span>
          {name}
        </span>
        <Image
          src="/icons/user-more.svg"
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
          {items.map((item) => {
            const tone = item.danger ? "text-[#e93737]" : "text-erp-ink hover:text-erp-brand";
            return (
              <li key={item.label} role="none">
                {"href" in item ? (
                  <Link role="menuitem" href={item.href} onClick={() => setOpen(false)} className={tone}>
                    {item.label}
                  </Link>
                ) : "action" in item ? (
                  <form action={item.action}>
                    <button role="menuitem" type="submit" className={tone}>
                      {item.label}
                    </button>
                  </form>
                ) : (
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={tone}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Popup>
    </div>
  );
}
