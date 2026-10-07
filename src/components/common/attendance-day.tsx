import Image from "next/image";
import type { ComponentProps } from "react";
import { StatusChip, type StatusChipTone } from "./status-chip";
import { WorkTimeBar } from "./work-time-bar";

// Figma 05.출퇴근 현황 하루 카드(node 12:1355). radius 18 · 위 20 좌우 20 아래 32 · 사이 3.
//   done — 흰 바탕 · 기본 글자
//   today — 연한 남보라(#EEF2FF · #DCE4FF 테두리) · 글자 남보라
//   upcoming — #F9FBFD 바탕 · 보조 글자 · 상태 칩 없음
// 윗줄: 요일·날짜 13px bold, 점포 12px, 수정된 기록이면 연필(edited), 상태 칩. 아래에 근무 막대와 한 줄 요약.
const CARD = {
  done: "border-staff-border-light bg-white text-staff-text",
  today: "border-[#dce4ff] bg-[#eef2ff] text-staff-primary",
  upcoming: "border-staff-border-light bg-[#f9fbfd] text-staff-text-sub",
};

export type AttendanceDayStatus = { label: string; tone: StatusChipTone };

export function AttendanceDayCard({
  state,
  day,
  store,
  status,
  edited = false,
  summary,
  ...bar
}: {
  state: keyof typeof CARD;
  day: string;
  store: string;
  status?: AttendanceDayStatus;
  edited?: boolean;
  summary: string;
} & ComponentProps<typeof WorkTimeBar>) {
  const sub = state === "done" ? "text-staff-text-sub" : "";
  return (
    <article className={`flex flex-col gap-[3px] rounded-[18px] border px-[20px] pt-[20px] pb-[32px] leading-[1.5] ${CARD[state]}`}>
      <div className="flex items-center gap-[8px] pb-[5px]">
        <h3 className="min-w-0 flex-1 text-[13px] font-bold">{day}</h3>
        <span className={`truncate text-[12px] ${sub}`}>{store}</span>
        {edited && <Image src="/icons/pencil.svg" alt="수정된 기록" width={11.719} height={13.719} />}
        {status && <StatusChip tone={status.tone}>{status.label}</StatusChip>}
      </div>
      <WorkTimeBar {...bar} />
      <p className={`pt-[2px] text-[12px] ${sub}`}>{summary}</p>
    </article>
  );
}

// 쉬는 날 한 줄(node 12:1353): #F9FBFD 바탕 · radius 12 · 13px 보조 글자 가운데.
export function DayOffRow({ label }: { label: string }) {
  return (
    <p className="rounded-[12px] border border-staff-border-light bg-[#f9fbfd] px-[9px] pt-[11px] pb-[10px] text-center text-[13px] leading-[1.5] text-staff-text-sub">
      {label}
    </p>
  );
}
