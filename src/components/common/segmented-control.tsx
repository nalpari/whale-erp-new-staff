"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { EASE_OUT } from "./theme";

type Item<T extends string> = { value: T; label: string };

// 탭 칸의 id. 탭 내용 쪽 aria-labelledby 에 쓴다.
export const segmentTabId = (panelId: string, value: string) => `${panelId}-tab-${value}`;

// Figma 05.출퇴근 현황 탭(node 12:1329): #EDF0F6 판(radius 10, 안쪽 3, 사이 6) 안에서
// 고른 칸만 남보라 바탕·흰 글자. 칸은 최소 44px · radius 10 · 13px bold, 고르지 않은 칸은 흐린 글자.
// 칸을 바꾸면 남보라 바탕이 옆 칸으로 미끄러져 가고(250ms) 글자색이 바뀐다. 탭 내용은 쓰는 화면이 key 와 staff-panel-in 으로 떠오르게 한다.
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
  // 누르자마자 고른 칸을 옮긴다 — 탭 내용을 서버에서 받는 화면(근무 · 출퇴근 현황)은 받을 때까지 칸이 안 바뀌어 딱딱했다(2026-11-26 실기기 피드백).
  // 받은 값(value)이 바뀌면 그 값을 따른다.
  const [shown, setShown] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setShown(value);
  }
  const index = Math.max(0, items.findIndex((item) => item.value === shown));
  const n = items.length;
  // 바탕 자리는 고른 칸의 실제 위치 · 폭으로 맞춘다 — 근무지 이름처럼 글자가 길면 칸 폭이 서로 달라진다.
  // 재기 전(서버 렌더 · 첫 그림)에는 칸 폭이 같다고 보고 계산한다.
  const group = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const button = group.current?.querySelectorAll<HTMLElement>("button")[index];
      if (button) setBox((b) => (b && b.left === button.offsetLeft && b.width === button.offsetWidth ? b : { left: button.offsetLeft, width: button.offsetWidth }));
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    if (group.current) observer?.observe(group.current);
    return () => observer?.disconnect();
  }, [index, n]);
  return (
    <div ref={group} role={panelId ? "tablist" : "group"} aria-label={label} className="relative flex w-full gap-[6px] rounded-[10px] bg-[#edf0f6] p-[3px]">
      {/* 고른 칸 바탕 — 칸마다 바탕을 껐다 켜지 않고 하나가 미끄러져 옮겨 간다(칸 폭 + 사이 6px 씩) */}
      <span
        aria-hidden
        className={`absolute top-[3px] bottom-[3px] left-0 rounded-[10px] bg-staff-primary transition-[transform,width] duration-250 ${EASE_OUT} motion-reduce:transition-none`}
        style={
          box
            ? { width: box.width, transform: `translateX(${box.left}px)` }
            : { width: `calc((100% - ${6 + 6 * (n - 1)}px) / ${n})`, transform: `translateX(calc(3px + ${index} * (100% + 6px)))` }
        }
      />
      {items.map((item) => {
        const on = item.value === shown;
        return (
          <button
            key={item.value}
            type="button"
            {...(panelId
              ? { role: "tab", id: segmentTabId(panelId, item.value), "aria-selected": on, "aria-controls": on ? panelId : undefined }
              : { "aria-pressed": on })}
            onClick={() => {
              setShown(item.value);
              onChange(item.value);
            }}
            className={`relative min-h-[44px] flex-1 rounded-[10px] px-[14px] text-[13px] leading-[1.5] font-bold transition-colors duration-200 ${EASE_OUT} ${
              on ? "text-white" : "text-staff-text-muted"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
