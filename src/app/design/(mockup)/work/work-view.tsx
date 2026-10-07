"use client";

import Image from "next/image";
import Link from "next/link";
import { addTransitionType, startTransition, useId, useState } from "react";
import { SegmentedControl, segmentTabId, StatusChip, WeekSelector, type WeekDay } from "@/components/common";
import { STORES } from "../mockup-nav";
import { PageSlide } from "../page-slide";
import { StoreSheet } from "../store-sheet";
import { TodoPanel } from "./todo-panel";

// 목업 데이터: 2026년 9월 둘째 주, 오늘은 10일(목). 셋째 줄에 근무 시간을 적는다.
const WEEK: WeekDay[] = [
  { key: "09-07", weekday: "월", date: 7, note: "휴무" },
  { key: "09-08", weekday: "화", date: 8, note: "09-18", muted: true },
  { key: "09-09", weekday: "수", date: 9, note: "09-18" },
  { key: "09-10", weekday: "목", date: 10, note: "09-18" },
  { key: "09-11", weekday: "금", date: 11, note: "09-18" },
  { key: "09-12", weekday: "토", date: 12, note: "09-18" },
  { key: "09-13", weekday: "일", date: 13, note: "휴무", muted: true },
];

// 근무정보 본문(Figma 06.근무 정보 node 15:193). 탭 · 근무지 카드(누르면 근무지 시트) · 계약 안내 · 이번 주 · TO-DO 요약.
// 카드 바탕 #EEF2FF·#DCE4FF·#F9FBFD 는 홈·출퇴근 현황 카드와 같은 짝이다.
export function WorkView() {
  const [tab, setTabState] = useState<"schedule" | "todo">("schedule");
  // 탭 내용은 화면 이동과 같은 슬라이드로 바꾼다(PageSlide). 오른쪽 탭(TO-DO)으로 가면 nav-forward, 왼쪽이면 nav-back.
  // ViewTransition 은 transition 안의 변경에만 움직이므로 startTransition 으로 감싸 방향을 붙인다.
  const setTab = (next: "schedule" | "todo") => {
    if (next === tab) return;
    startTransition(() => {
      addTransitionType(next === "todo" ? "nav-forward" : "nav-back");
      setTabState(next);
    });
  };
  const [store, setStore] = useState(STORES[0]);
  const [sheet, setSheet] = useState(false);
  const [day, setDay] = useState("09-10");
  const panelId = useId();

  return (
    <main className="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
      <SegmentedControl
        label="보기"
        panelId={panelId}
        value={tab}
        onChange={setTab}
        items={[
          { value: "schedule", label: "스케줄" },
          { value: "todo", label: "TO-DO" },
        ]}
      />

      {/* key 가 바뀌면 옛 내용은 나가고(exit) 새 내용이 들어온다(enter) — 화면 이동 슬라이드와 같은 움직임. */}
      <PageSlide key={tab}>
        <div id={panelId} role="tabpanel" aria-labelledby={segmentTabId(panelId, tab)} className="flex flex-col gap-[20px]">
          {tab === "todo" ? (
            <TodoPanel />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSheet(true)}
                className="flex items-center gap-[14px] rounded-[18px] border border-staff-border-light bg-[#eef2ff] px-[20px] pt-[20px] pb-[24px] text-left transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
              >
                <Image src="/icons/store-small.svg" alt="" width={14.625} height={13.5} />
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="truncate text-[16px] font-bold">{store}</span>
                  <span className="text-[12px] text-staff-text-sub">연결된 근무지 {STORES.length}곳 · 탭하여 전환</span>
                </span>
                <Image src="/icons/chevron-right-dark.svg" alt="" width={24} height={24} />
              </button>
              <StoreSheet open={sheet} onClose={() => setSheet(false)} store={store} onPick={setStore} />

              <div className="flex items-center gap-[14px] rounded-[18px] border border-[#dce4ff] bg-[#eef2ff] px-[20px] pt-[20px] pb-[24px] text-staff-primary">
                <Image src="/icons/contract.svg" alt="" width={11.688} height={13.813} />
                <p className="min-w-0 flex-1 text-[14px]">
                  근로계약이 아직 체결되지 않았습니다.
                  <br />
                  스케줄은 정상 등록됩니다.
                </p>
                <Link href="#" className="-m-[12px] flex min-h-[44px] shrink-0 items-center p-[12px] text-[13px] font-semibold">
                  확인
                </Link>
              </div>

              <section className="flex flex-col gap-[6px]">
                <h2 className="text-[13px] font-semibold text-staff-text-sub">이번 주 · 9월 7일 – 13일</h2>
                <div className="flex flex-col gap-[13px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">
                  <WeekSelector days={WEEK} selected={day} onSelect={setDay} />
                  <p className="border-t border-staff-border-light pt-[12px] text-[12px] text-staff-text-muted">
                    오늘(목)을 탭하면 하루 상세를 볼 수 있습니다.
                  </p>
                </div>
              </section>

              <button
                type="button"
                onClick={() => setTab("todo")}
                className="flex items-center gap-[8px] rounded-[18px] border border-staff-border-light bg-[#f9fbfd] p-[20px] text-left transition-colors duration-150 ease-out active:bg-staff-info-bg"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-[13px] font-semibold text-staff-text-sub">TO-DO</span>
                  <span className="text-[16px] font-bold">오늘 2건 남음</span>
                </span>
                <StatusChip tone="warning">긴급 1</StatusChip>
                <Image src="/icons/chevron-right-15.svg" alt="" width={15} height={15} className="-scale-y-100" />
              </button>
            </>
          )}
        </div>
      </PageSlide>
    </main>
  );
}
