"use client";

import { useState } from "react";
import { SwitchRow } from "@/components/common";

// 목업 데이터(Figma 09.알림설정). 네 묶음 모두 직원이 켜고 끈다(쟁점 NOTI-8, 2026-10-20 재영).
const ITEMS = [
  { id: "contract", title: "근로계약서 발송", description: "근로계약서가 도착하면 알립니다" },
  { id: "schedule", title: "근무스케줄 변경", description: "근무 시간이나 근무일이 바뀌면 알립니다" },
  { id: "todo", title: "TO-DO 수행 임박", description: "수행 예정 일시가 다가오면 알립니다" },
  { id: "payslip", title: "급여명세서 발송", description: "급여명세서가 도착하면 알립니다" },
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
          onChange={(v) => setOn((o) => ({ ...o, [item.id]: v }))}
        />
      ))}
    </ul>
  );
}
