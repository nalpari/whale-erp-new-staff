"use client";

import { EASE_OUT } from "./theme";

type Item<T extends string> = { value: T; label: string };

// Figma TabBar: 연한 브랜드 바탕(radius 14, 안쪽 4, 사이 4) 안에서 고른 칸만 브랜드 바탕·흰 글자(radius 12, h44).
// 화면 안의 보기를 바꾸는 탭이라 tablist 로 둔다. 패널 쪽 role="tabpanel" 은 쓰는 화면이 붙인다.
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: Item<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex w-full gap-[4px] rounded-[14px] bg-staff-primary-inactive p-[4px]">
      {items.map((item) => {
        const on = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.value)}
            className={`h-[44px] flex-1 rounded-[12px] text-[14px] font-bold transition-[background-color,color,box-shadow] duration-200 ${EASE_OUT} ${
              on ? "bg-staff-primary text-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]" : "text-staff-text-sub"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
