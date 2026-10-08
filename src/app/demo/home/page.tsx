"use client";

// 직원 근무 앱 데모 · 홈(/demo/home). 기준 목업: docs/mockup/app/home.html — 상태 6개(평상시 · 처리할 일 쌓임 · 오늘 휴무 ·
// 연결 보류 · 가입 직후 · 퇴직 후)와 시트 2개(근무지 고르기 · 날인 요청 팝업), 화면 문구·가짜 값을 옮겼다. 쟁점 HOME-1~5 는 모두 확정이다.
//   HOME-1 순서는 오늘·이번 주 먼저, 서명 대기 계약서는 날인 요청 팝업으로 따로 알리고 TO-DO 카드에서 TO-DO 목록으로 바로 간다.
//   HOME-2 근무지 선택기는 홈 머리줄에만 둔다. HOME-3 출퇴근 등록은 오늘 근무 카드 안 버튼으로 간다(하단 메뉴에 출퇴근 칸 없음).
//   HOME-4 날인 요청 팝업은 날인하기 전까지 앱을 열 때마다 띄운다 — 데모에서는 「날인 요청 팝업」 상태로 본다.
//   HOME-5 퇴직 후에는 「근무지가 없습니다」, 하단 메뉴와 알림 버튼은 그대로 두고 급여 탭으로 간다.
// 평상시(today)는 Figma 02.Main(node 8:3)을 따른다(오늘의 근무 node 9:152 · 이번 주 근무 node 9:242 · 근무지 시트 03.Sheet node 12:670).
// 그 밖 상태(처리할 일 카드 · 휴무 · 연결 보류 · 가입 직후 · 퇴직 후 · 날인 요청 팝업)는 Figma 없음 — DESIGN.md 기준 초안.
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  BottomNav,
  BottomSheet,
  Button,
  MaskIcon,
  SectionTitle,
  SheetOption,
  StatusChip,
  TodoItem,
  TodoList,
  TopBar,
  WeekSelector,
  InfoRow,
  type WeekDay,
} from "@/components/common";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DEMO_NAV_ITEMS, DemoStates, Empty, useDemoState, useToast } from "../_components";

// 목업 오른쪽 상태 목록 순서 그대로. store·sign-req 는 목업의 「시트 열기」라 뒤에 평상시·처리할 일 쌓임 화면을 깐다.
const STATES = [
  { id: "today", label: "평상시", note: "오늘 근무 있음" },
  { id: "todo", label: "처리할 일 쌓임", note: "계약·TO-DO·알림" },
  { id: "off", label: "오늘 휴무", note: "근무 없음" },
  { id: "held", label: "연결 보류", note: "관리자 확인 중" },
  { id: "empty", label: "가입 직후", note: "정보 없음" },
  { id: "retired", label: "퇴직 후", note: "연결된 근무지 없음" },
  { id: "store", label: "근무지 고르기", note: "근무지 전환" },
  { id: "sign-req", label: "날인 요청 팝업", note: "서명 대기 도착" },
];
type Sheet = "store" | "sign-req";
const isSheet = (id: string): id is Sheet => id === "store" || id === "sign-req";
const SHEET_VIEW: Record<Sheet, string> = { store: "today", "sign-req": "todo" };

const HOME = "/demo/home";
const CHECK_IN = "/demo/check-in";
const CONTRACT = "/demo/contract#detail"; // 목업 contract.html#detail — 그 계약서 화면에서 날인한다
const STORES = ["웨일카페 강남역점", "웨일카페 홍대점", "웨일베이커리 합정점"];

// 2026년 9월 둘째 주, 오늘은 10일(목). 근무일은 셋째 줄에 근무 시간을 쓰고, 쉬는 날은 흐리게 낮춘다.
const work = (key: string, weekday: string, date: number, note: string): WeekDay => ({ key, weekday, date, work: true, note });
const off = (key: string, weekday: string, date: number): WeekDay => ({ key, weekday, date, muted: true });
const WEEK_HEAD: WeekDay[] = [work("09-07", "월", 7, "09–18"), work("09-08", "화", 8, "09–18"), off("09-09", "수", 9)];
const WEEK_TAIL: WeekDay[] = [work("09-11", "금", 11, "13–22"), off("09-12", "토", 12), work("09-13", "일", 13, "10–19")];
const weekWith = (today: WeekDay) => [...WEEK_HEAD, today, ...WEEK_TAIL];

export default function DemoHomePage() {
  const [state, move] = useDemoState(STATES);
  const [store, setStore] = useState(STORES[0]);
  const [openedSheet, setOpenedSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useToast();

  const sheet = openedSheet ?? (isSheet(state) ? state : null);
  const view = isSheet(state) ? SHEET_VIEW[state] : state;

  const handleSheetClose = () => {
    setOpenedSheet(null);
    if (isSheet(state)) move(SHEET_VIEW[state], "nav-back");
  };
  const handleStorePick = (picked: string) => {
    if (picked !== store) setToast(`${picked}으로 전환했습니다`);
    setStore(picked);
    handleSheetClose();
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <PageSlide key={view}>
        <div className="flex flex-1 flex-col gap-[24px] leading-[1.5]">
          <main className="flex flex-1 flex-col px-[22px] pt-[42px]">
            {/* 근무지 선택기는 근무지가 정해진 상태에서만(HOME-2). 연결 보류·가입 직후는 이름만, 알림 버튼은 퇴직 후에도 남는다(HOME-5). */}
            {view === "today" || view === "todo" || view === "off" ? (
              <TopBar store={store} onStoreClick={() => setOpenedSheet("store")} alarmHref="/demo/notify" hasNewAlarm={view === "todo"} />
            ) : (
              <PlainTopBar title={view === "held" ? "웨일카페" : view === "empty" ? "웨일카페 홍대점" : undefined} bell={view === "retired"} />
            )}

            <div className="flex flex-col gap-[5px] pt-[24px] pb-[20px]">
              <h1 className="text-[26px] font-bold">하은님, 좋은 아침이에요</h1>
              <p className="text-[12px] text-staff-text-sub">9월 10일 목요일 · 오늘도 기분 좋은 하루 되세요</p>
            </div>

            {view === "today" && (
              <Sections>
                <TodayCard time={["09:00", "18:00"]} />
                <ThisWeek days={weekWith(work("09-10", "목", 10, "09–18"))} />
                <TodoSection count={1}>
                  <TodoList>
                    <TickTodo title="유통기한 라벨 점검" meta="오늘 20:00까지" />
                  </TodoList>
                </TodoSection>
                <WorkInfo />
              </Sections>
            )}

            {view === "todo" && (
              <Sections>
                <TodayCard time={["13:00", "22:00"]} />
                <ThisWeek days={weekWith(work("09-10", "목", 10, "13–22"))} />
                {/* 처리할 일은 카드로만 알린다(HOME-1). 날인 대기 카드는 경고 칩 색(#FFF6E5 · #956013)을 빌린다 — 이 카드에만 나와 토큰으로 두지 않는다. */}
                <Link
                  href={CONTRACT}
                  transitionTypes={["nav-forward"]}
                  className="flex items-center gap-[12px] rounded-[18px] bg-[#fff6e5] px-[16px] py-[14px] text-[#956013] transition-opacity duration-150 ease-out active:opacity-80"
                >
                  <MaskIcon src="/icons/contract.svg" size={18} />
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="text-[14px] font-semibold">강남역점 근로계약서 대기</span>
                    <span className="text-[12px]">남은 기한 26일</span>
                  </span>
                  <MaskIcon src="/icons/chevron-right-muted.svg" size={12} flipY />
                </Link>
                <TodoSection count={2}>
                  <TodoList>
                    <TickTodo
                      title="환불 요청 처리"
                      meta="지금 바로"
                      badges={
                        <StatusChip tone="warning" weight="semibold">
                          긴급
                        </StatusChip>
                      }
                    />
                    {/* 한 명 수행 TO-DO 를 다른 직원이 끝냈다 — 수행자와 완료 시각을 보이고 되돌릴 수 없다. */}
                    <TodoItem title="마감 정산표 작성" meta="완료 · 이수민님이 09:12에 처리" done />
                  </TodoList>
                </TodoSection>
                <Link
                  href="/demo/notify"
                  transitionTypes={["nav-forward"]}
                  className="flex items-center gap-[12px] rounded-[18px] border border-staff-border-light bg-staff-info-bg px-[16px] py-[14px] transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
                >
                  <Image src="/icons/bell.svg" alt="" width={18} height={18} className="-scale-y-100" />
                  <span className="min-w-0 flex-1 text-[14px]">미확인 알림 3건이 있습니다</span>
                  <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
                </Link>
                <WorkInfo />
              </Sections>
            )}

            {view === "off" && (
              <Sections>
                <div className="flex flex-col gap-[2px] rounded-[18px] border border-staff-border-light bg-staff-info-bg px-[20px] py-[18px]">
                  <p className="text-[16px] font-bold">오늘은 근무가 없는 날입니다</p>
                  <p className="text-[12px] text-staff-text-sub">이번 주 다른 근무일은 아래에서 확인하세요</p>
                </div>
                <ThisWeek days={weekWith(off("09-10", "목", 10))} />
                <section className="flex flex-col gap-[12px]">
                  <SectionTitle title="TO-DO" />
                  <p className="rounded-[18px] border border-staff-border-light bg-staff-info-bg px-[16px] py-[18px] text-center text-[12px] text-staff-text-muted">
                    오늘은 처리할 TO-DO가 없습니다
                  </p>
                </section>
                <WorkInfo />
              </Sections>
            )}

            {/* 연결 보류는 승인 전이라 계약서·근무 정보를 아예 보이지 않고, 가입 직후는 연결은 끝났고 근무만 아직 없다 — 다른 상태다. */}
            {view === "held" && (
              <Empty icon={<MaskIcon src="/icons/history.svg" size={24} flipY />} title="관리자가 소속 연결을 확인하고 있습니다">
                <p>
                  가입할 때 인증한 번호가 등록된 연락처와 달라 자동으로 연결되지 않았습니다. 담당 관리자가 연락해 확인한 뒤 연결을 승인합니다.
                </p>
                <p className="text-[12px] text-staff-text-muted">연결이 승인되기 전에는 근로계약서와 근무 정보가 표시되지 않습니다</p>
              </Empty>
            )}

            {view === "empty" && (
              <Empty icon={<MaskIcon src="/icons/nav-work.svg" size={24} flipY />} title="아직 쌓인 근무 정보가 없습니다">
                <p>웨일카페 홍대점과 연결되었습니다. 관리자가 근무스케줄을 등록하면 이 화면에 오늘 근무와 이번 주 근무가 표시됩니다.</p>
              </Empty>
            )}

            {view === "retired" && (
              <Empty icon={<MaskIcon src="/icons/store.svg" size={24} flipY />} title="근무지가 없습니다">
                <p className="[&_strong]:font-bold [&_strong]:text-staff-text">
                  연결된 근무지가 없습니다. 근무와 출퇴근 화면도 같은 안내를 보여 줍니다. 받은 급여명세서는 <strong>급여 탭</strong>에서,
                  알림은 위쪽 종에서 계속 볼 수 있습니다.
                </p>
                <div className="flex flex-col gap-[8px] pt-[8px]">
                  <Button variant="outline" href="/demo/pay" transitionTypes={["nav-forward"]}>
                    <MaskIcon src="/icons/nav-pay.svg" size={16} flipY />
                    급여 탭으로 가기
                  </Button>
                  <p className="text-[12px] text-staff-text-muted">보존 기간인 3년 동안 조회할 수 있습니다.</p>
                </div>
              </Empty>
            )}
          </main>

          {/* 하단 메뉴는 모든 상태에서 그대로(HOME-5). 화면 아래에 붙여 둔다. */}
          <div className="sticky bottom-0 mt-auto">
            <BottomNav current={HOME} items={DEMO_NAV_ITEMS} />
          </div>
        </div>
      </PageSlide>

      {/* 근무지 고르기(Figma 03.Sheet). 고른 근무지를 근무·출퇴근 현황·급여·알림이 모두 따른다(HOME-2). 최근 선택이 곧 지금 근무지다. */}
      <BottomSheet open={sheet === "store"} onClose={handleSheetClose} title="근무지 고르기" description="최근에 고른 근무지가 기본으로 표시됩니다.">
        {STORES.map((s) => (
          <SheetOption key={s} selected={s === store} onClick={() => handleStorePick(s)}>
            {s}
            {s === store && <span className="text-[12px] font-normal text-staff-text-muted">최근 선택</span>}
          </SheetOption>
        ))}
      </BottomSheet>

      {/* 날인 요청 팝업(HOME-1·4). 서명 대기 근로계약서가 도착하면 홈 위에 띄우고, 날인하기 전까지 앱을 열 때마다 다시 띄운다. */}
      <BottomSheet open={sheet === "sign-req"} onClose={handleSheetClose} title="날인할 계약서가 도착했습니다" closeLabel="나중에">
        <dl className="flex flex-col divide-y divide-[#f5e3c0] rounded-[12px] bg-[#fff6e5] px-[14px] py-[4px]">
          {[
            ["근무지", "웨일카페 강남역점"],
            ["고용 형태", "파트타이머"],
            ["날인 기한", "2026-10-11 · 26일 남음"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-[12px] py-[10px]">
              <dt className="shrink-0 text-[13px] font-semibold text-[#956013]">{k}</dt>
              <dd className="min-w-0 flex-1 text-right text-[13px]">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[14px] text-staff-text-sub">날인해야 근무가 시작됩니다. 지금 확인하지 않아도 계약서 화면에서 다시 볼 수 있습니다.</p>
        <Button href={CONTRACT} transitionTypes={["nav-forward"]}>
          <MaskIcon src="/icons/contract.svg" size={14} />
          날인하러 가기
        </Button>
      </BottomSheet>

      {toast}
    </>
  );
}

// 묶음 사이 20(Figma 02.Main), 하단 메뉴와는 24.
function Sections({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-[20px]">{children}</div>;
}

// 근무지 선택기가 없는 상태의 머리줄. TopBar 와 같은 자리·크기로 로고 · 이름(누를 수 없음) · 알림 버튼(있을 때만)을 둔다.
function PlainTopBar({ title, bell }: { title?: string; bell: boolean }) {
  return (
    <header className="flex min-h-[44px] w-full items-center gap-[10px]">
      <span className="relative size-[36px] shrink-0">
        <Image src="/icons/logo-whale-small.svg" alt="" width={36.193} height={27.446} className="absolute top-[8.75px] left-0" />
        <Image src="/icons/logo-stars-small.svg" alt="" width={17.494} height={12.668} className="absolute top-0 left-[5.43px]" />
      </span>
      <p className="min-w-0 flex-1 truncate text-[15px] font-bold">{title}</p>
      {bell && (
        <Link
          href="/demo/notify"
          transitionTypes={["nav-forward"]}
          aria-label="알림"
          className="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] border border-[#e9edf3] bg-white transition-colors duration-150 ease-out active:bg-staff-info-bg"
        >
          <Image src="/icons/bell.svg" alt="" width={21} height={21} className="-scale-y-100" />
        </Link>
      )}
    </header>
  );
}

// 오늘의 근무(Figma node 9:152). 홈에만 있는 카드라 /design/home 과 같은 모양을 여기 그린다. 출근 전이라 버튼은 출근하기(HOME-3).
// #DBE5FF·#BCCFFF 는 남보라 위의 흐린 글자, 그림자는 남보라를 옅게 깐 것이다.
function TodayCard({ time: [start, end] }: { time: [string, string] }) {
  return (
    <section
      aria-label="오늘 근무"
      className="flex flex-col gap-[4px] rounded-[18px] bg-staff-primary px-[23px] pt-[24px] pb-[23px] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"
    >
      <p className="text-[12px] text-[#dbe5ff]">오늘 근무</p>
      <p className="flex h-[46px] items-center gap-[4px] text-[30px] font-bold tracking-[-0.025em]">
        {start}
        <span className="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>
        {end}
      </p>
      <p className="flex items-center gap-[6px] pb-[15px] text-[12px] text-[#dbe5ff]">
        휴게 60분 <span className="text-[11px]">·</span> 총 8시간 근무
      </p>
      <Link
        href={CHECK_IN}
        transitionTypes={["nav-forward"]}
        className="flex min-h-[48px] items-center justify-center gap-[8px] rounded-[12px] bg-white px-[18px] text-[15px] font-bold text-staff-primary transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
      >
        출근하기
        <Image src="/icons/arrow-right-brand.svg" alt="" width={14} height={12} />
      </Link>
    </section>
  );
}

// 이번 주 근무(Figma node 9:242). 월~일, 한국 표준시 기준. 처음 고른 날은 오늘.
function ThisWeek({ days }: { days: WeekDay[] }) {
  const [day, setDay] = useState("09-10");
  return (
    <section className="flex flex-col gap-[13px]">
      <SectionTitle title="이번 주 근무">
        <span className="text-[14px] text-staff-text-sub">9/7 (월) – 9/13 (일)</span>
      </SectionTitle>
      <div className="flex flex-col gap-[13px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">
        <WeekSelector days={days} selected={day} onSelect={setDay} />
        <p className="border-t border-staff-border-light pt-[12px] text-[12px] text-staff-text-sub">이번 주는 월요일부터 일요일까지, 한국 표준시 기준입니다</p>
      </div>
    </section>
  );
}

// TO-DO 카드. 오른쪽 위 「TO-DO 목록」으로 근무 화면의 TO-DO 쪽에 바로 간다(HOME-1).
function TodoSection({ count, children }: { count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[12px]">
      <SectionTitle title="TO-DO" count={count}>
        <Link
          href="/demo/work#todo"
          transitionTypes={["nav-forward"]}
          className="-my-[13px] flex min-h-[44px] items-center gap-[2px] text-[12px] text-staff-text-sub"
        >
          TO-DO 목록
          <Image src="/icons/chevron-right-small.svg" alt="" width={11} height={11} className="-scale-y-100" />
        </Link>
      </SectionTitle>
      <div className="rounded-[18px] border border-staff-border-light bg-white px-[16px]">{children}</div>
    </section>
  );
}

// 홈에서 바로 완료 처리하는 TO-DO 한 줄. 데모라 체크 상태만 바뀐다.
function TickTodo({ title, meta, badges }: { title: string; meta: string; badges?: ReactNode }) {
  const [done, setDone] = useState(false);
  return <TodoItem title={title} meta={meta} done={done} onToggle={setDone} badges={badges} />;
}

// 근무 정보(Figma 「나의 근무 정보」 줄 모양). 요약만 보이고 자세한 것은 각 화면에서 본다.
function WorkInfo() {
  return (
    <section className="flex flex-col gap-[12px]">
      <SectionTitle title="근무 정보" />
      <InfoRow href="/demo/work" icon="/icons/menu-schedule.svg" title="근무스케줄" description="이번 달 근무 12일" />
      <InfoRow href="/demo/attendance" icon="/icons/menu-attendance.svg" title="출퇴근 현황" description="이번 달 출근 9회 · 지각 0회" />
      <InfoRow href="/demo/pay" icon="/icons/menu-payslip.svg" title="급여명세서" description="2026년 8월분 발송됨" />
    </section>
  );
}
