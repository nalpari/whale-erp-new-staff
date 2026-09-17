"use client";

import Image from "next/image";
import { useState } from "react";
import { Popup, useDropdown } from "./popup";
import { EASE_OUT } from "./theme";

// Figma Select_top. 헤더 오른쪽의 점포 선택. 목록은 위에서부터 펼쳐진다.
// 선택된 점포는 목록에서 빠진다(Figma 기준).
export function StoreSelect({
  options,
  value: controlled,
  defaultValue = options[0],
  onChange,
  label = "점포",
}: {
  options: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
}) {
  const { open, setOpen, ref } = useDropdown();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;

  return (
    <div ref={ref} className="relative w-[260px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        onClick={() => setOpen(!open)}
        className="flex h-[34px] w-full text-left"
      >
        <span className="flex flex-1 items-center truncate rounded-l-[2px] border-y border-l border-erp-field-line bg-white pl-[10px] text-[14px] text-erp-ink">
          {value}
        </span>
        <span className="grid w-[34px] place-items-center rounded-r-[2px] border-y border-r border-erp-field-line bg-white">
          <Image
            src="/icons/chevron-small.svg"
            alt=""
            width={5}
            height={8}
            className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-90" : "-rotate-90"}`}
          />
        </span>
      </button>
      <Popup open={open} motion="fold" className="right-0 w-[260px]">
        {/* 항목이 버튼이라 ul 에 trim 을 걸면 안쪽까지 닿지 않는다. 첫 항목 위, 마지막 항목 아래만 잘라 Figma 높이를 맞춘다.
            잘린 기준선 아래 획이 가려지지 않도록 truncate 대신 줄바꿈만 막는다. */}
        <ul
          role="listbox"
          aria-label={label}
          className="text-[14px] leading-[2] text-erp-ink [text-box-edge:cap_alphabetic] [&>li:first-child>button]:[text-box-trim:trim-start] [&>li:last-child>button]:[text-box-trim:trim-end]"
        >
          {options
            .filter((o) => o !== value)
            .map((o) => (
              <li key={o} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    setInner(o);
                    onChange?.(o);
                    setOpen(false);
                  }}
                  className="block w-full text-left whitespace-nowrap hover:text-erp-brand"
                >
                  {o}
                </button>
              </li>
            ))}
        </ul>
      </Popup>
    </div>
  );
}
