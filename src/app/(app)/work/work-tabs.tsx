"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SegmentedControl, segmentTabId } from "@/components/common";

export type WorkTab = "schedule" | "todo";

const PANEL_ID = "work-tab-panel";

// 근무정보 탭(근무스케줄 · TO-DO). 고른 탭은 주소 ?tab= 에 둔다 — 홈 바로가기(/work?tab=todo)와 새로 고침이 같은 탭을 연다.
// replace 라 탭을 오가도 뒤로 가기는 근무정보에 들르기 전 화면으로 간다. 탭 내용은 서버가 그린다(children).
export function WorkTabs({ tab, children }: { tab: WorkTab; children: ReactNode }) {
  const router = useRouter();
  return (
    <>
      <SegmentedControl
        label="보기"
        panelId={PANEL_ID}
        value={tab}
        onChange={(next) => router.replace(`/work?tab=${next}`, { scroll: false })}
        items={[
          { value: "schedule", label: "근무스케줄" },
          { value: "todo", label: "TO-DO" },
        ]}
      />
      <div id={PANEL_ID} role="tabpanel" aria-labelledby={segmentTabId(PANEL_ID, tab)} className="flex flex-col gap-[20px]">
        {children}
      </div>
    </>
  );
}
