"use client";

import { EASE_OUT } from "./theme";

type Item<T extends string> = { value: T; label: string };

// 탭 칸의 id. 탭 내용 쪽 aria-labelledby 에 쓴다.
export const segmentTabId = (panelId: string, value: string) => `${panelId}-tab-${value}`;

// Figma 05.출퇴근 현황 탭(node 12:1329): #EDF0F6 판(radius 10, 안쪽 3, 사이 6) 안에서
// 고른 칸만 남보라 바탕·흰 글자. 칸은 최소 44px · radius 10 · 13px bold, 고르지 않은 칸은 흐린 글자.
// 칸을 바꾸면 바탕과 글자색이 제자리에서 흐려지며 바뀐다(200ms). 탭 내용의 움직임은 쓰는 화면이 정한다.
// panelId 를 주면 아래 내용을 바꾸는 탭(tablist)이 된다 — 내용 쪽에 id={panelId} · role="tabpanel" ·
// aria-labelledby={segmentTabId(panelId, value)} 를 붙인다. panelId 가 없으면 값만 고르는 눌림 버튼 묶음이다.
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  label,
  panelId,
}: {
  items: Item<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  panelId?: string;
}) {
  return (
    <div role={panelId ? "tablist" : "group"} aria-label={label} className="flex w-full gap-[6px] rounded-[10px] bg-[#edf0f6] p-[3px]">
      {items.map((item) => {
        const on = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            {...(panelId
              ? { role: "tab", id: segmentTabId(panelId, item.value), "aria-selected": on, "aria-controls": on ? panelId : undefined }
              : { "aria-pressed": on })}
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
