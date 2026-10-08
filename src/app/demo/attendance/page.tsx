"use client";

// 직원 근무 앱 데모 · 출퇴근 현황(/demo/attendance). 기준 목업: docs/mockup/app/attendance-history.html —
// 상태 5개(이번 주 · 기간별 · 확인 필요 섞임 · 기록 없음 · 근무지 없음)와 시트 4개(보정 · 대신 등록 · 출근 위치 확인 실패 · 퇴근 기록 없음),
// 화면 문구·가짜 값을 옮겼다. 쟁점 HIST-1(보정·대신 등록은 연필 표시 + 상세 시트), HIST-2(이번 주 / 기간별 탭, 기간별은 이번 달 기본 ·
// 한 번에 최대 1년), HIST-3(확인 필요는 보기만 + 점포 안내), HIST-4(퇴근 기록 없음은 확인 필요가 아닌 별도 표시, 2026-10-08)는
// 모두 확정이고 목업이 그린 그대로다.
// 이번 주(week)는 Figma 05.출퇴근 현황(node 12:1233)을 따른다 — 다만 HIST-2 에 따라 탭 이름은 「기간별」이고 주 이동 줄(PeriodNav)은 두지 않는다.
// 그 밖 상태와 시트는 Figma 없음 — DESIGN.md 기준 초안.
// 목업과 달리 한 곳: 목업 이번 주의 대신 등록 카드가 「토 9/12」로 두 번 나오고 아직 오지 않은 날이라, 지난 쉬는 날이던 월 9/7 에 두고
// 시트의 등록 시각도 그날(9월 7일 18:05)로 맞췄다. 직원이 고칠 수단은 어디에도 없다 — 보정은 관리자 웹의 일이다.

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  BottomNav,
  AttendanceDayCard,
  BottomSheet,
  Button,
  Card,
  DayOffRow,
  MaskIcon,
  Notice,
  PageHeader,
  SegmentedControl,
  StatusChip,
  WorkTimeBar,
  segmentTabId,
} from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DEMO_NAV_ITEMS, DemoStates, Sunken, useDemoState, useToast, Values, type DemoState } from "../_components";

// 목업 오른쪽 상태 목록 순서 그대로. 시트 넷은 목업에서 카드를 눌러 여는 것이라 데모 도구에서도 열 수 있게 뒤에 붙였다.
const STATES: DemoState[] = [
  { id: "week", label: "이번 주", note: "기본 상태" },
  { id: "period", label: "기간별", note: "시작일–종료일" },
  { id: "flagged", label: "확인 필요 섞임", note: "위치 실패·퇴근 기록 없음" },
  { id: "empty", label: "기록 없음", note: "빈 상태" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "editInfo", label: "보정 기록", note: "시트 · 수 9/9 연필 표시" },
  { id: "proxyInfo", label: "대신 등록 기록", note: "시트 · 월 9/7 연필 표시" },
  { id: "flagTue", label: "출근 위치 확인 실패", note: "시트 · 확인 필요" },
  { id: "flagWed", label: "퇴근 기록 없음", note: "시트 · 수 9/9" },
];
type Sheet = "editInfo" | "proxyInfo" | "flagTue" | "flagWed";
// 시트마다 뒤에 깔리는 상태.
const SHEET_BASE: Record<Sheet, string> = { editInfo: "week", proxyInfo: "week", flagTue: "flagged", flagWed: "flagged" };
const isSheet = (id: string): id is Sheet => id in SHEET_BASE;

const HOME = "/demo/home";
const CHECK_IN = "/demo/check-in";
const STORE = "웨일카페 강남역점";
const PANEL = "attendance-panel";

// 한 번에 고를 수 있는 폭이 1년이라 시작일·종료일 서로의 min·max 를 1년으로 묶는다(날짜 고르기가 그 밖을 막는다).
// ponytail: 문자열의 연도만 바꾼다. 2월 29일이면 max 가 없는 날짜가 되어 브라우저가 제한을 무시한다.
const shiftYear = (date: string, years: number) => `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;

export default function DemoAttendancePage() {
  const [state, go] = useDemoState(STATES);
  const [openedSheet, setOpenedSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useToast();

  const sheet = openedSheet ?? (isSheet(state) ? state : null);
  const view = isSheet(state) ? SHEET_BASE[state] : state;
  const tab = view === "period" ? "period" : "week";

  const handleTabChange = (next: "week" | "period") => {
    if (next === tab) return;
    if (next === "period") go("period", "nav-forward");
    else go("week", "nav-back");
  };
  const handleSheetClose = () => {
    setOpenedSheet(null);
    if (isSheet(state)) go(SHEET_BASE[state], "nav-back");
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={go} />

      <PageSlide>
        <div className="flex flex-1 flex-col leading-[1.5]">
          <PageHeader
            title="출퇴근 현황"
            backHref={HOME}
            action={
              <Link
                href={CHECK_IN}
                transitionTypes={["nav-forward"]}
                aria-label="출퇴근 등록"
                className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center"
              >
                <Image src="/icons/history.svg" alt="" width={21} height={21} className="-scale-y-100" />
              </Link>
            }
          />

          <main className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px]">
            {view !== "nosite" && (
              <SegmentedControl
                label="기간"
                panelId={PANEL}
                value={tab}
                onChange={handleTabChange}
                items={[
                  { value: "week", label: "이번 주" },
                  { value: "period", label: "기간별" },
                ]}
              />
            )}

            <PageSlide key={view}>
              <div
                className="flex flex-1 flex-col gap-[20px]"
                {...(view !== "nosite" && { id: PANEL, role: "tabpanel", "aria-labelledby": segmentTabId(PANEL, tab) })}
              >
                {view === "week" && <WeekView onOpen={setOpenedSheet} />}
                {view === "period" && <PeriodView onSearch={() => setToast("기간 기록을 불러왔습니다")} />}
                {view === "flagged" && <FlaggedView onOpen={setOpenedSheet} />}
                {view === "empty" && (
                  <Empty icon="/icons/history.svg" title="등록된 출퇴근 기록이 없습니다">
                    근무를 시작하면 이곳에 기록이 쌓입니다.
                  </Empty>
                )}
                {view === "nosite" && (
                  <Empty icon="/icons/store.svg" title="근무지가 없습니다">
                    연결된 근무지가 없어 출퇴근 기록을 보여 줄 수 없습니다. 지난 기록은 관리자에게 문의해 주세요.
                  </Empty>
                )}
              </div>
            </PageSlide>
          </main>
        </div>
      </PageSlide>

      {/* 하단 메뉴 다섯 칸(2026-10-08 재영 결정)의 출퇴근 칸 화면이라 다른 칸 화면처럼 아래에 붙인다. */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/demo/check-in" items={DEMO_NAV_ITEMS} />
      </div>

      <BottomSheet open={sheet === "editInfo"} onClose={handleSheetClose} title="관리자가 수정한 기록입니다">
        <Sunken>
          <Values
            rows={[
              ["수정 전 퇴근", "17:48"],
              ["수정 후 퇴근", "18:02"],
              ["수정자", "박지수 매니저"],
              ["수정 시각", "9월 9일 22:10"],
              ["사유", "퇴근 시각 미태깅 정정"],
            ]}
          />
        </Sunken>
        <p className="text-[12px] text-staff-text-muted">수정은 관리자 웹에서만 할 수 있습니다. 이 화면은 이력 조회만 제공합니다.</p>
      </BottomSheet>

      <BottomSheet
        open={sheet === "proxyInfo"}
        onClose={handleSheetClose}
        title="관리자가 대신 등록한 기록입니다"
        description="위치정보 동의가 없어 앱으로 등록할 수 없는 경우입니다. 근무지 관리자가 출퇴근 시각을 대신 등록했습니다."
      >
        <Sunken>
          <Values
            rows={[
              ["출근 · 퇴근", "09:00 · 18:00"],
              ["등록한 사람", "박지수 매니저"],
              ["등록 시각", "9월 7일 18:05"],
              ["사유", "위치정보 동의 없음"],
            ]}
          />
        </Sunken>
        <p className="text-[12px] text-staff-text-muted">
          기록이 다르면 근무지 점포에 말씀해 주세요. 앱에서 직접 등록하려면 위치정보 수집에 다시 동의해야 합니다.
        </p>
      </BottomSheet>

      <BottomSheet
        open={sheet === "flagTue"}
        onClose={handleSheetClose}
        title="출근 위치 확인 실패"
        description="오차가 매장 범위보다 넓어 매장 안인지 자동으로 확인하지 못했습니다. 출근 시각 09:58은 등록되었고 관리자가 검토하고 있습니다."
      >
        <StoreNotice />
      </BottomSheet>

      <BottomSheet
        open={sheet === "flagWed"}
        onClose={handleSheetClose}
        title="퇴근 기록 없음"
        description="09:14에 출근한 기록만 있고 퇴근 기록이 없습니다. 퇴근을 찍지 못했다면 근무지 관리자에게 문의해 주세요. 관리자가 퇴근 시각을 보정하면 이 표시는 사라집니다."
      >
        <Notice icon={<MaskIcon src="/icons/store-small.svg" size={16} />}>
          <strong>근무지 관리자에게 문의</strong>해 주세요. 앱에서 직접 고칠 수는 없습니다.
        </Notice>
      </BottomSheet>

      {toast}
    </>
  );
}

// 이번 주 — Figma node 12:1233 의 하루 카드 그대로. 연필 표시가 있는 카드(대신 등록 · 보정)는 눌러 시트를 연다.
function WeekView({ onOpen }: { onOpen: (sheet: Sheet) => void }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <Pressable label="월 9/7 대신 등록 정보 보기" onClick={() => onOpen("proxyInfo")}>
        <AttendanceDayCard
          state="done"
          day="월 9/7"
          store={STORE}
          edited
          status={{ label: "대신 등록", tone: "neutral" }}
          schedule={{ start: "09:00", end: "18:00" }}
          worked={{ start: "09:00", end: "18:00" }}
          summary="출근 09:00 · 퇴근 18:00"
        />
      </Pressable>
      <AttendanceDayCard
        state="done"
        day="화 9/8"
        store={STORE}
        status={{ label: "정상", tone: "success" }}
        schedule={{ start: "09:00", end: "18:00" }}
        worked={{ start: "08:58", end: "18:00" }}
        summary="출근 08:58 · 퇴근 18:00"
      />
      <Pressable label="수 9/9 수정 이력 보기" onClick={() => onOpen("editInfo")}>
        <AttendanceDayCard
          state="done"
          day="수 9/9"
          store={STORE}
          edited
          status={{ label: "지각 14분", tone: "warning" }}
          schedule={{ start: "09:00", end: "18:00" }}
          worked={{ start: "09:14", end: "18:02" }}
          summary="출근 09:14 · 퇴근 18:02"
        />
      </Pressable>
      <TodayCard />
      <AttendanceDayCard
        state="upcoming"
        day="금 9/11"
        store={STORE}
        schedule={{ start: "09:00", end: "18:00" }}
        summary="아직 근무 전입니다 · 예정 09:00 – 18:00"
      />
      <AttendanceDayCard
        state="upcoming"
        day="토 9/12"
        store={STORE}
        schedule={{ start: "13:00", end: "22:00" }}
        summary="아직 근무 전입니다 · 예정 13:00 – 22:00"
      />
      <DayOffRow label="일 9/13 · 휴무" />
    </div>
  );
}

function TodayCard() {
  return (
    <AttendanceDayCard
      state="today"
      day="목 9/10"
      store={STORE}
      status={{ label: "근무 중", tone: "working" }}
      schedule={{ start: "09:00", end: "18:00" }}
      worked={{ start: "09:02", end: "14:00" }}
      ongoing
      summary="출근 09:02 · 퇴근 진행 중"
    />
  );
}

// 기간별 — 시작일·종료일을 직접 고른다. 들어오면 이번 달(9월)이 잡혀 있다. 누계·주별 줄은 목업의 고정 값이다.
function PeriodView({ onSearch }: { onSearch: () => void }) {
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-09-30");
  return (
    <>
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">기간 고르기</p>
        <div className="flex items-center gap-[8px] pt-[8px]">
          <input
            type="date"
            aria-label="시작일"
            value={from}
            min={shiftYear(to, -1)}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className={FIELD}
          />
          <span aria-hidden className="text-[12px] text-staff-text-muted">
            –
          </span>
          <input
            type="date"
            aria-label="종료일"
            value={to}
            min={from}
            max={shiftYear(from, 1)}
            onChange={(e) => setTo(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="pt-[8px]">
          <Button onClick={onSearch}>조회</Button>
        </div>
        <p className="pt-[8px] text-[12px] text-staff-text-muted [&_b]:font-bold">
          기본은 이번 달입니다. 한 번에 <b>최대 1년</b>까지 고를 수 있습니다.
        </p>
      </Card>

      <Sunken>
        <p className="text-[13px] font-semibold text-staff-text-sub">고른 기간 누계 · 9월 1일 – 30일</p>
        <div className="flex flex-wrap items-baseline gap-x-[14px] pt-[6px]">
          <p className="text-[28px] font-bold [&_span]:text-[17px]">
            63<span>시간</span> 16<span>분</span>
          </p>
          <span className="text-[12px] text-staff-text-sub">지각 1회 · 연장 1시간 20분</span>
        </div>
      </Sunken>

      <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
        <WeekRow title="9월 1주 · 8/31 – 9/6" sub="근무 5일 · 40시간 12분 · 지각 0 · 연장 1시간 20분" />
        <WeekRow title="9월 2주 · 9/7 – 9/13" sub="이번 주 · 진행 중 · 23시간 04분 · 지각 1회" current />
        <WeekRow title="9월 3주 · 9/14 – 9/20" sub="예정 · 아직 근무 전입니다" upcoming />
        <WeekRow title="9월 4주 · 9/21 – 9/27" sub="예정 · 아직 근무 전입니다" upcoming />
      </ul>

      <p className="text-[12px] text-staff-text-muted">기록은 3년 보존됩니다. 1년은 한 번에 조회하는 폭의 제한입니다.</p>
    </>
  );
}

// 주별 한 줄. 이번 주는 지금 근무 중이라 설명을 남보라로, 아직 오지 않은 주는 흐리게(목업 opacity 0.55).
function WeekRow({ title, sub, current = false, upcoming = false }: { title: string; sub: string; current?: boolean; upcoming?: boolean }) {
  return (
    <li className={`flex flex-col gap-[2px] py-[14px] ${upcoming ? "opacity-55" : ""}`}>
      <p className={`text-[14px] font-semibold ${upcoming ? "text-staff-text-muted" : ""}`}>{title}</p>
      <p className={`text-[12px] ${current ? "text-staff-primary" : "text-staff-text-sub"}`}>{sub}</p>
    </li>
  );
}

// 확인 필요가 섞인 이번 주. 꼬리표가 붙은 카드와 퇴근 기록 없음 카드는 눌러 시트를 연다. 직원이 누를 처리 버튼은 없다(HIST-3).
function FlaggedView({ onOpen }: { onOpen: (sheet: Sheet) => void }) {
  return (
    <>
      <div className="flex gap-[6px] rounded-[12px] border border-[#f6e3bd] bg-[#fff6e5] p-[14px] text-[13px] text-[#6f4608] [&_strong]:font-bold">
        <WarningIcon />
        <p className="min-w-0 flex-1">
          <strong>확인이 필요한 기록이 1건 있습니다.</strong>
          <br />
          관리자가 확인 중입니다. 기록이 다르면 <strong>근무지 점포에 말씀해 주세요.</strong> 확인이 끝나면 이 표시와 사유는 사라집니다.
        </p>
      </div>
      <div className="flex flex-col gap-[8px]">
        <DayOffRow label="월 9/7 · 휴무" />
        <FlaggedDayCard
          day="화 9/8"
          summary="출근 위치 확인 실패 · 09:58 등록됨"
          worked={{ start: "09:58", end: "18:00" }}
          onClick={() => onOpen("flagTue")}
        />
        {/* 퇴근 기록 없음(HIST-4): 확인 필요 사유가 아니라 그 날 카드에 붙는 별도 표시라 일반 카드에 둔다. */}
        <Pressable label="수 9/9 퇴근 기록 없음 보기" onClick={() => onOpen("flagWed")}>
          <AttendanceDayCard
            state="done"
            day="수 9/9"
            store={STORE}
            status={{ label: "퇴근 기록 없음", tone: "neutral" }}
            schedule={{ start: "09:00", end: "18:00" }}
            summary="출근 09:14 · 퇴근 기록 없음 · 근무지 관리자에게 문의"
          />
        </Pressable>
        <TodayCard />
      </div>
    </>
  );
}

// 확인 필요 꼬리표가 붙은 하루 카드. 모양은 AttendanceDayCard(radius 18 · 위 20 좌우 20 아래 32 · 사이 3)와 같고,
// 바탕·글자만 경고 칩(StatusChip warning)과 같은 호박색 계열이다(칩이 묻히지 않게 바탕은 칩보다 한 단계 옅다) — 목업 card--amber, 이 카드에만 나와 토큰으로 두지 않는다.
// 카드 전체가 사유 시트를 여는 버튼이다. 공통으로 올린다면 AttendanceDayCard 의 state 에 "flagged" 를 더하는 쪽이다.
function FlaggedDayCard({
  day,
  summary,
  worked,
  onClick,
}: {
  day: string;
  summary: string;
  worked?: { start: string; end: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-[3px] rounded-[18px] border border-[#f6e3bd] bg-[#fffbf2] px-[20px] pt-[20px] pb-[32px] text-left text-[#6f4608] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-[#fff3dc]"
    >
      <span className="flex w-full items-center gap-[8px] pb-[5px]">
        <span className="min-w-0 flex-1 text-[13px] font-bold">{day}</span>
        <span className="truncate text-[12px]">{STORE}</span>
        <StatusChip tone="warning">확인 필요</StatusChip>
      </span>
      <WorkTimeBar schedule={{ start: "09:00", end: "18:00" }} worked={worked} />
      <span className="pt-[2px] text-[13px]">{summary}</span>
    </button>
  );
}

// 연필 표시가 있는 카드 위에 덮는 투명 버튼. 연필(11px)만 누르게 하면 44px 를 못 채워 카드 전체를 누르는 칸으로 둔다.
function Pressable({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="absolute inset-0 rounded-[18px] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary/5"
      />
    </div>
  );
}

// 확인 필요 시트의 점포 안내(HIST-3 확정 문구).
function StoreNotice() {
  return (
    <Notice icon={<MaskIcon src="/icons/store-small.svg" size={16} />}>
      관리자가 확인 중입니다. 기록이 다르면 <strong>근무지 점포에 말씀해 주세요.</strong> 확인이 끝나면 이 표시와 사유는 사라집니다.
    </Notice>
  );
}

// 빈 화면(기록 없음 · 근무지 없음). 가운데에 아이콘 · 제목(Title 2) · 설명.
function Empty({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">
      <span className="flex pb-[6px] text-staff-text-muted">
        <MaskIcon src={icon} size={40} flipY />
      </span>
      <h2 className="text-[18px] font-bold">{title}</h2>
      <p className="max-w-[250px] text-[14px] text-staff-text-sub">{children}</p>
    </div>
  );
}

// 경고 아이콘(목업 ph-warning). 저장소에 맞는 SVG 가 없어 여기서만 그린다. 20px 칸 가운데.
function WarningIcon() {
  return (
    <span aria-hidden className="flex w-[20px] shrink-0 items-start justify-center pt-[2px]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M7.13 1.5a1 1 0 0 1 1.74 0l6.5 11.5A1 1 0 0 1 14.5 14.5h-13a1 1 0 0 1-.87-1.5zM7.25 6v4h1.5V6zm.75 5.25a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8" />
      </svg>
    </span>
  );
}
