"use client";

import { useState } from "react";
import { SwitchRow } from "@/components/common";

// 목업 데이터(Figma 09.알림설정). 근로계약서·급여명세서는 꺼 둘 수 없는 알림이라 잠가 둔다.
const ITEMS = [
  { id: "contract", title: "근로계약서 발송", description: "항상 켜져 있습니다 · 계약 확인은 놓치면 안 됩니다", locked: true },
  { id: "schedule", title: "근무스케줄 주요 변경", description: "근무 시간이나 근무일이 바뀌면 알립니다" },
  { id: "todo", title: "TO-DO 배정", description: "근무시간 외에 배정되면 다음 근무일 아침까지 보류합니다" },
  { id: "payslip", title: "급여명세서 발송", description: "항상 켜져 있습니다 · 급여 확인은 놓치면 안 됩니다", locked: true },
];

export function SettingsList() {
  const [on, setOn] = useState<Record<string, boolean>>({ contract: true, schedule: true, todo: true, payslip: true });
  return (
    <ul className="divide-y divide-[#e8edf3]">
      {ITEMS.map((item) => (
        <SwitchRow
          key={item.id}
          title={item.title}
          description={item.description}
          checked={on[item.id]}
          locked={item.locked}
          onChange={(v) => setOn((o) => ({ ...o, [item.id]: v }))}
        />
      ))}
    </ul>
  );
}
