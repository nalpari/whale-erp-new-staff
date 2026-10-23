"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttendanceDayCard, BottomSheet, Button, Card, DayOffRow, MaskIcon, Notice, SegmentedControl, StatusChip, WorkTimeBar, segmentTabId } from "@/components/common";
import { EASE_OUT, FIELD } from "@/components/common/theme";
import {
  addDays,
  barOf,
  dayLabel,
  durationLabel,
  editRows,
  flagDescription,
  flagsOf,
  flagTitle,
  isEdited,
  MAX_PERIOD_DAYS,
  periodTotals,
  rangeLabel,
  statusChipOf,
  summaryOf,
  weekDays,
  weekRows,
  type MyAttendanceDay,
} from "@/lib/attendance-history";
import type { MyAttendanceRecords } from "@/lib/my-attendance";
import { Sunken, Values } from "../check-in/check-in-parts";

type Tab = "week" | "period";
type Sheet = { kind: "edits" | "flag" | "missing-out"; day: MyAttendanceDay } | null;

const PANEL = "attendance-panel";
const STORE_NOTICE = (
  <>
    관리자가 확인 중입니다. 기록이 다르면 <strong>근무지 점포에 말씀해 주세요.</strong> 확인이 끝나면 이 표시와 사유는 사라집니다.
  </>
);

/** 출퇴근 현황 본문 — 탭 · 이번 주 카드 · 기간별 누계와 주별 줄 · 시트(데모 attendance 의 상태 · 시트 그대로) */
/** now 는 서버가 그린 시각(ISO) — 근무 중 막대 끝을 서버 · 브라우저가 같게 그린다 */
export function AttendanceHistoryScreen({ tab, records, today, weekStart, now }: { tab: Tab; records: MyAttendanceRecords; today: string; weekStart: string; now: string }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);

  return (
    <main className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
      <SegmentedControl
        label="기간"
        panelId={PANEL}
        value={tab}
        items={[
          { value: "week", label: "이번 주" },
          { value: "period", label: "기간별" },
        ]}
        onChange={(next) => {
          if (next !== tab) router.push(next === "period" ? "/attendance?tab=period" : "/attendance");
        }}
      />
      <div id={PANEL} role="tabpanel" aria-labelledby={segmentTabId(PANEL, tab)} className="flex flex-1 flex-col gap-[20px]">
        {tab === "week" ? (
          <WeekView records={records} today={today} weekStart={weekStart} now={now} onOpen={setSheet} />
        ) : (
          <PeriodView records={records} today={today} />
        )}
      </div>
      <DaySheets sheet={sheet} onClose={close} />
    </main>
  );
}

function WeekView({ records, today, weekStart, now, onOpen }: { records: MyAttendanceRecords; today: string; weekStart: string; now: string; onOpen: (s: Sheet) => void }) {
  if (records.items.length === 0) return <EmptyRecords />;
  const flagCount = records.items.reduce((n, d) => n + flagsOf(d).length, 0);
  return (
    <>
      {flagCount > 0 && (
        <div className="flex gap-[6px] rounded-[12px] border border-[#f6e3bd] bg-[#fff6e5] p-[14px] text-[13px] text-[#6f4608] [&_strong]:font-bold">
          <WarningIcon />
          <p className="min-w-0 flex-1">
            <strong>확인이 필요한 기록이 {flagCount}건 있습니다.</strong>
            <br />
            {STORE_NOTICE}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-[8px]">
        {weekDays(weekStart, records.items).map(({ date, day }) =>
          day ? <DayCard key={date} day={day} store={records.storeName} today={today} now={now} onOpen={onOpen} /> : <DayOffRow key={date} label={`${dayLabel(date)} · 휴무`} />,
        )}
      </div>
    </>
  );
}

function DayCard({ day, store, today, now, onOpen }: { day: MyAttendanceDay; store: string; today: string; now: string; onOpen: (s: Sheet) => void }) {
  const bar = barOf(day, new Date(now));
  const flags = flagsOf(day);
  // 확인 필요 꼬리표가 붙은 날 — 호박색 카드 전체가 사유 시트를 연다(데모 flaggedDayCard). 직원이 누를 처리 버튼은 없다(HIST-3).
  if (flags.length > 0)
    return (
      <button
        type="button"
        onClick={() => onOpen({ kind: "flag", day })}
        className={`flex w-full flex-col gap-[3px] rounded-[18px] border border-[#f6e3bd] bg-[#fffbf2] px-[20px] pt-[20px] pb-[32px] text-left text-[#6f4608] transition-[background-color] duration-150 ${EASE_OUT} active:bg-[#fff3dc]`}
      >
        <span className="flex w-full items-center gap-[8px] pb-[5px]">
          <span className="min-w-0 flex-1 text-[13px] font-bold">{dayLabel(day.date)}</span>
          <span className="truncate text-[12px]">{store}</span>
          <StatusChip tone="warning">확인 필요</StatusChip>
        </span>
        <WorkTimeBar {...bar} />
        <span className="pt-[2px] text-[13px]">{flags.map((f) => `${flagTitle(f)} · ${f.time} 등록됨`).join(" / ")}</span>
      </button>
    );

  const state = day.date < today ? "done" : day.date === today ? "today" : "upcoming";
  const card = (
    <AttendanceDayCard
      state={state}
      day={dayLabel(day.date)}
      store={store}
      status={statusChipOf(day, today)}
      edited={isEdited(day)}
      summary={summaryOf(day, today)}
      {...bar}
    />
  );
  // 연필(보정 · 대신 등록, HIST-1)과 퇴근 기록 없음(HIST-4) 카드는 눌러 시트를 연다. 연필만으로는 44px 를 못 채워 카드 전체를 덮는다.
  const sheet: Sheet = isEdited(day) ? { kind: "edits", day } : day.status === "MISSING_CHECK_OUT" ? { kind: "missing-out", day } : null;
  if (!sheet) return card;
  return (
    <div className="relative">
      {card}
      <button
        type="button"
        aria-label={`${dayLabel(day.date)} ${sheet.kind === "edits" ? "수정 이력 보기" : "퇴근 기록 없음 보기"}`}
        onClick={() => onOpen(sheet)}
        className={`absolute inset-0 rounded-[18px] transition-[background-color] duration-150 ${EASE_OUT} active:bg-staff-primary/5`}
      />
    </div>
  );
}

function DaySheets({ sheet, onClose }: { sheet: Sheet; onClose: () => void }) {
  const day = sheet?.day;
  const edits = day?.edits ?? [];
  const proxy = edits[0]?.kind === "PROXY";
  const flags = day ? flagsOf(day) : [];
  const firstIn = day?.pairs.find((p) => p.checkIn)?.checkIn?.time;
  return (
    <>
      <BottomSheet
        open={sheet?.kind === "edits"}
        onClose={onClose}
        title={proxy ? "관리자가 대신 등록한 기록입니다" : "관리자가 수정한 기록입니다"}
        description={proxy ? "위치정보 동의가 없어 앱으로 등록할 수 없는 경우입니다. 근무지 관리자가 출퇴근 시각을 대신 등록했습니다." : undefined}
      >
        {edits.map((e) => (
          <Sunken key={`${e.at}-${e.kind}`}>
            <Values rows={editRows(e)} />
          </Sunken>
        ))}
        <p className="text-[12px] text-staff-text-muted">
          {proxy
            ? "기록이 다르면 근무지 점포에 말씀해 주세요. 앱에서 직접 등록하려면 위치정보 수집에 다시 동의해야 합니다."
            : "수정은 관리자 웹에서만 할 수 있습니다. 이 화면은 이력 조회만 제공합니다."}
        </p>
      </BottomSheet>
      <BottomSheet
        open={sheet?.kind === "flag"}
        onClose={onClose}
        title={flags.length === 1 ? flagTitle(flags[0]) : "확인이 필요한 기록"}
        description={flags.length === 1 ? flagDescription(flags[0]) : undefined}
      >
        {flags.length > 1 &&
          flags.map((f) => (
            <Sunken key={`${f.kind}-${f.time}`} label={flagTitle(f)} prose>
              {flagDescription(f)}
            </Sunken>
          ))}
        <Notice icon={<MaskIcon src="/icons/store-small.svg" size={16} />}>{STORE_NOTICE}</Notice>
      </BottomSheet>
      <BottomSheet
        open={sheet?.kind === "missing-out"}
        onClose={onClose}
        title="퇴근 기록 없음"
        description={`${firstIn ?? "-"}에 출근한 기록만 있고 퇴근 기록이 없습니다. 퇴근을 찍지 못했다면 근무지 관리자에게 문의해 주세요. 관리자가 퇴근 시각을 보정하면 이 표시는 사라집니다.`}
      >
        <Notice icon={<MaskIcon src="/icons/store-small.svg" size={16} />}>
          <strong>근무지 관리자에게 문의</strong>해 주세요. 앱에서 직접 고칠 수는 없습니다.
        </Notice>
      </BottomSheet>
    </>
  );
}

function PeriodView({ records, today }: { records: MyAttendanceRecords; today: string }) {
  const totals = periodTotals(records.items.filter((d) => d.date <= today));
  return (
    <>
      <PeriodPicker from={records.from} to={records.to} />
      <Sunken label={`고른 기간 누계 · ${rangeLabel(records.from, records.to)}`}>
        <div className="flex flex-wrap items-baseline gap-x-[14px]">
          <p className="text-[28px] font-bold [&_span]:text-[17px]">
            {Math.floor(totals.workedMinutes / 60)}
            <span>시간</span> {String(totals.workedMinutes % 60).padStart(2, "0")}
            <span>분</span>
          </p>
          <span className="text-[12px] text-staff-text-sub">
            지각 {totals.late}회{totals.overtimeMinutes ? ` · 연장 ${durationLabel(totals.overtimeMinutes)}` : ""}
          </span>
        </div>
      </Sunken>
      {records.items.length === 0 ? (
        <EmptyRecords />
      ) : (
        <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
          {weekRows(records.from, records.to, records.items, today).map((w) => (
            <li key={w.title} className={`flex flex-col gap-[2px] py-[14px] ${w.upcoming ? "opacity-55" : ""}`}>
              <p className={`text-[14px] font-semibold ${w.upcoming ? "text-staff-text-muted" : ""}`}>{w.title}</p>
              <p className={`text-[12px] ${w.current ? "text-staff-primary" : "text-staff-text-sub"}`}>{w.sub}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[12px] text-staff-text-muted">기록은 3년 보존됩니다. 1년은 한 번에 조회하는 폭의 제한입니다.</p>
    </>
  );
}

/** 시작일 · 종료일 — 서로의 min · max 를 1년으로 묶는다(HIST-2). 조회는 주소로 간다(form GET) */
function PeriodPicker({ from, to }: { from: string; to: string }) {
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  return (
    <Card>
      <form action="/attendance">
        <input type="hidden" name="tab" value="period" />
        <p className="text-[13px] font-semibold text-staff-text-sub">기간 고르기</p>
        <div className="flex items-center gap-[8px] pt-[8px]">
          <input
            type="date"
            name="from"
            aria-label="시작일"
            required
            className={FIELD}
            value={start}
            min={end ? addDays(end, -(MAX_PERIOD_DAYS - 1)) : undefined}
            max={end || undefined}
            onChange={(e) => setStart(e.target.value)}
          />
          <span aria-hidden className="text-[12px] text-staff-text-muted">
            –
          </span>
          <input
            type="date"
            name="to"
            aria-label="종료일"
            required
            className={FIELD}
            value={end}
            min={start || undefined}
            max={start ? addDays(start, MAX_PERIOD_DAYS - 1) : undefined}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="pt-[8px]">
          <Button type="submit">조회</Button>
        </div>
        <p className="pt-[8px] text-[12px] text-staff-text-muted [&_b]:font-bold">
          기본은 이번 달입니다. 한 번에 <b>최대 1년</b>까지 고를 수 있습니다.
        </p>
      </form>
    </Card>
  );
}

function EmptyRecords() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">
      <span className="flex pb-[6px] text-staff-text-muted">
        <MaskIcon src="/icons/history.svg" size={40} flipY />
      </span>
      <h2 className="text-[18px] font-bold">등록된 출퇴근 기록이 없습니다</h2>
      <p className="max-w-[250px] text-[14px] text-staff-text-sub">근무를 시작하면 이곳에 기록이 쌓입니다.</p>
    </div>
  );
}

// 경고 아이콘(목업 ph-warning) — 저장소에 맞는 SVG 가 없어 데모처럼 여기서만 그린다.
function WarningIcon() {
  return (
    <span aria-hidden className="flex w-[20px] shrink-0 items-start justify-center pt-[2px]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M7.13 1.5a1 1 0 0 1 1.74 0l6.5 11.5A1 1 0 0 1 14.5 14.5h-13a1 1 0 0 1-.87-1.5zM7.25 6v4h1.5V6zm.75 5.25a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8" />
      </svg>
    </span>
  );
}
