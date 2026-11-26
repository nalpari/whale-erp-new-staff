"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { slideMonthIn, useMonthSwipe } from "@/components/common/month-swipe";
import { WorkTimeBar } from "@/components/common";
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
// 달을 넘긴 쪽(+1 다음 · -1 이전). 달이 바뀌면 주소가 바뀌어 패널이 새로 그려지므로(key) 컴포넌트 밖에 들고 있다가,
// 새 패널이 그려질 때 새 달 칸을 그쪽에서 밀어 넣고 비운다(2026-11-26 실기기 피드백).
let pendingSlide: { month: string; delta: number } | null = null;

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
  // 알림에서 왔으면 달을 넘겨도 뒤로 가기(알림 목록)가 이어지게 from 을 남긴다
  const from = useSearchParams().get("from") === "notifications" ? "&from=notifications" : "";
  // 달이 바뀌면(이 컴포넌트는 key={month} 로 다시 그린다) 처음 고른 날도 다시 정한다.
  const [picked, setPicked] = useState(() => day ?? initialDay(month, today, items));
  const byDay = new Map<string, MyWorkSchedule[]>();
  for (const item of items) byDay.set(item.workDate, [...(byDay.get(item.workDate) ?? []), item]);
  const pickedItems = byDay.get(picked) ?? [];
  const weeks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 이 달로 넘긴 요청이 들어온 것일 때만 미끄러진다 — 넘기던 중 다른 탭으로 가 이동이 취소된 뒤 돌아왔을 때 엉뚱하게 움직이지 않게.
    if (pendingSlide?.month === month) slideMonthIn(weeks.current, pendingSlide.delta);
    pendingSlide = null;
  }, [month]);
  const go = (delta: number) => {
    pendingSlide = { month: shiftMonth(month, delta), delta };
    router.replace(`/work?tab=schedule&month=${shiftMonth(month, delta)}${from}`, { scroll: false });
  };
  // 좌우로 밀어 달을 넘긴다(조회 기간 달력과 같은 규칙, 2026-11-26 실기기 피드백)
  const swipe = useMonthSwipe(go);
  // 「오늘」 — 이번 달로 돌아와 오늘을 고른다(2026-10-23 재영). 주소의 day 도 오늘로 맞춰 새로 고쳐도 오늘이 골라진다.
  // 다른 달이면 주소가 바뀌어 패널이 새로 그려지므로, 옛 달 근무로 오늘 상세를 잠깐 그리지 않게 이번 달일 때만 바로 고른다.
  const goToday = () => {
    if (today.startsWith(month)) setPicked(today);
    else pendingSlide = { month: today.slice(0, 7), delta: today.slice(0, 7) > month ? 1 : -1 };
    router.replace(`/work?tab=schedule&month=${today.slice(0, 7)}&day=${today}${from}`, { scroll: false });
  };
  const navButton =
    "flex size-[36px] shrink-0 items-center justify-center rounded-[12px] border border-staff-border-light bg-white transition-colors duration-150 ease-out active:bg-staff-info-bg";

  return (
    <div className="flex flex-col gap-[12px]">
      {/* overflow-hidden — 새 달이 옆에서 들어오는 동안 카드 밖으로 나가지 않게 */}
      <div className="flex flex-col gap-[6px] overflow-hidden rounded-[18px] border border-staff-border-light bg-white px-[8px] pt-[14px] pb-[10px]">
        {/* 양쪽 화살표 칸을 같은 폭(36)으로 두어 가운데 칸(달 이름 · 「오늘」)이 한가운데에 온다(데모 work) */}
        <div className="grid grid-cols-[36px_1fr_36px] items-center gap-[8px] px-[6px] pb-[8px] leading-[1.5]">
          <button type="button" aria-label="이전 달" onClick={() => go(-1)} className={navButton}>
            <Image src="/icons/chevron-left-24.svg" alt="" width={20} height={20} className="-scale-y-100" />
          </button>
          <div className="flex min-w-0 items-center justify-center gap-[8px]">
            <p className="text-[16px] font-bold whitespace-nowrap">{monthLabel(month)}</p>
            <button
              type="button"
              onClick={goToday}
              className="flex h-[32px] shrink-0 items-center rounded-[10px] bg-staff-primary-inactive px-[10px] text-[13px] font-semibold text-staff-primary transition-colors duration-150 ease-out active:bg-[#dcdcf7]"
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
        {/* 날짜 칸 — 좌우로 밀면 달을 넘긴다. pan-y 로 가로 움직임은 브라우저가 쓰지 않게 하고 두 손가락 확대는 둔다 */}
        <div ref={weeks} className="flex touch-pan-y touch-pinch-zoom flex-col gap-[6px]" {...swipe}>
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
        </div>
            {/* 근무가 없는 달은 눌러도 볼 것이 없어 안내를 빼고 아래 빈 상태만 둔다 */}
            {items.length > 0 && (
              <p className="border-t border-staff-border-light px-[4px] pt-[10px] text-[12px] text-staff-text-muted">
                날짜를 누르면 해당 날짜의 근무 일정을 확인할 수 있습니다.
              </p>
            )}
      </div>

      {/* 근무가 없는 달은 고른 날 상세 대신 데모 work 의 빈 상태를 둔다. 달 이동은 남겨야 해서 달력은 그대로 그린다. */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-[8px] py-[52px] text-center leading-[1.5] break-keep">
          <span className="flex items-center justify-center pb-[6px]">
            <Image src="/icons/menu-schedule.svg" alt="" width={44} height={44} />
          </span>
          <p className="text-[18px] font-bold">{today.startsWith(month) ? "이번 달" : monthLabel(month)} 근무스케줄이 없습니다</p>
          {/* 낱말 중간에서 꺾이지 않게 break-keep · 문장을 짧게(2026-11-20 사용자 지정 — 「표시됩/니다」로 꺾였다) */}
          <p className="text-[14px] text-staff-text-sub">근무스케줄이 등록되면 여기에 표시됩니다.</p>
        </div>
      ) : (
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
            <p className="text-[12px] leading-[1.5] text-staff-text-muted">근무스케줄 변경은 근무지 관리자에게 문의해 주세요.</p>
          </section>
      )}
    </div>
  );
}
