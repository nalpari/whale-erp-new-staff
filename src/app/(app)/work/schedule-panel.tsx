"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Notice, PeriodNav, WorkTimeBar } from "@/components/common";
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

// 근무스케줄 탭(WORK-1) — 달 이동, 월 달력(근무가 있는 날에만 시간 배지), 누른 날의 상세를 달력 아래에.
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

  return (
    <div className="flex flex-col gap-[20px]">
      <PeriodNav label={monthLabel(month)} prevLabel="이전 달" nextLabel="다음 달" onPrev={() => go(-1)} onNext={() => go(1)} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-[6px] py-[40px] text-center leading-[1.5]">
          <p className="text-[16px] font-bold">이번 달 등록된 근무가 없습니다</p>
          <p className="text-[14px] text-staff-text-sub">관리자가 스케줄을 등록하면 이 달력에 표시됩니다.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-[6px] rounded-[18px] border border-staff-border-light bg-white px-[8px] pt-[14px] pb-[10px]">
            <div className="grid grid-cols-7 text-center text-[12px] text-staff-text-sub">
              {WEEKDAY_HEADS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            {monthGrid(month).map((week) => (
              <div key={week[0].date} className="grid grid-cols-7 gap-[2px]">
                {week.map((d) => {
                  const badge = d.inMonth ? badgeOf(byDay.get(d.date) ?? []) : null;
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
                        selected ? "bg-staff-primary text-white" : d.inMonth ? "active:bg-staff-primary-inactive" : "text-staff-placeholder"
                      }`}
                    >
                      <span className={`text-[14px] ${d.date === today && !selected ? "font-bold text-staff-primary" : "font-semibold"}`}>{d.day}</span>
                      {badge && (
                        <span className={`text-[10px] leading-[1.2] ${selected ? "text-white" : "text-staff-text-sub"}`}>{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            <p className="border-t border-staff-border-light px-[4px] pt-[10px] text-[12px] text-staff-text-muted">
              근무가 있는 날에만 시간이 붙습니다. 날짜를 누르면 아래에 그날 상세가 열립니다.
            </p>
          </div>

          <section className="flex flex-col gap-[6px]">
            <h2 className="text-[13px] font-semibold text-staff-text-sub">고른 날 · {dayTitle(picked)}</h2>
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
        </>
      )}

      <Notice>근무스케줄은 관리자가 등록합니다. 이 화면에서는 조회만 할 수 있습니다.</Notice>
    </div>
  );
}
