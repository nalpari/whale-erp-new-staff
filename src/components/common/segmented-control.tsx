"use client";

import { useState } from "react";
import { EASE_OUT } from "./theme";

type Item<T extends string> = { value: T; label: string };

// 탭 칸의 id. 탭 내용 쪽 aria-labelledby 에 쓴다.
export const segmentTabId = (panelId: string, value: string) => `${panelId}-tab-${value}`;

// Figma 05.출퇴근 현황 탭(node 12:1329): #EDF0F6 판(radius 10, 안쪽 3, 사이 6) 안에서
// 고른 칸만 남보라 바탕·흰 글자. 칸은 최소 44px · radius 10 · 13px bold, 고르지 않은 칸은 흐린 글자.
// 칸을 바꾸면 바탕과 글자색이 제자리에서 흐려지며 바뀐다(200ms, 누르자마자). 탭 내용은 쓰는 화면이 key 와 .tab-panel-in 으로
// 화면 이동처럼 고른 쪽에서 미끄러져 들어오게 한다(2026-11-26 사용자 지정 — 바탕이 미끄러지는 것은 빼고 색 바뀜만).
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
  // 누르자마자 고른 칸 색을 바꾼다 — 탭 내용을 서버에서 받는 화면(근무 · 출퇴근 현황)은 받을 때까지 칸이 안 바뀌어 딱딱했다(2026-11-26 실기기 피드백).
  // 받은 값(value)이 바뀌면 그 값을 따른다.
  const [shown, setShown] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setShown(value);
  }
  return (
    <div role={panelId ? "tablist" : "group"} aria-label={label} className="flex w-full gap-[6px] rounded-[10px] bg-[#edf0f6] p-[3px]">
      {items.map((item, i) => {
        const on = item.value === shown;
        return (
          <button
            key={item.value}
            type="button"
            {...(panelId
              ? { role: "tab", id: segmentTabId(panelId, item.value), "aria-selected": on, "aria-controls": on ? panelId : undefined }
              : { "aria-pressed": on })}
            onClick={() => {
              if (item.value === shown) return;
              // 탭 내용이 어느 쪽에서 들어올지 — 오른쪽 칸이면 오른쪽에서, 왼쪽 칸이면 왼쪽에서(globals.css .tab-panel-in)
              const from = items.findIndex((it) => it.value === shown);
              document.documentElement.dataset.tabDir = i > from ? "next" : "prev";
              setShown(item.value);
              onChange(item.value);
            }}
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
