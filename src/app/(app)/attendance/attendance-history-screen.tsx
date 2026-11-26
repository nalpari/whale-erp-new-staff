"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttendanceDayCard, BottomSheet, Button, Collapse, DayOffRow, MaskIcon, Notice, SegmentedControl, StatusChip, SubLine, WorkTimeBar, segmentTabId } from "@/components/common";
import { EASE_OUT } from "@/components/common/theme";
import {
  barOf,
  dayLabel,
  durationLabel,
  editRows,
  flagDescription,
  flaggedPairLines,
  flagsOf,
  flagTitle,
  isEdited,
  periodTotals,
  statusChipOf,
  summaryOf,
  weekDays,
  weekBarRange,
  weekRows,
  type MyAttendanceDay,
} from "@/lib/attendance-history";
import type { MyAttendanceRecords } from "@/lib/my-attendance";
import { Sunken, Values } from "../check-in/check-in-parts";
import { PeriodPicker } from "./period-picker";

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
// fromHome: 홈에서 왔으면(?back=home) 탭 · 기간을 바꿔도 뒤로 가기가 홈이 되게 주소에 남긴다(리뷰 반영)
export function AttendanceHistoryScreen({ tab, records, today, weekStart, now, fromHome = false }: { tab: Tab; records: MyAttendanceRecords; today: string; weekStart: string; now: string; fromHome?: boolean }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);

  return (
    <main className="flex flex-1 flex-col gap-[12px] px-[22px] pt-[12px] pb-[24px] leading-[1.5]">
      <SegmentedControl
        label="기간"
        panelId={PANEL}
        value={tab}
        items={[
          { value: "week", label: "이번 주" },
          { value: "period", label: "기간별" },
        ]}
        onChange={(next) => {
          if (next !== tab) router.push(`/attendance${next === "period" ? "?tab=period" : ""}${fromHome ? (next === "period" ? "&" : "?") + "back=home" : ""}`);
        }}
      />
      <div id={PANEL} role="tabpanel" aria-labelledby={segmentTabId(PANEL, tab)} className="flex flex-1 flex-col gap-[12px]">
        {tab === "week" ? (
          <WeekView records={records} today={today} weekStart={weekStart} now={now} onOpen={setSheet} />
        ) : (
          <PeriodView records={records} today={today} fromHome={fromHome} onOpen={setSheet} />
        )}
      </div>
      <DaySheets sheet={sheet} onClose={close} onOpen={setSheet} />
    </main>
  );
}

function WeekView({ records, today, weekStart, now, onOpen }: { records: MyAttendanceRecords; today: string; weekStart: string; now: string; onOpen: (s: Sheet) => void }) {
  // 한 주 카드는 같은 눈금을 쓴다 — 날마다 범위가 다르면 같은 시각이 카드마다 다른 자리에 보였다(2026-11-24 사용자 지정)
  const range = weekBarRange(records.items.map((d) => barOf(d, new Date(now))));
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
      <div className="flex flex-col gap-[12px]">
        {weekDays(weekStart, records.items).map(({ date, day }) =>
          day ? (
            <DayCard key={date} day={day} today={today} now={now} range={range} onOpen={onOpen} />
          ) : (
            <DayOffRow key={date} label={`${dayLabel(date)} · 예정 없음`} />
          ),
        )}
      </div>
    </>
  );
}

function DayCard({
  day,
  today,
  now,
  range,
  onOpen,
}: {
  day: MyAttendanceDay;
  today: string;
  now: string;
  /** 한 주 카드가 같은 눈금을 쓰게 주 전체의 막대 범위(weekBarRange) */
  range: { from: number; to: number };
  onOpen: (s: Sheet) => void;
}) {
  const bar = { ...barOf(day, new Date(now)), ...range };
  const flags = flagsOf(day);
  // 확인 필요 꼬리표가 붙은 날 — 호박색 카드 전체가 사유 시트를 연다(데모 flaggedDayCard). 직원이 누를 처리 버튼은 없다(HIST-3).
  if (flags.length > 0)
    return (
      <button
        type="button"
        onClick={() => onOpen({ kind: "flag", day })}
        className={`flex w-full flex-col gap-[3px] rounded-[18px] border border-[#f6e3bd] bg-[#fffbf2] px-[20px] py-[20px] text-left text-[#6f4608] transition-[background-color] duration-150 ${EASE_OUT} active:bg-[#fff3dc]`}
      >
        <span className="flex w-full items-center gap-[8px] pb-[5px]">
          <span className="min-w-0 flex-1 text-[13px] font-bold">{dayLabel(day.date)}</span>
          <StatusChip tone="warning">확인 필요</StatusChip>
        </span>
        <WorkTimeBar {...bar} />
        <span className="flex flex-col pt-[2px] text-[13px]">
          {flaggedPairLines(day, today).map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </span>
      </button>
    );

  const state = day.date < today ? "done" : day.date === today ? "today" : "upcoming";
  const card = (
    <AttendanceDayCard
      state={state}
      day={dayLabel(day.date)}
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

function PeriodView({
  records,
  today,
  fromHome,
  onOpen,
}: {
  records: MyAttendanceRecords;
  today: string;
  fromHome: boolean;
  onOpen: (s: Sheet) => void;
}) {
  const totals = periodTotals(records, today);
  // 주 줄을 누르면 그 주의 날짜 줄을 펼친다 — 지난 주의 날마다 출퇴근 시각을 볼 곳이 없었다(급여명세서가 이 기록으로 작성된다, 2026-11-24 사용자 지정)
  const [opened, setOpened] = useState<string | null>(null);
  const inRange = (date: string) => date >= records.from && date <= records.to;
  return (
    <>
      <PeriodPicker from={records.from} to={records.to} fromHome={fromHome} today={today} />
      {/* 조회 기간 요약 — 위층 「얼마나 일했나」(근무일 → 근로시간 큰 숫자 — 휴게를 뺀 시간이라 「근로시간」(근로기준법 제50조, DESIGN.md 용어), 2026-11-24 사용자 지정), 아래층 「어떻게 일했나」(정상 · 지각 · 미기록 한 줄).
          세 칸 모두 옅은 회색 칸(둥근 10px — 상자 18px 안쪽 8px 에 맞춘 값)이고 간격은 한 값 — 상자 테두리 바깥에서 칸까지 · 칸 사이 가로 · 세로 모두 8px(안쪽 7px + 테두리 1px), 숫자 20px 로 줄였다(위아래 양옆 간격이 달라 보였다).
          숫자는 먹색 한 가지(호박색 · 꼬리표는 튀었다). 문의 안내 줄은 뺐다(2026-11-24 사용자 지정) */}
      <section className="flex flex-col gap-[8px] rounded-[18px] border border-staff-border-light bg-white p-[7px]">
        <dl className="grid grid-cols-2 gap-[8px] [&>div]:rounded-[10px] [&>div]:bg-staff-bg [&>div]:px-[14px] [&>div]:py-[12px]">
          <div>
            <dt className="text-[13px] font-semibold text-staff-text-sub">근무일</dt>
            <dd className="text-[20px] font-bold tabular-nums [&_span]:text-[14px]">
              {totals.workedDays}
              <span>일</span>
            </dd>
          </div>
          <div>
            <dt className="flex items-baseline gap-[6px] text-[13px] font-semibold text-staff-text-sub">
              근로시간
              <span className="text-[12px] font-normal text-staff-text-muted">휴게시간 제외</span>
            </dt>
            <dd className="text-[20px] font-bold tabular-nums [&_span]:text-[14px]">
              {Math.floor(totals.workedMinutes / 60)}
              <span>시간</span> {String(totals.workedMinutes % 60).padStart(2, "0")}
              <span>분</span>
            </dd>
            {totals.overtimeMinutes > 0 && <dd className="text-[12px] text-staff-text-sub">연장 {durationLabel(totals.overtimeMinutes)}</dd>}
          </div>
        </dl>
        {/* 아래층은 한 칸에 셋을 같은 폭 · 가운데로 */}
        <dl className="grid grid-cols-3 rounded-[10px] bg-staff-bg px-[8px] py-[10px] text-center text-[13px]">
          {(
            [
              ["정상", totals.normal, "일"],
              ["지각", totals.late, "회"],
              ["미기록", totals.absent, "회"],
            ] as const
          ).map(([label, n, unit]) => (
            <div key={label} className="flex items-baseline justify-center gap-[4px]">
              <dt className="text-staff-text-sub">{label}</dt>
              <dd className="font-semibold text-staff-text tabular-nums">
                {n}
                <span className="font-normal">{unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {records.items.length === 0 ? (
        <EmptyRecords />
      ) : (
        <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
          {weekRows(records, today).map((w) => {
            const open = opened === w.monday;
            const days = weekDays(w.monday, records.items).filter(({ date }) => inRange(date));
            return (
              <li key={w.title} className={w.upcoming ? "opacity-55" : ""}>
                <button
                  type="button"
                  aria-expanded={open}
                  disabled={w.empty}
                  onClick={() => setOpened(open ? null : w.monday)}
                  className="flex w-full items-center gap-[10px] py-[14px] text-left"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    {/* 주 이름은 굵게 왼쪽, 날짜는 오른쪽 끝 회색 — 가운뎃점 하나로 붙어 구분되지 않았다(2026-11-24 사용자 지정) */}
                    <span className={`flex items-baseline justify-between gap-[8px] ${w.upcoming || w.empty ? "text-staff-text-muted" : ""}`}>
                      <span className="text-[14px] font-semibold">
                        {w.name}
                        {w.current && <span className="pl-[6px] text-[12px] font-normal text-staff-text-sub">이번 주</span>}
                      </span>
                      <span className="text-[12px] text-staff-text-sub tabular-nums">{w.range}</span>
                    </span>
                    {/* 둘째 줄은 공통 둥근 꺾은선(SubLine)으로 주 이름 아래 요약임을 보인다 — 「기록 없음」 · 「근무 예정」도 같은 들여쓰기.
                        시간 · 근무 · 지각 · 미기록 모두 꺾은선과 같은 회색 한 가지(색이 섞이면 어지러웠다), 단위 없이 숫자만(「근무 2 · 지각 2」), 지각 · 미기록은 0 이 아닐 때만(2026-11-24 사용자 지정) */}
                    <SubLine>
                      {w.empty ? (
                        w.upcoming ? "예정 없음" : "기록 없음"
                      ) : w.upcoming ? (
                        "근무 예정"
                      ) : (
                        <span className="flex flex-wrap items-center gap-x-[6px]">
                          <span>{durationLabel(w.workedMinutes)}</span>
                          <span aria-hidden>·</span>
                          <span>근무 {w.workedDays}</span>
                          {w.late > 0 && (
                            <>
                              <span aria-hidden>·</span>
                              <span>지각 {w.late}</span>
                            </>
                          )}
                          {w.absent > 0 && (
                            <>
                              <span aria-hidden>·</span>
                              <span>미기록 {w.absent}</span>
                            </>
                          )}
                        </span>
                      )}
                    </SubLine>
                  </span>
                  {/* chevron-down.svg 는 위를 보게 그려져 있어 닫힘에서 뒤집는다. 기록 없는 주는 펼치지 않아 꺾쇠를 감추되 자리는 남겨 오른쪽 날짜 줄이 틀어지지 않게(2026-11-24 사용자 지정) */}
                  <span aria-hidden className={`flex text-staff-text-sub ${w.empty ? "invisible" : ""} transition-transform duration-150 ${EASE_OUT} ${open ? "" : "rotate-180"}`}>
                    <MaskIcon src="/icons/chevron-down.svg" size={16} />
                  </span>
                </button>
                {/* 펼친 주는 날마다 한 줄(날짜 · 출근 · 퇴근 · 상태) — 막대 카드를 넣으니 무겁고 길었다(2026-11-24 사용자 지정) */}
                {/* 펼침 · 접힘은 높이로 움직인다(Collapse, 2026-11-26 실기기 피드백). 기록 없는 주는 펼치지 않아 그리지 않는다 */}
                {!w.empty && (
                  <Collapse open={open}>
                    {/* 펼친 날짜 줄은 옅은 회색 상자로 주 줄(흰 바탕)과 가른다. 줄 사이 선은 회색 바탕에서 보이게 한 단계 진한 선(2026-11-24 사용자 지정).
                        아래 여백은 바깥 칸(pb)에 둬 다 접혔을 때 남지 않게 */}
                    <div className="pb-[14px]">
                      <ul className="flex flex-col divide-y divide-staff-border rounded-[12px] bg-staff-bg px-[12px]">
                        {days.map(({ date, day }) => (
                          <DayLine key={date} date={date} day={day} today={today} onOpen={onOpen} />
                        ))}
                      </ul>
                    </div>
                  </Collapse>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {/* 보존 기준은 기록한 날로부터 3년(운영 정책 RET-03). 문의 안내를 여기 한 번 둔다(2026-11-24 사용자 지정) */}
      <p className="px-[4px] text-[12px] text-staff-text-muted">
        출퇴근 기록은 기록한 날로부터 3년 동안 조회할 수 있습니다.
        <br />
        기록이 실제와 다르면 근무지 관리자에게 문의해 주세요.
      </p>
    </>
  );
}

/** 기간별 펼친 주의 하루 한 줄 — 날짜 · 출퇴근 쌍(쌍마다 한 줄) · 상태. 확인 필요 · 수정 · 퇴근 기록 없음이면 눌러 시트를 연다 */
function DayLine({ date, day, today, onOpen }: { date: string; day: MyAttendanceDay | null; today: string; onOpen: (s: Sheet) => void }) {
  // 시각만 쌍마다 한 줄(「15:58 – 18:14」) — 사유까지 붙이면 줄 중간에서 꺾였다. 사유는 확인 필요 줄을 눌러 시트에서 본다
  const lines = !day
    ? ["예정 없음"]
    : day.pairs.length === 0
      ? [summaryOf(day, today)]
      : day.pairs.map((p) => `${p.checkIn?.time ?? "기록 없음"} – ${p.checkOut?.time ?? (date === today ? "근무 중" : "퇴근 기록 없음")}`);
  // 실제 기록이 있거나 지난 날이면 그날 근무스케줄을 회색 「예정」 줄로 함께 — 예정과 실제를 견줘 지각인지 보이게(2026-11-24 사용자 지정)
  const plans = day && !(day.pairs.length === 0 && date >= today) ? day.schedules.map((p) => `예정 ${p.startTime} – ${p.endTime}`) : [];
  // 확인 필요여도 지각 · 근무 중 같은 상태 글자는 함께 둔다 — 확인 필요가 지각을 가렸다
  const status = day ? statusChipOf(day, today) : undefined;
  const chips = day ? [...(flagsOf(day).length > 0 ? [{ label: "확인 필요", tone: "warning" as const }] : []), ...(status ? [status] : [])] : [];
  const sheet: Sheet = !day ? null : flagsOf(day).length > 0 ? { kind: "flag", day } : isEdited(day) ? { kind: "edits", day } : day.status === "MISSING_CHECK_OUT" ? { kind: "missing-out", day } : null;
  const body = (
    <>
      <span className="w-[64px] shrink-0 text-[13px] font-semibold">{dayLabel(date)}</span>
      <span className={`flex min-w-0 flex-1 flex-col text-[13px] tabular-nums ${day ? "" : "text-staff-text-muted"}`}>
        {lines.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
        {plans.map((l, i) => (
          <span key={`p${i}`} className="pt-[2px] text-[12px] text-staff-text-muted">
            {l}
          </span>
        ))}
      </span>
      {/* 펼친 날짜 줄의 상태는 칩 대신 12px 글자 — 칩을 두 개 쌓으니 줄이 두꺼웠다. 주의할 것(확인 필요 · 지각 · 미출근 · 미기록)만 먹색, 나머지는 회색 — 호박색은 튀었다(2026-11-24 사용자 지정) */}
      {chips.length > 0 && (
        <span className="flex shrink-0 flex-col items-end gap-[2px] pt-[1px] text-[12px] font-semibold">
          {chips.map((c) => (
            <span key={c.label} className={c.tone === "warning" ? "text-staff-text" : "text-staff-text-sub"}>
              {c.label}
            </span>
          ))}
        </span>
      )}
    </>
  );
  return (
    <li>
      {sheet ? (
        <button type="button" onClick={() => onOpen(sheet)} className="flex w-full items-start gap-[8px] py-[10px] text-left active:bg-staff-bg">
          {body}
        </button>
      ) : (
        <div className="flex items-start gap-[8px] py-[10px]">{body}</div>
      )}
    </li>
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
