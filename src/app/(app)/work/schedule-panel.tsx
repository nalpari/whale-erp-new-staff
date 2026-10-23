"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice, WorkTimeBar } from "@/components/common";
import {
  badgeOf,
  barOf,
  dayTitle,
  initialDay,
  monthGrid,
  monthLabel,
  shiftMonth,
  type MyWorkSchedule,
} from "@/lib/work-schedules";

const WEEKDAY_HEADS = ["월", "화", "수", "목", "금", "토", "일"];
// 토요일 파랑 · 일요일 빨강(시안 A, 2026-10-23). 이 달력에만 나와 토큰으로 두지 않는다.
const WEEKEND_TONE: Record<number, string> = { 5: "text-[#3c6fd8]", 6: "text-[#d04848]" };

// 근무스케줄 탭(WORK-1) — 월 달력(머리에 달 이동 ‹ 2026년 10월 [오늘] ›), 누른 날의 상세를 달력 아래에. 근무가 있는 날은 홈 이번 주 칸과 같은 바탕색(#EEF2FF)에
// 근무 수만큼 점을 찍는다(2026-10-23 재영 — 시간 배지 대신). 시간은 아래 그날 상세에서 본다.
// 보기만 한다 — 고치기는 관리자 웹이다. 달은 주소 ?month= 에 두고, 고른 날은 화면 안 상태다.
// 실제 출근 · 실제 근무 막대는 출퇴근 기록이 생길 때 붙인다(2026-10-22 재영 — 이번에는 예정만).
export function SchedulePanel({
  month,
  today,
  day,
  items,
  storeName,
}: {
  month: string;
  today: string;
  /** 먼저 고를 날 — 알림에서 들어올 때 */
  day?: string;
  items: MyWorkSchedule[];
  storeName: string;
}) {
  const router = useRouter();
  // 달이 바뀌면(이 컴포넌트는 key={month} 로 다시 그린다) 처음 고른 날도 다시 정한다.
  const [picked, setPicked] = useState(() => day ?? initialDay(month, today, items));
  const byDay = new Map<string, MyWorkSchedule[]>();
  for (const item of items) byDay.set(item.workDate, [...(byDay.get(item.workDate) ?? []), item]);
  const pickedItems = byDay.get(picked) ?? [];
  const go = (delta: number) => router.replace(`/work?tab=schedule&month=${shiftMonth(month, delta)}`, { scroll: false });
  // 「오늘」 — 이번 달로 돌아와 오늘을 고른다(2026-10-23 재영). 주소의 day 도 오늘로 맞춰 새로 고쳐도 오늘이 골라진다.
  // 다른 달이면 주소가 바뀌어 패널이 새로 그려지므로, 옛 달 근무로 오늘 상세를 잠깐 그리지 않게 이번 달일 때만 바로 고른다.
  const goToday = () => {
    if (today.startsWith(month)) setPicked(today);
    router.replace(`/work?tab=schedule&month=${today.slice(0, 7)}&day=${today}`, { scroll: false });
  };
  const navButton =
    "flex size-[36px] shrink-0 items-center justify-center rounded-[12px] border border-staff-border-light bg-white transition-colors duration-150 ease-out active:bg-staff-info-bg";

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[6px] rounded-[18px] border border-staff-border-light bg-white px-[8px] pt-[14px] pb-[10px]">
        <div className="flex items-center justify-between px-[6px] pb-[8px] leading-[1.5]">
          <button type="button" aria-label="이전 달" onClick={() => go(-1)} className={navButton}>
            <Image src="/icons/chevron-left-24.svg" alt="" width={20} height={20} className="-scale-y-100" />
          </button>
          <div className="flex items-center gap-[8px]">
            <p className="text-[16px] font-bold">{monthLabel(month)}</p>
            <button
              type="button"
              onClick={goToday}
              className="flex h-[32px] items-center rounded-[10px] bg-staff-primary-inactive px-[10px] text-[13px] font-semibold text-staff-primary transition-colors duration-150 ease-out active:bg-[#dcdcf7]"
            >
              오늘
            </button>
          </div>
          <button type="button" aria-label="다음 달" onClick={() => go(1)} className={navButton}>
            <Image src="/icons/chevron-right-24.svg" alt="" width={20} height={20} className="-scale-y-100" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-[12px] text-staff-text-sub">
          {WEEKDAY_HEADS.map((w, i) => (
            <span key={w} className={WEEKEND_TONE[i] ?? ""}>
              {w}
            </span>
          ))}
        </div>
            {monthGrid(month).map((week) => (
              <div key={week[0].date} className="grid grid-cols-7 gap-[2px]">
                {week.map((d, i) => {
                  const dayItems = d.inMonth ? (byDay.get(d.date) ?? []) : [];
                  const badge = badgeOf(dayItems);
                  const selected = d.inMonth && d.date === picked;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={!d.inMonth}
                      aria-pressed={selected}
                      aria-label={`${dayTitle(d.date)}${badge ? ` 근무 ${badge}` : ""}`}
                      onClick={() => setPicked(d.date)}
                      className={`flex min-h-[52px] flex-col items-center gap-[2px] rounded-[10px] pt-[6px] transition-colors duration-150 ease-out ${
                        selected
                          ? "bg-staff-primary text-white"
                          : !d.inMonth
                            ? "text-staff-placeholder"
                            : dayItems.length > 0
                              ? "bg-[#eef2ff] active:bg-staff-primary-inactive"
                              : "active:bg-staff-primary-inactive"
                      }`}
                    >
                      <span
                        className={`text-[14px] ${
                          d.date === today && !selected ? "font-bold text-staff-primary" : `font-semibold ${d.inMonth && !selected ? (WEEKEND_TONE[i] ?? "") : ""}`
                        }`}
                      >
                        {d.day}
                      </span>
                      {dayItems.length > 0 && (
                        <span className={`flex gap-[3px] pt-[2px] ${selected ? "text-white" : "text-staff-primary"}`}>
                          {dayItems.map((item) => (
                            <span key={item.workScheduleId} className="size-[4px] rounded-[2px] bg-current" />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            {/* 근무가 없는 달도 달력은 그대로 그리고 안내 줄만 둔다(2026-10-23 재영). */}
            {items.length === 0 && (
              <p className="border-t border-staff-border-light px-[4px] pt-[10px] text-[12px] text-staff-text-muted">
                이 달에 등록된 근무가 없습니다. 관리자가 등록하면 이 달력에 표시됩니다.
              </p>
            )}
      </div>

      <section className="flex flex-col gap-[6px]">
            <h2 className="text-[13px] font-semibold text-staff-text-sub">{dayTitle(picked)}</h2>
            <div className="flex flex-col gap-[14px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
              <p className="text-[14px] font-semibold">{storeName}</p>
              {pickedItems.length === 0 ? (
                <p className="text-[14px] text-staff-text-sub">이날은 근무가 없습니다.</p>
              ) : (
                pickedItems.map((item) => {
                  const bar = barOf(item);
                  return (
                    <div key={item.workScheduleId} className="flex flex-col gap-[10px]">
                      <WorkTimeBar schedule={bar.schedule} from={bar.from} to={bar.to} />
                      <dl className="grid grid-cols-[auto_1fr] gap-x-[12px] gap-y-[4px] text-[13px]">
                        <dt className="text-staff-text-sub">예정 시간</dt>
                        <dd className="text-right font-semibold">
                          {item.startTime} – {item.endTime}
                          {bar.schedule.end !== item.endTime && " (다음 날)"}
                        </dd>
                        <dt className="text-staff-text-sub">휴게시간</dt>
                        <dd className="text-right font-semibold">{item.breakMinutes}분</dd>
                      </dl>
                    </div>
                  );
                })
              )}
            </div>
          </section>

      <Notice>근무스케줄은 관리자가 등록합니다. 이 화면에서는 조회만 할 수 있습니다.</Notice>
    </div>
  );
}
