"use client";

// 직원 근무 앱 데모 · 근무(/demo/work). 기준 목업: docs/mockup/app/work.html — 상태 6개(월 달력 · TO-DO 목록 · 완료 처리 직후 ·
// 공유 TO-DO 선점됨 · 근무지 없음 · 등록된 근무 없음)와 시트 2개(긴급 TO-DO 상세 · 공유 TO-DO 안내), 화면 문구·가짜 값·버튼 이동(data-go)을
// 옮겼다. 쟁점 WORK-1~4 는 모두 확정이고 그대로 따른다:
//   WORK-1 근무스케줄은 월 달력, 고른 날 상세는 달력 아래 · WORK-2 근무 화면 안에서 근무스케줄·TO-DO 탭으로 나눔
//   WORK-3 공유 TO-DO 수행자 이름 공개 · WORK-4 근무지 전환은 홈 상단 선택기 하나, 이 화면은 근무지 이름만 보이고 카드도 읽기 전용
// 화면 틀(머리줄 · 탭 · 근무지 카드 · 계약 안내 · TO-DO 요약 카드 · 하단 메뉴)은 Figma 06.근무 정보(node 15:183 · 본문 15:193),
// TO-DO 목록은 Figma 07.근무 정보_list(node 17:602~)를 따른다. Figma 의 주간 날짜 줄과 근무지 전환 시트는 WORK-1·WORK-4 확정에 따라
// 월 달력과 읽기 전용 카드로 바꿨다. 월 달력 · 고른 날 상세 · 근무지 없음 · 등록된 근무 없음 · 시트 2개는 Figma 없음 — DESIGN.md 기준 초안.
// 하단 메뉴는 Figma·DESIGN.md 의 네 칸이다(목업은 출퇴근까지 다섯 칸).
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  BottomNav,
  BottomSheet,
  Button,
  Card,
  MaskIcon,
  Notice,
  PageHeader,
  PeriodNav,
  SegmentedControl,
  segmentTabId,
  StatusChip,
  WorkTimeBar,
} from "@/components/common";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DEMO_NAV_ITEMS, DemoStates, useDemoState } from "../_components";
import { MonthCalendar } from "./month-calendar";
import { TodoPanel, type TodoSheet, type TodoState } from "./todo-panel";

// 목업 오른쪽 상태 목록 순서 그대로. fridge·sharedInfo 는 목업의 「시트 열기」라 TO-DO 목록 위에 시트를 띄운다.
const STATES = [
  { id: "week", label: "월 달력", note: "고른 날 상세" },
  { id: "todo", label: "TO-DO 목록", note: "5건" },
  { id: "todo-done", label: "완료 처리 직후", note: "토스트 확인" },
  { id: "shared", label: "공유 TO-DO 선점됨", note: "동료가 먼저 완료" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "empty", label: "등록된 근무 없음", note: "빈 상태" },
  { id: "fridge", label: "긴급 TO-DO 상세", note: "냉장고 점검" },
  { id: "sharedInfo", label: "공유 TO-DO 안내", note: "한 명 수행" },
];
const isSheet = (id: string): id is TodoSheet => id === "fridge" || id === "sharedInfo";
const isTodo = (id: string): id is TodoState => id === "todo" || id === "todo-done" || id === "shared";

const STORE = "웨일카페 강남역점";
const CHECK_IN = "/demo/check-in";
const CONTRACT = "/demo/contract"; // 3장

export default function DemoWorkPage() {
  const [state, move] = useDemoState(STATES);
  const panelId = useId();

  const [openedSheet, setOpenedSheet] = useState<TodoSheet | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const sheet = openedSheet ?? (isSheet(state) ? state : null);
  const view = isSheet(state) ? "todo" : state;
  const tab = isTodo(view) ? "todo" : "schedule";

  // 탭: 오른쪽(TO-DO)은 nav-forward, 왼쪽(근무스케줄)은 nav-back. 등록된 근무 없음에서 근무스케줄을 누르면 그대로 둔다.
  const handleTabChange = (next: "schedule" | "todo") => {
    if (next === tab) return;
    move(next === "todo" ? "todo" : "week", next === "todo" ? "nav-forward" : "nav-back");
  };
  const handleUrgentDone = () => {
    setOpenedSheet(null);
    move("todo-done");
    setToast("완료 처리했습니다");
  };
  const handleSheetClose = () => {
    setOpenedSheet(null);
    if (isSheet(state)) move("todo", "nav-back");
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <div className="flex flex-1 flex-col">
        <PageHeader
          title="근무 정보"
          backHref="/demo/home"
          // WORK-4: 전환 아이콘 대신 지금 근무지 이름만. 근무지가 없으면 비운다.
          action={view !== "nosite" && <span className="shrink-0 text-[12px] text-staff-text-muted">{STORE}</span>}
        />

        <main className={`flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5] ${view === "nosite" ? "flex-1" : ""}`}>
          {view !== "nosite" && (
            <SegmentedControl
              label="보기"
              panelId={panelId}
              value={tab}
              onChange={handleTabChange}
              items={[
                { value: "schedule", label: "근무스케줄" },
                { value: "todo", label: "TO-DO" },
              ]}
            />
          )}

          {/* TO-DO 세 상태는 한 탭이라 슬라이드 없이 바뀌고, 탭·빈 상태가 바뀔 때만 미끄러진다. */}
          <PageSlide key={isTodo(view) ? "todo" : view}>
            {view === "nosite" ? (
              <Empty
                icon={<MaskIcon src="/icons/store.svg" size={40} flipY />}
                title="근무지가 없습니다"
                description="연결된 근무지가 없어 스케줄과 TO-DO 를 보여 줄 수 없습니다. 받은 급여명세서는 급여 탭에서 계속 볼 수 있습니다."
              />
            ) : (
              <div id={panelId} role="tabpanel" aria-labelledby={segmentTabId(panelId, tab)} className="flex flex-col gap-[20px]">
                {isTodo(view) && <TodoPanel key={view} state={view} onUrgentDone={handleUrgentDone} onOpen={setOpenedSheet} />}
                {view === "empty" && (
                  <Empty
                    icon={<Image src="/icons/menu-schedule.svg" alt="" width={44} height={44} />}
                    title="이번 달 등록된 근무가 없습니다"
                    description="관리자가 스케줄을 등록하면 이 달력에 표시됩니다."
                  />
                )}
                {view === "week" && (
                  <Schedule
                    onMonth={(m) => setToast(`${m}월로 옮겼습니다`)}
                    onToday={() => setToast("9월 10일을 골랐습니다")}
                    onTodoSummary={() => handleTabChange("todo")}
                  />
                )}
              </div>
            )}
          </PageSlide>
        </main>

        {/* 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다(/design/work 그대로). */}
        <div className="sticky bottom-0 mt-auto">
          <BottomNav current="/demo/work" items={DEMO_NAV_ITEMS} />
        </div>
      </div>

      <BottomSheet open={sheet === "fridge"} onClose={handleSheetClose} title="냉장고 온도 점검 및 사진 제출">
        <div className="flex">
          <StatusChip tone="warning">긴급</StatusChip>
        </div>
        <p className="text-[14px] text-staff-text-sub">
          강남역점 냉장·냉동고 온도를 확인하고 온도계가 보이는 사진을 찍어 관리자에게 전송한다. 이상 온도가 발견되면 즉시 전화로도 알린다.
        </p>
        <Sunken>
          <Values
            rows={[
              ["수행 예정", "9월 10일(목) 14:00"],
              ["근무지", STORE],
              [
                "상태",
                <StatusChip key="s" tone="neutral">
                  대기
                </StatusChip>,
              ],
            ]}
          />
        </Sunken>
        <Button onClick={handleUrgentDone}>완료로 표시</Button>
      </BottomSheet>

      <BottomSheet open={sheet === "sharedInfo"} onClose={handleSheetClose} title="매장 재고 실사 보조" closeLabel="확인">
        <div className="flex">
          <StatusChip tone="neutral">공유</StatusChip>
        </div>
        <p className="text-[14px] text-staff-text-sub">
          강남역점 재고 실사를 돕는다. 강남역점 근무 직원 4명 전체에게 배정되었고, 그중 한 명만 완료 처리하면 나머지 전원에게도 완료로 표시된다.
        </p>
        <Notice>먼저 완료 처리한 사람이 수행자로 기록됩니다.</Notice>
      </BottomSheet>

      {/* 목업의 data-toast. 하단 메뉴 위에 띄운다. 떠 있는 것이라 짙은 남색 바탕(join 데모와 같은 모양). */}
      {toast && (
        <p
          role="status"
          className="fixed bottom-[120px] left-1/2 z-40 -translate-x-1/2 rounded-[12px] bg-staff-navy/90 px-[16px] py-[10px] text-[13px] font-semibold whitespace-nowrap text-white"
        >
          {toast}
        </p>
      )}
    </>
  );
}

// 근무스케줄 탭(week). 근무지 카드와 계약 안내 카드는 Figma 06 의 모양(radius 18 · #EEF2FF)이고, 근무지 카드는 WORK-4 로 읽기 전용이다.
function Schedule({ onMonth, onToday, onTodoSummary }: { onMonth: (month: number) => void; onToday: () => void; onTodoSummary: () => void }) {
  return (
    <>
      <div className="flex items-center gap-[14px] rounded-[18px] border border-staff-border-light bg-[#eef2ff] px-[20px] pt-[20px] pb-[24px]">
        <Image src="/icons/store-small.svg" alt="" width={14.625} height={13.5} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <p className="truncate text-[16px] font-bold">{STORE}</p>
          <p className="text-[12px] text-staff-text-sub">연결된 근무지 2곳 · 전환은 홈 상단에서</p>
        </div>
      </div>

      {/* 근로계약 미체결 경고(목업 근거 S-WPGUXX). 글자색은 Figma 그대로 남보라 — 「확인」 링크가 지금 누를 것이다. */}
      <div className="flex items-center gap-[14px] rounded-[18px] border border-[#dce4ff] bg-[#eef2ff] px-[20px] pt-[20px] pb-[24px] text-staff-primary">
        <Image src="/icons/contract.svg" alt="" width={11.688} height={13.813} />
        <p className="min-w-0 flex-1 text-[14px]">근로계약이 아직 체결되지 않았습니다. 스케줄은 정상 등록됩니다.</p>
        <Link href={CONTRACT} transitionTypes={["nav-forward"]} className="-m-[12px] flex min-h-[44px] shrink-0 items-center p-[12px] text-[13px] font-semibold">
          확인
        </Link>
      </div>

      <section className="flex flex-col gap-[8px]">
        <PeriodNav label="2026년 9월" prevLabel="이전 달" nextLabel="다음 달" onPrev={() => onMonth(8)} onNext={() => onMonth(10)} />
        <div className="flex flex-col gap-[12px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">
          <MonthCalendar onToday={onToday} />
          <p className="border-t border-staff-border-light pt-[12px] text-[12px] text-staff-text-muted">
            근무가 있는 날에만 시간이 붙습니다. 날짜를 누르면 아래에 그날 상세가 열립니다.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-[8px]">
        <h2 className="text-[13px] font-semibold text-staff-text-sub">고른 날 · 9월 10일(목)</h2>
        <Card>
          <div className="flex items-center gap-[12px]">
            <Image src="/icons/store-small.svg" alt="" width={14.625} height={13.5} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{STORE}</p>
              <p className="text-[12px] text-staff-text-sub">오픈조</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="pb-[8px] text-[13px] font-semibold text-staff-text-sub">근무 시간</p>
          <WorkTimeBar schedule={{ start: "09:00", end: "18:00" }} worked={{ start: "09:02", end: "14:12" }} ongoing />
          <p className="pt-[8px] text-[12px] text-staff-text-muted">점선은 예정, 채운 칠은 실제 기록입니다</p>
        </Card>
        <Sunken>
          <Values
            rows={[
              ["예정 시간", "09:00 – 18:00"],
              ["휴게시간", "60분"],
              ["실제 출근", "09:02"],
              ["근무 유형", "오픈"],
            ]}
          />
        </Sunken>
      </section>

      <Notice>근무스케줄은 관리자가 등록합니다. 이 화면에서는 조회만 할 수 있습니다.</Notice>

      {/* Figma 06 의 TO-DO 요약 카드. 오늘(9월 10일) 남은 건 = 긴급 「냉장고 온도 점검」 + 진행 중 「신메뉴 시식」. */}
      <button
        type="button"
        onClick={onTodoSummary}
        className="flex items-center gap-[8px] rounded-[18px] border border-staff-border-light bg-[#f9fbfd] p-[20px] text-left transition-colors duration-150 ease-out active:bg-staff-info-bg"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="text-[13px] font-semibold text-staff-text-sub">TO-DO</span>
          <span className="text-[16px] font-bold">오늘 2건 남음</span>
        </span>
        <StatusChip tone="warning">긴급 1</StatusChip>
        <Image src="/icons/chevron-right-15.svg" alt="" width={15} height={15} className="-scale-y-100" />
      </button>

      <Button variant="ghost" href={CHECK_IN} transitionTypes={["nav-forward"]}>
        출퇴근 등록 화면 보기
      </Button>
    </>
  );
}

// 빈 상태: 가운데 정렬 아이콘 · 제목(Title 2 18px) · 설명 13px. 근무지 없음은 화면 가운데, 등록된 근무 없음은 탭 아래에 놓는다.
function Empty({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">
      <span className="flex items-center justify-center pb-[6px] text-staff-placeholder">{icon}</span>
      <p className="text-[18px] font-bold">{title}</p>
      <p className="max-w-[260px] text-[13px] text-staff-text-sub">{description}</p>
    </div>
  );
}

// 목업 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14(join 데모와 같은 판).
function Sunken({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">{children}</div>;
}

function Values({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col divide-y divide-staff-border-light">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center gap-[12px] py-[9px] first:pt-0 last:pb-0">
          <dt className="shrink-0 text-[13px] font-medium text-staff-text-sub">{k}</dt>
          <dd className="flex min-w-0 flex-1 justify-end text-right text-[13px] tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
