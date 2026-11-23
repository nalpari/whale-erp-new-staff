"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AttendanceDayCard, BottomSheet, Button, Card, DayOffRow, MaskIcon, Notice, SegmentedControl, StatusChip, WorkTimeBar, segmentTabId } from "@/components/common";
import { EASE_OUT, FIELD } from "@/components/common/theme";
import {
  addDays,
  barOf,
  dayLabel,
  durationLabel,
  editRows,
  flagDescription,
  flagLine,
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
import { useFieldCheck } from "@/app/_components/use-field-check";

type Tab = "week" | "period";
type Sheet = { kind: "edits" | "flag" | "missing-out"; day: MyAttendanceDay } | null;

const PANEL = "attendance-panel";
const STORE_NOTICE = (
  <>
    관리자가 확인하고 있습니다.
    <br />
    기록이 다르면 <strong>근무지 관리자에게 문의해 주세요.</strong>
  </>
);

/** 출퇴근 현황 본문 — 탭 · 이번 주 카드 · 기간별 누계와 주별 줄 · 시트(데모 attendance 의 상태 · 시트 그대로) */
/** now 는 서버가 그린 시각(ISO) — 근무 중 막대 끝을 서버 · 브라우저가 같게 그린다 */
export function AttendanceHistoryScreen({ tab, records, today, weekStart, now }: { tab: Tab; records: MyAttendanceRecords; today: string; weekStart: string; now: string }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);

  return (
    <main className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[20px] pb-[24px] leading-[1.5]">
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
      <DaySheets sheet={sheet} onClose={close} onOpen={setSheet} />
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
            관리자가 확인하고 있습니다.
            <br />
            기록이 다르면 근무지 관리자에게 문의해 주세요.
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
        <span className="pt-[2px] text-[13px]">{flags.map(flagLine).join(" / ")}</span>
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

function DaySheets({ sheet, onClose, onOpen }: { sheet: Sheet; onClose: () => void; onOpen: (s: Sheet) => void }) {
  const day = sheet?.day;
  const edits = day?.edits ?? [];
  const proxy = edits[0]?.kind === "PROXY";
  const flags = day ? flagsOf(day) : [];
  // 퇴근 기록 없음 시트는 퇴근이 빠진 짝의 출근을 말한다 — 하루에 짝이 여럿이면 앞 짝이 닫혀 있을 수 있다
  const openIn = (day?.pairs.find((p) => p.checkIn && !p.checkOut) ?? day?.pairs.find((p) => p.checkIn))?.checkIn?.time;
  return (
    <>
      <BottomSheet
        open={sheet?.kind === "edits"}
        onClose={onClose}
        title={proxy ? "관리자가 대신 등록한 기록입니다" : "관리자가 수정한 기록입니다"}
      >
        {edits.map((e) => (
          <Sunken key={`${e.at}-${e.kind}`}>
            <Values rows={editRows(e)} />
          </Sunken>
        ))}
        <p className="text-[12px] text-staff-text-muted">
          기록이 다르면 근무지 관리자에게 문의해 주세요.
          {proxy && (
            <>
              <br />
              앱으로 직접 등록하려면 위치정보 수집·이용에 다시 동의해야 합니다.
            </>
          )}
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
              <p className="whitespace-pre-line">{flagDescription(f)}</p>
            </Sunken>
          ))}
        <Notice icon={<MaskIcon src="/icons/store-line.svg" size={16} />}>{STORE_NOTICE}</Notice>
        {/* 확인 필요 카드가 그날을 통째로 덮으므로, 같은 날의 수정 이력(HIST-1) · 퇴근 기록 없음(HIST-4)은 여기서 이어 연다 */}
        {day && isEdited(day) && (
          <Button variant="ghost" onClick={() => onOpen({ kind: "edits", day })}>
            수정 이력 보기
          </Button>
        )}
        {day?.status === "MISSING_CHECK_OUT" && (
          <Button variant="ghost" onClick={() => onOpen({ kind: "missing-out", day })}>
            퇴근 기록 없음 보기
          </Button>
        )}
      </BottomSheet>
      <BottomSheet
        open={sheet?.kind === "missing-out"}
        onClose={onClose}
        title="퇴근 기록이 없습니다"
        description={`${openIn ?? "-"} 출근 기록만 있고 퇴근 기록이 없습니다.`}
      >
        <Notice icon={<MaskIcon src="/icons/store-line.svg" size={16} />}>
          퇴근을 등록하지 못했다면
          <br />
          <strong>근무지 관리자에게 문의해 주세요.</strong>
        </Notice>
      </BottomSheet>
    </>
  );
}

function PeriodView({ records, today }: { records: MyAttendanceRecords; today: string }) {
  const totals = periodTotals(records, today);
  return (
    <>
      <PeriodPicker from={records.from} to={records.to} />
      <Sunken label={`총 근무 시간 · ${rangeLabel(records.from, records.to)}`}>
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
          {weekRows(records, today).map((w) => (
            <li key={w.title} className={`flex flex-col gap-[2px] py-[14px] ${w.upcoming ? "opacity-55" : ""}`}>
              <p className={`text-[14px] font-semibold ${w.upcoming ? "text-staff-text-muted" : ""}`}>{w.title}</p>
              <p className={`text-[12px] ${w.current ? "text-staff-primary" : "text-staff-text-sub"}`}>{w.sub}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[12px] text-staff-text-muted">출퇴근 기록은 보존 기간(3년) 동안 조회할 수 있습니다.</p>
    </>
  );
}

/**
 * 시작일 · 종료일 — 서로의 min · max 를 1년으로 묶는다(HIST-2). 조회는 주소로 간다(form GET).
 * 브라우저 말풍선 대신(noValidate) 빈 칸 · 순서 · 1년 넘김을 두 칸 줄 아래 한 줄 빨간 문구로 알린다(2026-11-23 사용자 결정).
 */
// 날짜 칸 두 개가 카드 폭 안에 들어가게 — 칸이 글자 폭만큼 버티지 않도록 min-w-0 · 좌우 여백 10(2026-11-20 사용자 지정: 오른쪽 칸이 카드 밖으로 밀렸다)
// 아이폰 Safari 는 날짜 칸이 기본 모양(appearance)일 때 min-w-0 · 칸 폭을 무시하고 글자 폭만큼 늘어나 카드 밖으로 밀렸다 — 기본 모양을 끄고 폭을 칸에 맞춘다(2026-11-23 사용자 지정)
const DATE_FIELD = `${FIELD.replace("px-[14px]", "px-[10px]")} w-full min-w-0 max-w-full appearance-none text-left [&::-webkit-date-and-time-value]:text-left`;

function PeriodPicker({ from, to }: { from: string; to: string }) {
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const noteId = useId();
  const fields = useFieldCheck((data) => {
    const f = String(data.get("from") ?? "");
    const t = String(data.get("to") ?? "");
    if (!f) return { from: "시작일을 선택해 주세요" };
    if (!t) return { to: "종료일을 선택해 주세요" };
    if (t < f) return { to: "종료일은 시작일 이후로 선택해 주세요" };
    if (t > addDays(f, MAX_PERIOD_DAYS - 1)) return { to: "한 번에 최대 1년까지 조회할 수 있습니다" };
    return {};
  });
  const error = fields.errors.from ?? fields.errors.to;
  return (
    <Card>
      <form action="/attendance" noValidate onSubmit={fields.check} onChange={fields.clear}>
        <input type="hidden" name="tab" value="period" />
        <p className="text-[13px] font-semibold text-staff-text-sub">조회 기간</p>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[8px] pt-[8px]">
          <input
            type="date"
            name="from"
            aria-label="시작일"
            required
            aria-invalid={fields.errors.from ? true : undefined}
            aria-describedby={error ? noteId : undefined}
            className={DATE_FIELD}
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
            aria-invalid={fields.errors.to ? true : undefined}
            aria-describedby={error ? noteId : undefined}
            className={DATE_FIELD}
            value={end}
            min={start || undefined}
            max={start ? addDays(start, MAX_PERIOD_DAYS - 1) : undefined}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        {/* 두 칸이 한 줄이라 칸 오류는 줄 아래 한 줄로 둔다(입력칸 안내 · 오류와 같은 12px 오류색, 칸과 사이 8). */}
        {error && (
          <p id={noteId} className="pt-[8px] text-[12px] text-staff-error">
            {error}
          </p>
        )}
        <div className="pt-[8px]">
          {/* 남보라 큰 버튼은 화면에서 너무 강해 외곽선 버튼으로(2026-11-20 사용자 지정) */}
          <Button type="submit" variant="outline">
            조회
          </Button>
        </div>
        <p className="pt-[8px] text-[12px] text-staff-text-muted [&_b]:font-bold">
          한 번에 <b>최대 1년</b>까지 조회할 수 있습니다.
        </p>
      </form>
    </Card>
  );
}

function EmptyRecords() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center break-keep">
      <span className="flex pb-[6px] text-staff-text-muted">
        <MaskIcon src="/icons/history.svg" size={40} flipY />
      </span>
      <h2 className="text-[18px] font-bold">출퇴근 기록이 없습니다</h2>
      <p className="max-w-[250px] text-[14px] text-staff-text-sub">출근을 등록하면 여기에 표시됩니다.</p>
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
