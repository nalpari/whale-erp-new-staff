// 직원 근무 앱 데모 · 출퇴근 현황. 기준 목업: docs/mockup/app/attendance-history.html —
// 상태 5개(이번 주 · 기간별 · 확인 필요 섞임 · 기록 없음 · 근무지 없음)와 시트 4개(보정 · 대신 등록 · 반경 밖 출근 · 퇴근 기록 없음),
// 화면 문구·가짜 값을 옮겼다. 쟁점 HIST-1(보정·대신 등록은 연필 표시 + 상세 시트), HIST-2(이번 주 / 기간별 탭, 기간별은 이번 달 기본 ·
// 한 번에 최대 1년), HIST-3(확인 필요는 보기만 + 점포 안내), HIST-4(퇴근 기록 없음은 확인 필요가 아닌 별도 표시, 2026-10-08)는
// 모두 확정이고 목업이 그린 그대로다.
// 이번 주(week)는 Figma 05.출퇴근 현황(node 12:1233)을 따른다 — 다만 HIST-2 에 따라 탭 이름은 「기간별」이고 주 이동 줄(PeriodNav)은 두지 않는다.
// 그 밖 상태와 시트는 Figma 없음 — DESIGN.md 기준 초안.
// 목업과 달리 한 곳: 목업 이번 주의 대신 등록 카드가 「토 9/12」로 두 번 나오고 아직 오지 않은 날이라, 지난 쉬는 날이던 월 9/7 에 두고
// 시트의 등록 시각도 그날(9월 7일 18:05)로 맞췄다. 직원이 고칠 수단은 어디에도 없다 — 보정은 관리자 웹의 일이다.
// 기간별 날짜 칸의 서로 묶인 min·max(1년)는 assets/staff.js 가 맞춘다.
// 근무시간 · 연장은 앱이 셈하지 않고 API 가 주는 급여와 같은 값이다 — 휴게 제외, 1주 40시간 초과 연장 포함(2026-10-26 재영).
import {
  EASE_OUT,
  FIELD,
  attendanceDayCard,
  bottomNav,
  bottomSheet,
  button,
  card,
  dayOffRow,
  img,
  maskIcon,
  notice,
  page,
  pillLink,
  storeMark,
  subLine,
  segmentTabId,
  segmentedControl,
  state,
  statusChip,
  sunken,
  values,
  workTimeBar,
} from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. 시트 넷은 목업에서 카드를 눌러 여는 것이라 데모 도구에서도 열 수 있게 뒤에 붙였다.
const STATES = [
  { id: "week", label: "이번 주", note: "기본 상태" },
  { id: "period", label: "기간별", note: "주 줄 펼치기" },
  { id: "periodCal", label: "조회 기간 달력", note: "시트 · 시작 · 종료" },
  { id: "flagged", label: "확인 필요 섞임", note: "위치 실패·퇴근 기록 없음" },
  { id: "empty", label: "기록 없음", note: "빈 상태" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "editInfo", label: "보정 기록", note: "시트 · 수 9/9 연필 표시" },
  { id: "proxyInfo", label: "대신 등록 기록", note: "시트 · 월 9/7 연필 표시" },
  { id: "flagTue", label: "반경 밖 출근", note: "시트 · 확인 필요" },
  { id: "flagWed", label: "퇴근 기록 없음", note: "시트 · 수 9/9" },
];
// 시트마다 뒤에 깔리는 상태.
const SHEET_BASE = { editInfo: "week", proxyInfo: "week", flagTue: "flagged", flagWed: "flagged", periodCal: "period" };

const STORE = "웨일카페 강남역점";
const PANEL = "attendance-panel";

// 연필 표시가 있는 카드 위에 덮는 투명 버튼. 연필(11px)만 누르게 하면 44px 를 못 채워 카드 전체를 누르는 칸으로 둔다.
const pressable = (label, sheet, children) =>
  `<div class="relative">${children}<button type="button" aria-label="${label}" data-open="${sheet}" class="absolute inset-0 rounded-[18px] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary/5"></button></div>`;

const todayCard = () =>
  attendanceDayCard({
    state: "today",
    day: "목 9/10",
    status: { label: "근무 중", tone: "working" },
    schedule: { start: "09:00", end: "18:00" },
    worked: { start: "09:02", end: "14:00" },
    ongoing: true,
    summary: "출근 09:02 · 퇴근 전",
  });

// 이번 주 — Figma node 12:1233 의 하루 카드 그대로. 연필 표시가 있는 카드(대신 등록 · 보정)는 눌러 시트를 연다.
const weekView = () =>
  `<div class="flex flex-col gap-[12px]">${pressable(
    "월 9/7 대신 등록 정보 보기",
    "proxyInfo",
    attendanceDayCard({
      state: "done",
      day: "월 9/7",
        edited: true,
      status: { label: "대신 등록", tone: "neutral" },
      schedule: { start: "09:00", end: "18:00" },
      worked: { start: "09:00", end: "18:00" },
      summary: "출근 09:00 · 퇴근 18:00",
    }),
  )}${attendanceDayCard({
    state: "done",
    day: "화 9/8",
    status: { label: "정상", tone: "success" },
    schedule: { start: "09:00", end: "18:00" },
    worked: { start: "08:58", end: "18:00" },
    summary: "출근 08:58 · 퇴근 18:00",
  })}${pressable(
    "수 9/9 수정 이력 보기",
    "editInfo",
    attendanceDayCard({
      state: "done",
      day: "수 9/9",
        edited: true,
      status: { label: "지각 14분", tone: "warning" },
      schedule: { start: "09:00", end: "18:00" },
      worked: { start: "09:14", end: "18:02" },
      summary: "출근 09:14 · 퇴근 18:02",
    }),
  )}${todayCard()}${attendanceDayCard({
    state: "upcoming",
    day: "금 9/11",
    schedule: { start: "09:00", end: "18:00" },
    summary: "예정 09:00 – 18:00",
  })}${attendanceDayCard({
    state: "upcoming",
    day: "토 9/12",
    schedule: { start: "13:00", end: "22:00" },
    summary: "예정 13:00 – 22:00",
  })}${dayOffRow("일 9/13 · 예정 없음")}</div>`;

// ── 기간별(개발 화면 attendance-history-screen PeriodView · period-picker) ──
// 조회 기간 — 칸 하나를 눌러 달력 시트에서 시작일 → 종료일을 누른다(2026-11-24). 사이 날은 연보라 띠, 양 끝은 남보라 동그라미에 「시작」 · 「종료」 꼬리표.
const periodField = () =>
  `<div class="relative"><button type="button" data-open="periodCal" aria-haspopup="dialog" aria-label="조회 기간 2026.09.01 ~ 2026.09.30" class="${FIELD} pr-[44px] text-left tabular-nums">2026.09.01 ~ 2026.09.30</button><span aria-hidden="true" class="pointer-events-none absolute top-1/2 right-[14px] flex -translate-y-1/2 text-staff-text-sub">${maskIcon(
    "calendar-line.svg",
    16,
  )}</span></div>`;
// 2026년 9월 달력(9/1 은 화요일). 데모는 9월 1일 ~ 30일을 고른 모습만 보인다 — 날짜를 눌러 바꾸는 동작은 개발 화면에서 본다.
const calCell = (d) => {
  const day = `2026-09-${String(d).padStart(2, "0")}`;
  const isEdge = d === 1 || d === 30;
  const inside = d > 1 && d < 30;
  const band = inside
    ? "bg-staff-primary-inactive"
    : d === 1
      ? "bg-[linear-gradient(to_right,transparent_50%,var(--color-staff-primary-inactive)_50%)]"
      : "bg-[linear-gradient(to_left,transparent_50%,var(--color-staff-primary-inactive)_50%)]";
  return `<button type="button" aria-pressed="true" aria-label="9월 ${d}일" class="relative flex h-[48px] items-start justify-center pt-[4px]"><span aria-hidden="true" class="absolute inset-x-0 top-[4px] h-[32px] ${band}"></span><span class="relative flex size-[32px] items-center justify-center rounded-full text-[14px] tabular-nums transition-colors duration-150 ${EASE_OUT} ${
    isEdge ? "bg-staff-primary font-bold text-white" : day === "2026-09-10" ? "font-bold text-staff-primary" : "text-staff-text"
  }">${d}</span>${isEdge ? `<span class="absolute bottom-[1px] text-[10px] leading-none font-bold text-staff-primary">${d === 1 ? "시작" : "종료"}</span>` : ""}</button>`;
};
const periodCalendar = () =>
  `<div class="flex flex-col gap-[12px]"><div class="flex items-center justify-between"><button type="button" aria-label="이전 달" data-toast="8월로 옮겼습니다" class="flex size-[40px] items-center justify-center rounded-full text-staff-text-sub active:bg-staff-bg">${maskIcon(
    "chevron-left-24.svg",
    20,
  )}</button><p class="text-[16px] font-bold">2026년 9월</p><button type="button" aria-label="다음 달" data-toast="10월로 옮겼습니다" class="flex size-[40px] items-center justify-center rounded-full text-staff-text-sub active:bg-staff-bg">${maskIcon(
    "chevron-right-24.svg",
    20,
  )}</button></div><div class="grid grid-cols-7 text-center text-[12px] text-staff-text-sub">${["월", "화", "수", "목", "금", "토", "일"].map((w) => `<span class="py-[4px]">${w}</span>`).join("")}</div><div role="grid" aria-label="2026-09 달력" class="grid grid-cols-7 gap-y-[4px]"><span></span>${Array.from(
    { length: 30 },
    (_, i) => calCell(i + 1),
  ).join(
    "",
  )}<span></span><span></span><span></span><span></span></div><p aria-live="polite" class="flex items-center justify-center gap-[8px] text-[14px] text-staff-text"><span class="font-semibold">9월 1일 ~ 9월 30일</span><span class="rounded-full bg-staff-bg px-[10px] py-[2px] text-[13px] font-bold tabular-nums">30일</span></p><p class="text-center text-[12px] text-staff-text-muted [&_b]:font-bold">한 번에 <b>최대 1년</b>까지 조회할 수 있습니다.</p>${button("적용", { "data-close": true, "data-toast": "기간 기록을 불러왔습니다" })}</div>`;

// 조회 기간 요약 — 옅은 회색 칸 셋: 근무일 | 근로시간(휴게시간 제외), 아래 정상 · 지각 · 미기록. 상자 바깥에서 칸까지 · 칸 사이 모두 8, 숫자 20px, 모두 먹색(2026-11-24)
const periodSummary = () =>
  `<section class="flex flex-col gap-[8px] rounded-[18px] border border-staff-border-light bg-white p-[7px]"><dl class="grid grid-cols-2 gap-[8px] [&>div]:rounded-[10px] [&>div]:bg-staff-bg [&>div]:px-[14px] [&>div]:py-[12px]"><div><dt class="text-[13px] font-semibold text-staff-text-sub">근무일</dt><dd class="text-[20px] font-bold tabular-nums [&_span]:text-[14px]">9<span>일</span></dd></div><div><dt class="flex items-baseline gap-[6px] text-[13px] font-semibold text-staff-text-sub">근로시간<span class="text-[12px] font-normal text-staff-text-muted">휴게시간 제외</span></dt><dd class="text-[20px] font-bold tabular-nums [&_span]:text-[14px]">63<span>시간</span> 16<span>분</span></dd><dd class="text-[12px] text-staff-text-sub">연장 1시간 20분</dd></div></dl><dl class="grid grid-cols-3 rounded-[10px] bg-staff-bg px-[8px] py-[10px] text-center text-[13px]">${[
    ["정상", 7, "일"],
    ["지각", 2, "회"],
    ["미기록", 0, "회"],
  ]
    .map(
      ([label, n, unit]) =>
        `<div class="flex items-baseline justify-center gap-[4px]"><dt class="text-staff-text-sub">${label}</dt><dd class="font-semibold text-staff-text tabular-nums">${n}<span class="font-normal">${unit}</span></dd></div>`,
    )
    .join("")}</dl></section>`;

// 펼친 주의 하루 한 줄 — 날짜 · 실제 시각(짝마다 한 줄) · 회색 「예정」 줄 · 상태(12px 글자, 주의할 것만 먹색). 근무스케줄이 없는 날은 「예정 없음」(2026-11-24)
const dayLine = (day, lines, { plan, status = [], muted = false } = {}) =>
  `<li><div class="flex items-start gap-[8px] py-[10px]"><span class="w-[64px] shrink-0 text-[13px] font-semibold">${day}</span><span class="flex min-w-0 flex-1 flex-col text-[13px] tabular-nums ${muted ? "text-staff-text-muted" : ""}">${lines
    .map((l) => `<span>${l}</span>`)
    .join("")}${plan ? `<span class="pt-[2px] text-[12px] text-staff-text-muted">${plan}</span>` : ""}</span>${
    status.length
      ? `<span class="flex shrink-0 flex-col items-end gap-[2px] pt-[1px] text-[12px] font-semibold">${status
          .map(([label, warn]) => `<span class="${warn ? "text-staff-text" : "text-staff-text-sub"}">${label}</span>`)
          .join("")}</span>`
      : ""
  }</div></li>`;
const PLAN = "예정 09:00 – 18:00";
const WEEK1 = [
  dayLine("화 9/1", ["08:57 – 18:01"], { plan: PLAN, status: [["정상"]] }),
  dayLine("수 9/2", ["08:55 – 18:00"], { plan: PLAN, status: [["정상"]] }),
  dayLine("목 9/3", ["08:58 – 19:20"], { plan: PLAN, status: [["정상"]] }),
  dayLine("금 9/4", ["08:59 – 18:00"], { plan: PLAN, status: [["정상"]] }),
  dayLine("토 9/5", ["12:56 – 22:00"], { plan: "예정 13:00 – 22:00", status: [["정상"]] }),
  dayLine("일 9/6", ["예정 없음"], { muted: true }),
];
const WEEK2 = [
  dayLine("월 9/7", ["09:00 – 18:00"], { status: [["대신 등록"]] }),
  dayLine("화 9/8", ["08:58 – 18:00"], { plan: PLAN, status: [["정상"]] }),
  dayLine("수 9/9", ["09:14 – 18:02"], { plan: PLAN, status: [["지각 14분", true]] }),
  dayLine("목 9/10", ["09:02 – 근무 중"], { plan: PLAN, status: [["근무 중"]] }),
  dayLine("금 9/11", [PLAN]),
  dayLine("토 9/12", ["예정 13:00 – 22:00"]),
  dayLine("일 9/13", ["예정 없음"], { muted: true }),
];
// 주 한 줄 — 주 이름 굵게 왼쪽 · 날짜 오른쪽 회색, 둘째 줄은 둥근 꺾은선(subLine) 요약을 회색 한 가지로(단위 없이 「근무 2 · 지각 2」).
// 누르면 그 주의 날짜 줄을 옅은 회색 상자로 펼친다(데모는 details). 기록 없는 주 · 아직 오지 않은 주는 펼치지 않고 꺾쇠 자리만 남긴다(2026-11-24)
const chevron = (hidden) =>
  `<span aria-hidden="true" class="flex text-staff-text-sub ${hidden ? "invisible" : ""} transition-transform duration-150 ${EASE_OUT} rotate-180 group-open:rotate-0">${maskIcon("chevron-down.svg", 16)}</span>`;
const weekHead = (name, range, sub, { current = false, dim = false } = {}) =>
  `<span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="flex items-baseline justify-between gap-[8px] ${dim ? "text-staff-text-muted" : ""}"><span class="text-[14px] font-semibold">${name}${
    current ? `<span class="pl-[6px] text-[12px] font-normal text-staff-text-sub">이번 주</span>` : ""
  }</span><span class="text-[12px] text-staff-text-sub tabular-nums">${range}</span></span>${subLine(sub)}</span>`;
const sep = `<span aria-hidden="true">·</span>`;
const summaryLine = (parts) => `<span class="flex flex-wrap items-center gap-x-[6px]">${parts.map((p) => `<span>${p}</span>`).join(sep)}</span>`;
const weekRow = (name, range, parts, days, { current = false, open = false } = {}) =>
  `<li><details class="group"${open ? " open" : ""}><summary class="flex w-full cursor-pointer list-none items-center gap-[10px] py-[14px] text-left [&::-webkit-details-marker]:hidden">${weekHead(
    name,
    range,
    summaryLine(parts),
    { current },
  )}${chevron(false)}</summary><ul class="mb-[14px] flex flex-col divide-y divide-staff-border rounded-[12px] bg-staff-bg px-[12px]">${days.join("")}</ul></details></li>`;
const weekRowStill = (name, range, sub, { upcoming = false } = {}) =>
  `<li class="${upcoming ? "opacity-55" : ""}"><div class="flex w-full items-center gap-[10px] py-[14px]">${weekHead(name, range, sub, { dim: true })}${chevron(!upcoming)}</div></li>`;

const periodView = () =>
  `${periodField()}${periodSummary()}<ul class="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">${weekRow(
    "9월 1주",
    "8/31 – 9/6",
    ["40시간 12분", "근무 5"],
    WEEK1,
  )}${weekRow("9월 2주", "9/7 – 9/13", ["23시간 04분", "근무 4", "지각 2"], WEEK2, { current: true, open: true })}${weekRowStill("9월 3주", "9/14 – 9/20", "근무 예정", {
    upcoming: true,
  })}${weekRowStill("9월 4주", "9/21 – 9/27", "근무 예정", { upcoming: true })}${weekRowStill("9월 5주", "9/28 – 10/4", "근무 예정", {
    upcoming: true,
  })}</ul><p class="px-[4px] text-[12px] text-staff-text-muted">출퇴근 기록은 기록한 날로부터 3년 동안 조회할 수 있습니다.<br>기록이 실제와 다르면 근무지 관리자에게 문의해 주세요.</p>`;

// 경고 아이콘(목업 ph-warning). 저장소에 맞는 SVG 가 없어 여기서만 그린다. 20px 칸 가운데.
const warningIcon = () =>
  `<span aria-hidden="true" class="flex w-[20px] shrink-0 items-start justify-center pt-[2px]"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.13 1.5a1 1 0 0 1 1.74 0l6.5 11.5A1 1 0 0 1 14.5 14.5h-13a1 1 0 0 1-.87-1.5zM7.25 6v4h1.5V6zm.75 5.25a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8"></path></svg></span>`;

// 확인 필요 꼬리표가 붙은 하루 카드. 모양은 AttendanceDayCard(radius 18 · 위 20 좌우 20 아래 32 · 사이 3)와 같고,
// 바탕·글자만 경고 칩(StatusChip warning)과 같은 호박색 계열이다(칩이 묻히지 않게 바탕은 칩보다 한 단계 옅다) — 목업 card--amber, 이 카드에만 나와 토큰으로 두지 않는다.
// 카드 전체가 사유 시트를 여는 버튼이다. 공통으로 올린다면 AttendanceDayCard 의 state 에 "flagged" 를 더하는 쪽이다.
const flaggedDayCard = ({ day, summary, worked, sheet }) =>
  `<button type="button" data-open="${sheet}" class="flex w-full flex-col gap-[3px] rounded-[18px] border border-[#f6e3bd] bg-[#fffbf2] px-[20px] py-[20px] text-left text-[#6f4608] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-[#fff3dc]"><span class="flex w-full items-center gap-[8px] pb-[5px]"><span class="min-w-0 flex-1 text-[13px] font-bold">${day}</span>${statusChip(
    "warning",
    "확인 필요",
  )}</span>${workTimeBar({ schedule: { start: "09:00", end: "18:00" }, worked })}<span class="flex flex-col pt-[2px] text-[13px]">${summary}</span></button>`;

// 확인 필요가 섞인 이번 주. 꼬리표가 붙은 카드와 퇴근 기록 없음 카드는 눌러 시트를 연다. 직원이 누를 처리 버튼은 없다(HIST-3).
// 퇴근 기록 없음(HIST-4): 확인 필요 사유가 아니라 그 날 카드에 붙는 별도 표시라 일반 카드에 둔다.
const flaggedView = () =>
  `<div class="flex gap-[6px] rounded-[12px] border border-[#f6e3bd] bg-[#fff6e5] p-[14px] text-[13px] text-[#6f4608] [&_strong]:font-bold">${warningIcon()}<p class="min-w-0 flex-1"><strong>확인이 필요한 기록이 1건 있습니다.</strong><br>관리자가 확인하고 있습니다.<br>기록이 다르면 근무지 관리자에게 문의해 주세요.</p></div><div class="flex flex-col gap-[12px]">${dayOffRow(
    "월 9/7 · 예정 없음",
  )}${flaggedDayCard({ day: "화 9/8", summary: "09:58 – 18:00 · 반경 밖", worked: { start: "09:58", end: "18:00" }, sheet: "flagTue" })}${pressable(
    "수 9/9 퇴근 기록 없음 보기",
    "flagWed",
    attendanceDayCard({
      state: "done",
      day: "수 9/9",
        status: { label: "퇴근 기록 없음", tone: "neutral" },
      schedule: { start: "09:00", end: "18:00" },
      summary: "출근 09:14 · 퇴근 기록 없음",
    }),
  )}${todayCard()}</div>`;

// 빈 화면(기록 없음 · 근무지 없음). 가운데에 아이콘 · 제목(Title 2) · 설명.
const emptyView = (icon, title, text, flipY = true) =>
  `<div class="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center"><span class="flex pb-[6px] text-staff-text-muted">${maskIcon(icon, 40, flipY)}</span><h2 class="text-[18px] font-bold">${title}</h2><p class="max-w-[250px] text-[14px] text-staff-text-sub">${text}</p></div>`;

const VIEWS = {
  week: weekView,
  period: periodView,
  flagged: flaggedView,
  empty: () => emptyView("history.svg", "출퇴근 기록이 없습니다", "출근을 등록하면 여기에 표시됩니다."),
  nosite: () => emptyView("store-line.svg", "근무가 종료되었습니다", "지난 출퇴근 기록은<br>근무지 관리자에게 문의해 주세요.", false),
};

// 확인 필요 시트의 근무지 관리자 문의 안내(HIST-3).
const storeNotice = () =>
  notice(
    "관리자가 확인하고 있습니다.<br>기록이 다르면 <strong>근무지 관리자에게 문의해 주세요.</strong>",
    maskIcon("store-line.svg", 16),
  );

const SHEETS = {
  periodCal: (a) => bottomSheet("periodCal", { title: "조회 기간", closeLabel: "취소", ...a }, periodCalendar()),
  editInfo: (a) =>
    bottomSheet(
      "editInfo",
      { title: "관리자가 수정한 기록입니다", ...a },
      sunken(
        values([
          ["수정 전 퇴근", "17:48"],
          ["수정 후 퇴근", "18:02"],
          ["수정한 사람", "박지수 매니저"],
          ["수정 시각", "9월 9일 22:10"],
          ["사유", "퇴근 미등록으로 정정"],
        ]),
      ) + `<p class="text-[12px] text-staff-text-muted">기록이 다르면 근무지 관리자에게 문의해 주세요.</p>`,
    ),
  proxyInfo: (a) =>
    bottomSheet(
      "proxyInfo",
      { title: "관리자가 대신 등록한 기록입니다", ...a },
      sunken(
        values([
          ["출근 · 퇴근", "09:00 · 18:00"],
          ["등록한 사람", "박지수 매니저"],
          ["등록 시각", "9월 7일 18:05"],
          ["사유", "위치정보 동의 없음"],
        ]),
      ) +
        `<p class="text-[12px] text-staff-text-muted">기록이 다르면 근무지 관리자에게 문의해 주세요.<br>앱으로 직접 등록하려면 위치정보 수집·이용에 다시 동의해야 합니다.</p>`,
    ),
  flagTue: (a) =>
    bottomSheet(
      "flagTue",
      {
        title: "매장 범위 밖에서 출근했습니다",
        description: "출근 시각 09:58은 등록되었습니다.<br>기록에 확인 필요가 붙었고, 관리자가 검토하고 있습니다.",
        ...a,
      },
      storeNotice(),
    ),
  flagWed: (a) =>
    bottomSheet(
      "flagWed",
      {
        title: "퇴근 기록이 없습니다",
        description: "09:14 출근 기록만 있고 퇴근 기록이 없습니다.",
        ...a,
      },
      notice("퇴근을 등록하지 못했다면<br><strong>근무지 관리자에게 문의해 주세요.</strong>", maskIcon("store-line.svg", 16)),
    ),
};

// 한 상태의 화면. 시트 상태는 뒤 화면을 깔고 그 시트를 바로 연다(닫으면 뒤 화면 상태로).
// 뒤 화면에서 카드로 여는 시트도 같은 블록에 둔다(React 순서: 보정 · 대신 등록 · 위치 실패 · 퇴근 기록 없음).
function screen(id) {
  const view = SHEET_BASE[id] ?? id;
  const tab = view === "period" ? "period" : "week";
  const tabGo = { week: { "data-go": "week", "data-dir": "nav-back" }, period: { "data-go": "period" } };
  const sheets = Object.keys(SHEET_BASE)
    .filter((s) => SHEET_BASE[s] === view)
    .map((s) => SHEETS[s](s === id ? { "data-sheet-auto": true, "data-on-close": `#${view}` } : {}))
    .join("");
  const header = `<header class="flex flex-col bg-white px-[24px] pt-[16px] pb-[8px]"><div class="flex min-h-[44px] items-center gap-[12px]"><a href="${page("check-in")}" data-dir="nav-back" aria-label="뒤로" class="-ml-[10px] flex size-[44px] shrink-0 items-center justify-center">${img(
    "back.svg",
    19,
    19,
    "-scale-y-100",
  )}</a><h1 class="min-w-0 flex-1 truncate text-[22px] leading-[1.4] font-bold">출퇴근 현황</h1></div><div class="flex min-h-[44px] items-center justify-between gap-[10px]">${
    view === "nosite" ? "<span></span>" : `<p class="flex min-w-0 items-center gap-[6px] text-[15px] font-bold">${storeMark()}<span class="truncate">${STORE}</span></p>`
  }${pillLink(page("check-in"), "출퇴근하기")}</div></header>`;
  return `<div class="flex flex-1 flex-col leading-[1.5]">${header}<main class="flex flex-1 flex-col gap-[12px] px-[22px] pt-[12px] pb-[24px]">${
    view !== "nosite"
      ? segmentedControl({
          label: "기간",
          panelId: PANEL,
          value: tab,
          items: [
            { value: "week", label: "이번 주" },
            { value: "period", label: "기간별" },
          ],
          // 지금 탭을 다시 누르면 아무 일도 없다(React handleTabChange).
          itemAttrs: { [tab === "week" ? "period" : "week"]: tabGo[tab === "week" ? "period" : "week"] },
        })
      : ""
  }<div class="flex flex-1 flex-col gap-[12px]"${
    view !== "nosite" ? ` id="${PANEL}" role="tabpanel" aria-labelledby="${segmentTabId(PANEL, tab)}"` : ""
  }>${VIEWS[view]()}</div></main></div><div class="sticky bottom-0 mt-auto">${bottomNav("check-in")}</div>${sheets}`;
}

export default () => ({
  title: "출퇴근 현황",
  states: STATES,
  html: STATES.map((s) => state(s.id, screen(s.id))).join(""),
});
