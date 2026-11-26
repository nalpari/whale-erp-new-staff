"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { SegmentedControl, segmentTabId } from "@/components/common";

export type WorkTab = "schedule" | "todo";

const PANEL_ID = "work-tab-panel";

// 근무정보 탭(근무스케줄 · TO-DO). 고른 탭은 주소 ?tab= 에 둔다 — 홈 바로가기(/work?tab=todo)와 새로 고침이 같은 탭을 연다.
// replace 라 탭을 오가도 뒤로 가기는 근무정보에 들르기 전 화면으로 간다. 탭 내용은 서버가 그린다(children).
export function WorkTabs({ tab, children }: { tab: WorkTab; children: ReactNode }) {
  const router = useRouter();
  // 알림에서 왔으면 탭을 바꿔도 뒤로 가기(알림 목록)가 이어지게 from 을 남긴다
  const from = useSearchParams().get("from") === "notifications" ? "&from=notifications" : "";
  return (
    <>
      <SegmentedControl
        label="보기"
        panelId={PANEL_ID}
        value={tab}
        onChange={(next) => router.replace(`/work?tab=${next}${from}`, { scroll: false })}
        items={[
          { value: "schedule", label: "근무스케줄" },
          { value: "todo", label: "TO-DO" },
        ]}
      />
      {/* 탭이 바뀌면 key 로 새로 그려 새 내용이 살짝 떠오르며 나타난다(globals.css staff-panel-in, 2026-11-26 실기기 피드백) */}
      <div key={tab} id={PANEL_ID} role="tabpanel" aria-labelledby={segmentTabId(PANEL_ID, tab)} className="flex flex-1 flex-col gap-[12px] motion-safe:animate-[staff-panel-in_220ms_cubic-bezier(0.23,1,0.32,1)_both]">
        {children}
      </div>
    </>
  );
}
