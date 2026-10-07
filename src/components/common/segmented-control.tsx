"use client";

import { EASE_OUT } from "./theme";

type Item<T extends string> = { value: T; label: string };

// Figma 05.출퇴근 현황 탭(node 12:1329): #EDF0F6 판(radius 10, 안쪽 3, 사이 6) 안에서
// 고른 칸만 남보라 바탕·흰 글자. 칸은 최소 44px · radius 10 · 13px bold, 고르지 않은 칸은 흐린 글자.
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
    <div role="tablist" aria-label={label} className="flex w-full gap-[6px] rounded-[10px] bg-[#edf0f6] p-[3px]">
      {items.map((item) => {
        const on = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.value)}
            className={`min-h-[44px] flex-1 rounded-[10px] px-[14px] text-[13px] leading-[1.5] font-bold transition-[background-color,color] duration-200 ${EASE_OUT} ${
              on ? "bg-staff-primary text-white" : "text-staff-text-muted"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
