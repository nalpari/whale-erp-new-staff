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
  pageHeader,
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
  { id: "period", label: "기간별", note: "시작일–종료일" },
  { id: "flagged", label: "확인 필요 섞임", note: "위치 실패·퇴근 기록 없음" },
  { id: "empty", label: "기록 없음", note: "빈 상태" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "editInfo", label: "보정 기록", note: "시트 · 수 9/9 연필 표시" },
  { id: "proxyInfo", label: "대신 등록 기록", note: "시트 · 월 9/7 연필 표시" },
  { id: "flagTue", label: "반경 밖 출근", note: "시트 · 확인 필요" },
  { id: "flagWed", label: "퇴근 기록 없음", note: "시트 · 수 9/9" },
];
// 시트마다 뒤에 깔리는 상태.
const SHEET_BASE = { editInfo: "week", proxyInfo: "week", flagTue: "flagged", flagWed: "flagged" };

const STORE = "웨일카페 강남역점";
const PANEL = "attendance-panel";

// 연필 표시가 있는 카드 위에 덮는 투명 버튼. 연필(11px)만 누르게 하면 44px 를 못 채워 카드 전체를 누르는 칸으로 둔다.
const pressable = (label, sheet, children) =>
  `<div class="relative">${children}<button type="button" aria-label="${label}" data-open="${sheet}" class="absolute inset-0 rounded-[18px] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary/5"></button></div>`;

const todayCard = () =>
  attendanceDayCard({
    state: "today",
    day: "목 9/10",
    store: STORE,
    status: { label: "근무 중", tone: "working" },
    schedule: { start: "09:00", end: "18:00" },
    worked: { start: "09:02", end: "14:00" },
    ongoing: true,
    summary: "출근 09:02 · 퇴근 진행 중",
  });

// 이번 주 — Figma node 12:1233 의 하루 카드 그대로. 연필 표시가 있는 카드(대신 등록 · 보정)는 눌러 시트를 연다.
const weekView = () =>
  `<div class="flex flex-col gap-[8px]">${pressable(
    "월 9/7 대신 등록 정보 보기",
    "proxyInfo",
    attendanceDayCard({
      state: "done",
      day: "월 9/7",
      store: STORE,
      edited: true,
      status: { label: "대신 등록", tone: "neutral" },
      schedule: { start: "09:00", end: "18:00" },
      worked: { start: "09:00", end: "18:00" },
      summary: "출근 09:00 · 퇴근 18:00",
    }),
  )}${attendanceDayCard({
    state: "done",
    day: "화 9/8",
    store: STORE,
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
      store: STORE,
      edited: true,
      status: { label: "지각 14분", tone: "warning" },
      schedule: { start: "09:00", end: "18:00" },
      worked: { start: "09:14", end: "18:02" },
      summary: "출근 09:14 · 퇴근 18:02",
    }),
  )}${todayCard()}${attendanceDayCard({
    state: "upcoming",
    day: "금 9/11",
    store: STORE,
    schedule: { start: "09:00", end: "18:00" },
    summary: "아직 근무 전입니다 · 예정 09:00 – 18:00",
  })}${attendanceDayCard({
    state: "upcoming",
    day: "토 9/12",
    store: STORE,
    schedule: { start: "13:00", end: "22:00" },
    summary: "아직 근무 전입니다 · 예정 13:00 – 22:00",
  })}${dayOffRow("일 9/13 · 휴무")}</div>`;

// 주별 한 줄. 이번 주는 지금 근무 중이라 설명을 남보라로, 아직 오지 않은 주는 흐리게(목업 opacity 0.55).
const weekRow = (title, sub, { current = false, upcoming = false } = {}) =>
  `<li class="flex flex-col gap-[2px] py-[14px] ${upcoming ? "opacity-55" : ""}"><p class="text-[14px] font-semibold ${upcoming ? "text-staff-text-muted" : ""}">${title}</p><p class="text-[12px] ${current ? "text-staff-primary" : "text-staff-text-sub"}">${sub}</p></li>`;

// 기간별 — 시작일·종료일을 직접 고른다. 들어오면 이번 달(9월)이 잡혀 있다. 누계·주별 줄은 목업의 고정 값이다.
// 한 번에 고를 수 있는 폭이 1년이라 시작일·종료일 서로의 min·max 를 1년으로 묶는다(처음 값: 2026-09-01 – 2026-09-30).
const periodView = () =>
  `${card(
    `<p class="text-[13px] font-semibold text-staff-text-sub">기간 고르기</p><div class="flex items-center gap-[8px] pt-[8px]"><input type="date" aria-label="시작일" min="2025-09-30" max="2026-09-30" class="${FIELD}" value="2026-09-01"><span aria-hidden="true" class="text-[12px] text-staff-text-muted">–</span><input type="date" aria-label="종료일" min="2026-09-01" max="2027-09-01" class="${FIELD}" value="2026-09-30"></div><div class="pt-[8px]">${button("조회", { "data-toast": "기간 기록을 불러왔습니다" })}</div><p class="pt-[8px] text-[12px] text-staff-text-muted [&_b]:font-bold">기본은 이번 달입니다. 한 번에 <b>최대 1년</b>까지 고를 수 있습니다.</p>`,
  )}${sunken(
    `<p class="text-[13px] font-semibold text-staff-text-sub">고른 기간 누계 · 9월 1일 – 30일</p><div class="flex flex-wrap items-baseline gap-x-[14px] pt-[6px]"><p class="text-[28px] font-bold [&_span]:text-[17px]">63<span>시간</span> 16<span>분</span></p><span class="text-[12px] text-staff-text-sub">지각 1회 · 연장 1시간 20분</span></div>`,
  )}<ul class="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">${weekRow(
    "9월 1주 · 8/31 – 9/6",
    "근무 5일 · 40시간 12분 · 지각 0 · 연장 1시간 20분",
  )}${weekRow("9월 2주 · 9/7 – 9/13", "이번 주 · 진행 중 · 23시간 04분 · 지각 1회", { current: true })}${weekRow(
    "9월 3주 · 9/14 – 9/20",
    "예정 · 아직 근무 전입니다",
    { upcoming: true },
  )}${weekRow("9월 4주 · 9/21 – 9/27", "예정 · 아직 근무 전입니다", { upcoming: true })}</ul><p class="text-[12px] text-staff-text-muted">기록은 3년 보존됩니다. 1년은 한 번에 조회하는 폭의 제한입니다.</p>`;

// 경고 아이콘(목업 ph-warning). 저장소에 맞는 SVG 가 없어 여기서만 그린다. 20px 칸 가운데.
const warningIcon = () =>
  `<span aria-hidden="true" class="flex w-[20px] shrink-0 items-start justify-center pt-[2px]"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.13 1.5a1 1 0 0 1 1.74 0l6.5 11.5A1 1 0 0 1 14.5 14.5h-13a1 1 0 0 1-.87-1.5zM7.25 6v4h1.5V6zm.75 5.25a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8"></path></svg></span>`;

// 확인 필요 꼬리표가 붙은 하루 카드. 모양은 AttendanceDayCard(radius 18 · 위 20 좌우 20 아래 32 · 사이 3)와 같고,
// 바탕·글자만 경고 칩(StatusChip warning)과 같은 호박색 계열이다(칩이 묻히지 않게 바탕은 칩보다 한 단계 옅다) — 목업 card--amber, 이 카드에만 나와 토큰으로 두지 않는다.
// 카드 전체가 사유 시트를 여는 버튼이다. 공통으로 올린다면 AttendanceDayCard 의 state 에 "flagged" 를 더하는 쪽이다.
const flaggedDayCard = ({ day, summary, worked, sheet }) =>
  `<button type="button" data-open="${sheet}" class="flex w-full flex-col gap-[3px] rounded-[18px] border border-[#f6e3bd] bg-[#fffbf2] px-[20px] pt-[20px] pb-[32px] text-left text-[#6f4608] transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-[#fff3dc]"><span class="flex w-full items-center gap-[8px] pb-[5px]"><span class="min-w-0 flex-1 text-[13px] font-bold">${day}</span><span class="truncate text-[12px]">${STORE}</span>${statusChip(
    "warning",
    "확인 필요",
  )}</span>${workTimeBar({ schedule: { start: "09:00", end: "18:00" }, worked })}<span class="pt-[2px] text-[13px]">${summary}</span></button>`;

// 확인 필요가 섞인 이번 주. 꼬리표가 붙은 카드와 퇴근 기록 없음 카드는 눌러 시트를 연다. 직원이 누를 처리 버튼은 없다(HIST-3).
// 퇴근 기록 없음(HIST-4): 확인 필요 사유가 아니라 그 날 카드에 붙는 별도 표시라 일반 카드에 둔다.
const flaggedView = () =>
  `<div class="flex gap-[6px] rounded-[12px] border border-[#f6e3bd] bg-[#fff6e5] p-[14px] text-[13px] text-[#6f4608] [&_strong]:font-bold">${warningIcon()}<p class="min-w-0 flex-1"><strong>확인이 필요한 기록이 1건 있습니다.</strong><br>관리자가 확인 중입니다. 기록이 다르면 <strong>근무지 점포에 말씀해 주세요.</strong> 확인이 끝나면 이 표시와 사유는 사라집니다.</p></div><div class="flex flex-col gap-[8px]">${dayOffRow(
    "월 9/7 · 휴무",
  )}${flaggedDayCard({ day: "화 9/8", summary: "반경 밖 출근 · 09:58 등록됨", worked: { start: "09:58", end: "18:00" }, sheet: "flagTue" })}${pressable(
    "수 9/9 퇴근 기록 없음 보기",
    "flagWed",
    attendanceDayCard({
      state: "done",
      day: "수 9/9",
      store: STORE,
      status: { label: "퇴근 기록 없음", tone: "neutral" },
      schedule: { start: "09:00", end: "18:00" },
      summary: "출근 09:14 · 퇴근 기록 없음 · 근무지 관리자에게 문의",
    }),
  )}${todayCard()}</div>`;

// 빈 화면(기록 없음 · 근무지 없음). 가운데에 아이콘 · 제목(Title 2) · 설명.
const emptyView = (icon, title, text) =>
  `<div class="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center"><span class="flex pb-[6px] text-staff-text-muted">${maskIcon(icon, 40, true)}</span><h2 class="text-[18px] font-bold">${title}</h2><p class="max-w-[250px] text-[14px] text-staff-text-sub">${text}</p></div>`;

const VIEWS = {
  week: weekView,
  period: periodView,
  flagged: flaggedView,
  empty: () => emptyView("history.svg", "등록된 출퇴근 기록이 없습니다", "근무를 시작하면 이곳에 기록이 쌓입니다."),
  nosite: () => emptyView("store.svg", "근무지가 없습니다", "연결된 근무지가 없어 출퇴근 기록을 보여 줄 수 없습니다. 지난 기록은 관리자에게 문의해 주세요."),
};

// 확인 필요 시트의 점포 안내(HIST-3 확정 문구).
const storeNotice = () =>
  notice(
    "관리자가 확인 중입니다. 기록이 다르면 <strong>근무지 점포에 말씀해 주세요.</strong> 확인이 끝나면 이 표시와 사유는 사라집니다.",
    maskIcon("store-small.svg", 16),
  );

const SHEETS = {
  editInfo: (a) =>
    bottomSheet(
      "editInfo",
      { title: "관리자가 수정한 기록입니다", ...a },
      sunken(
        values([
          ["수정 전 퇴근", "17:48"],
          ["수정 후 퇴근", "18:02"],
          ["수정자", "박지수 매니저"],
          ["수정 시각", "9월 9일 22:10"],
          ["사유", "퇴근 시각 미태깅 정정"],
        ]),
      ) + `<p class="text-[12px] text-staff-text-muted">수정은 관리자 웹에서만 할 수 있습니다. 이 화면은 이력 조회만 제공합니다.</p>`,
    ),
  proxyInfo: (a) =>
    bottomSheet(
      "proxyInfo",
      {
        title: "관리자가 대신 등록한 기록입니다",
        description: "위치정보 동의가 없어 앱으로 등록할 수 없는 경우입니다. 근무지 관리자가 출퇴근 시각을 대신 등록했습니다.",
        ...a,
      },
      sunken(
        values([
          ["출근 · 퇴근", "09:00 · 18:00"],
          ["등록한 사람", "박지수 매니저"],
          ["등록 시각", "9월 7일 18:05"],
          ["사유", "위치정보 동의 없음"],
        ]),
      ) +
        `<p class="text-[12px] text-staff-text-muted">기록이 다르면 근무지 점포에 말씀해 주세요. 앱에서 직접 등록하려면 위치정보 수집에 다시 동의해야 합니다.</p>`,
    ),
  flagTue: (a) =>
    bottomSheet(
      "flagTue",
      {
        title: "반경 밖 출근",
        description: "매장 범위 밖에서 출근을 등록해 확인 필요가 붙었습니다. 출근 시각 09:58은 등록되었고 관리자가 검토하고 있습니다.",
        ...a,
      },
      storeNotice(),
    ),
  flagWed: (a) =>
    bottomSheet(
      "flagWed",
      {
        title: "퇴근 기록 없음",
        description:
          "09:14에 출근한 기록만 있고 퇴근 기록이 없습니다. 퇴근을 찍지 못했다면 근무지 관리자에게 문의해 주세요. 관리자가 퇴근 시각을 보정하면 이 표시는 사라집니다.",
        ...a,
      },
      notice("<strong>근무지 관리자에게 문의</strong>해 주세요. 앱에서 직접 고칠 수는 없습니다.", maskIcon("store-small.svg", 16)),
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
  return `<div class="flex flex-1 flex-col leading-[1.5]">${pageHeader("출퇴근 현황", {
    backHref: page("home"),
    action: `<a href="${page("check-in")}" aria-label="출퇴근 등록" class="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">${img("history.svg", 21, 21, "-scale-y-100")}</a>`,
  })}<main class="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px]">${
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
  }<div class="flex flex-1 flex-col gap-[20px]"${
    view !== "nosite" ? ` id="${PANEL}" role="tabpanel" aria-labelledby="${segmentTabId(PANEL, tab)}"` : ""
  }>${VIEWS[view]()}</div></main></div><div class="sticky bottom-0 mt-auto">${bottomNav("check-in")}</div>${sheets}`;
}

export default () => ({
  title: "출퇴근 현황",
  states: STATES,
  html: STATES.map((s) => state(s.id, screen(s.id))).join(""),
});
