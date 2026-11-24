// 직원 근무 앱 데모 · 근무. 옛 React 판 src/app/demo/work(page.tsx · todo-panel.tsx · month-calendar.tsx)를 옮겼다.
// 기준 목업: docs/mockup/app/work.html — 상태 6개(월 달력 · TO-DO 목록 · 완료 처리 직후 · 공유 TO-DO 선점됨 · 근무지 없음 · 등록된 근무 없음)와
// 시트 2개(긴급 TO-DO 상세 · 공유 TO-DO 안내). 쟁점 WORK-1~4 는 모두 확정이고 그대로 따른다:
//   WORK-1 근무스케줄은 월 달력, 고른 날 상세는 달력 아래 · WORK-2 근무 화면 안에서 근무스케줄·TO-DO 탭으로 나눔
//   WORK-3 공유 TO-DO 수행자 이름 공개 · WORK-4 근무지 전환은 홈 상단과 이 화면의 근무지 카드 두 곳, 같은 앱 전역 근무지(2026-10-20)
// 화면 틀은 Figma 06.근무 정보(node 15:183 · 본문 15:193), TO-DO 목록은 Figma 07.근무 정보_list(node 17:602~)를 따른다.
// 월 달력 · 고른 날 상세 · 근무지 없음 · 등록된 근무 없음 · 시트 2개는 Figma 없음 — DESIGN.md 기준 초안. 하단 메뉴는 다섯 칸(2026-10-08 재영 결정).
// TO-DO 줄은 체크칸 · 제목 어디를 눌러도 상세 시트를 열고 상태는 시트에서 바꾼다(개발 화면과 같다, 2026-11-23). 시트에서 고른 상태는 칩만 옮기고 목록은 그대로다.
import {
  STORES,
  bottomNav,
  card,
  iconTile,
  img,
  maskIcon,
  page,
  tabHeader,
  topBar,
  storeSheet,
  periodNav,
  segmentedControl,
  segmentTabId,
  state,
  statusChip,
  sunken,
  todoItem,
  todoList,
  todoSheet,
  values,
  workTimeBar,
} from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. fridge·sharedInfo 는 목업의 「시트 열기」라 TO-DO 목록 위에 시트를 띄운다.
const STATES = [
  { id: "week", label: "월 달력", note: "고른 날 상세" },
  { id: "todo", label: "TO-DO 목록", note: "5건" },
  { id: "todo-done", label: "완료 처리 직후", note: "시트에서 완료" },
  { id: "shared", label: "공유 TO-DO 선점됨", note: "동료가 먼저 완료" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "empty", label: "등록된 근무 없음", note: "빈 상태" },
  { id: "fridge", label: "긴급 TO-DO 상세", note: "냉장고 점검" },
  { id: "sharedInfo", label: "공유 TO-DO 안내", note: "한 명 수행" },
];
const isSheet = (id) => id === "fridge" || id === "sharedInfo";
const isTodo = (id) => id === "todo" || id === "todo-done" || id === "shared";

const STORE = "웨일카페 강남역점";
const PANEL = "work-panel";

// ── 월 달력(month-calendar.tsx) ──
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const TODAY = 10;
// 2026-09-01 은 화요일이라 월요일 시작 칸 번호(0=월)는 날짜 % 7 이다.
const timeOf = (date) => {
  const weekday = date % 7;
  if (weekday === 0 || weekday === 6) return null;
  return weekday === 5 ? "13–22" : "09–18";
};
const CELLS = [
  { key: "08-31", date: 31, outside: true },
  ...Array.from({ length: 30 }, (_, i) => ({ key: `09-${i + 1}`, date: i + 1, time: timeOf(i + 1) })),
  ...[1, 2, 3, 4].map((date) => ({ key: `10-${date}`, date, outside: true })),
];
// 목업처럼 오늘 칸만 누를 수 있고, 누르면 토스트 「9월 10일을 골랐습니다」.
const monthCalendar = () =>
  `<div class="flex flex-col gap-[4px]"><div class="grid grid-cols-7 gap-[4px]" aria-hidden="true">${WEEKDAYS.map((w) => `<p class="text-center text-[12px] text-staff-text-muted">${w}</p>`).join(
    "",
  )}</div><div class="grid grid-cols-7 gap-[4px]">${CELLS.map((cell) => {
    const today = !cell.outside && cell.date === TODAY;
    const tone = cell.outside
      ? "border-transparent text-staff-placeholder"
      : today
        ? "border-staff-primary bg-staff-primary text-white shadow-[0_5px_6px_rgba(49,93,245,0.16)]"
        : cell.time
          ? "border-[#dce4ff] bg-[#eef2ff] text-staff-text-sub"
          : "border-staff-border-light bg-white text-staff-placeholder";
    const body = `<span class="text-[14px] font-bold">${cell.date}</span>${cell.time ? `<span class="text-[10px] ${today ? "" : "text-staff-primary"}">${cell.time}</span>` : ""}`;
    const shell = `flex min-h-[52px] min-w-0 flex-col items-center gap-[2px] rounded-[12px] border pt-[6px] leading-[1.5] ${tone}`;
    return today
      ? `<button type="button" aria-pressed="true" aria-label="9월 ${cell.date}일 오늘 ${cell.time ?? "휴무"}" data-toast="9월 10일을 골랐습니다" class="${shell}">${body}</button>`
      : `<div${cell.outside ? ' aria-hidden="true"' : ""} class="${shell}">${body}</div>`;
  }).join("")}</div></div>`;

// ── TO-DO 탭(todo-panel.tsx) ──
const TODOS = [
  { id: "fridge", title: "냉장고 온도 점검 및 사진 제출", meta: "9월 10일(목) 14:00", status: "waiting", due: "09-10 14:00", urgent: true, sheet: "fridge", body: "강남역점 냉장·냉동고 온도를 확인하고 온도계가 보이는 사진을 찍어 관리자에게 전송한다. 이상 온도가 발견되면 즉시 전화로도 알린다.", dueLabel: "9월 10일(목) 14:00" },
  { id: "clean", title: "마감 청소 사진 촬영", meta: "9월 9일(수) · 기한 지남", status: "waiting", due: "09-09", overdue: true, sheet: "clean", body: "마감 청소를 마친 뒤 홀 · 주방 · 화장실 사진을 한 장씩 찍어 관리자에게 전송한다.", dueLabel: "9월 9일(수) · 시간 미정" },
  { id: "menu", title: "신메뉴 시식 후 피드백 작성", meta: "9월 10일(목) · 시간 미정", status: "progress", due: "09-10", sheet: "menu", body: "가을 신메뉴 두 가지를 시식하고 맛 · 양 · 담음새 의견을 남긴다.", dueLabel: "9월 10일(목) · 시간 미정" },
  { id: "stock", title: "매장 재고 실사 보조", meta: "9월 11일(금) 10:00", status: "waiting", due: "09-11 10:00", shared: true, sheet: "sharedInfo", body: "강남역점 재고 실사를 돕는다. 강남역점 근무 직원 4명 전체에게 배정되었고, 그중 한 명만 완료 처리하면 나머지 전원에게도 완료로 표시된다.", dueLabel: "9월 11일(금) 10:00" },
  { id: "pop", title: "여름 시즌 POP 철거", meta: "9월 8일(화) 16:40 완료", status: "done", due: "09-08 16:40", sheet: "pop", body: "매장 안팎의 여름 시즌 POP 와 배너를 떼어 창고에 보관한다.", dueLabel: "9월 8일(화) 16:00" },
];
const todosOf = (s) =>
  TODOS.map((t) => {
    if (s === "todo-done" && t.id === "fridge") return { ...t, status: "done", meta: "9월 10일(목) 14:03 완료" };
    if (s === "shared" && t.id === "stock") return { ...t, status: "done", doneByOther: true, meta: "정민준이 9월 11일(금) 10:42에 완료했습니다" };
    return t;
  });
const rank = (t) => (t.status === "done" ? 2 : t.urgent ? 0 : 1);
const STATUS = {
  waiting: { label: "대기", tone: "neutral" },
  progress: { label: "진행 중", tone: "progress" },
  done: { label: "완료", tone: "success" },
};

// 공통 TodoItem 줄. 체크칸 · 제목 칸 어디를 눌러도 그 TO-DO 상세 시트를 연다 — 체크 한 번에 바로 완료되지 않고 상태는 시트에서 바꾼다
// (개발 화면 work/todo-panel.tsx, 2026-11-23 사용자 지정). 완료된 건도 시트를 연다(공유 TO-DO 는 수행자 안내).
const todoRow = (t) => {
  const done = t.status === "done";
  const badges =
    (t.urgent && !done ? statusChip("warning", "긴급", "semibold") : "") +
    (t.shared ? statusChip("neutral", "공유", "semibold") : "") +
    statusChip(STATUS[t.status].tone, t.doneByOther ? "완료됨" : STATUS[t.status].label, "semibold");
  return todoItem({ title: t.title, meta: t.meta, done, overdue: t.overdue && !done, open: t.sheet, badges });
};
// 목록은 흰 상자 안에 — 회색 바탕에 줄만 있으면 비어 보였다(2026-11-23 사용자 지정). 근무스케줄 · 급여명세서 목록 상자와 같은 모양.
const todoPanel = (s) => {
  const todos = todosOf(s).sort((a, b) => rank(a) - rank(b) || a.due.localeCompare(b.due));
  const count = (st) => todos.filter((t) => t.status === st).length;
  // 상태 칩 [전체] [대기] [진행 중] [완료] — 내 근무지 상태 칩과 같은 모양, 0건도 보인다(개발 화면 todo-panel, 2026-11-23). 목록 상자는 남는 높이를 채운다.
  const chip = (label, n, on) =>
    `<button type="button" aria-pressed="${on}" class="flex h-[36px] items-center gap-[4px] rounded-full border px-[14px] text-[13px] font-semibold ${on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text-sub"}">${label} <span class="tabular-nums">${n}</span></button>`;
  return `<div class="flex flex-1 flex-col gap-[12px]"><div role="group" aria-label="TO-DO 상태" class="flex flex-wrap gap-[8px]">${chip("전체", todos.length, true)}${chip("대기", count("waiting"), false)}${chip("진행 중", count("progress"), false)}${chip("완료", count("done"), false)}</div><section class="flex flex-1 flex-col rounded-[20px] border border-staff-border-light bg-white px-[20px]">${todoList(todos.map(todoRow).join(""))}</section></div>`;
};

// ── 근무스케줄 탭(week) ──
const storeSmall = () => `<span class="flex text-staff-text">${maskIcon("store-line.svg", 16)}</span>`;
const schedule = () =>
  `<section class="flex flex-col gap-[8px]">${periodNav({
    label: "2026년 9월",
    prevLabel: "이전 달",
    nextLabel: "다음 달",
    prevAttrs: { "data-toast": "8월로 옮겼습니다" },
    nextAttrs: { "data-toast": "10월로 옮겼습니다" },
  })}<div class="flex flex-col gap-[12px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">${monthCalendar()}<p class="border-t border-staff-border-light pt-[12px] text-[12px] text-staff-text-muted">날짜를 누르면 해당 날짜의 근무 일정을 확인할 수 있습니다.</p></div></section>` +
  `<section class="flex flex-col gap-[8px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">9월 10일 (목)</h2>${card(
    `<div class="flex items-center gap-[12px]">${storeSmall()}<p class="min-w-0 flex-1 truncate text-[14px] font-semibold">${STORE}</p></div>`,
  )}${card(
    `<p class="pb-[8px] text-[13px] font-semibold text-staff-text-sub">근무 시간</p>${workTimeBar({
      schedule: { start: "09:00", end: "18:00" },
      worked: { start: "09:02", end: "14:12" },
      ongoing: true,
    })}<p class="pt-[8px] text-[12px] text-staff-text-muted">점선은 예정, 채운 막대는 실제 근무입니다</p>`,
  )}${sunken(
    values([
      ["예정 시간", "09:00 – 18:00"],
      ["휴게시간", "60분"],
      ["실제 출근", "09:02"],
    ]),
  )}<p class="text-[12px] text-staff-text-muted">근무스케줄 변경은 근무지 관리자에게 문의해 주세요.</p></section>`;
// TO-DO 요약 카드(Figma 06)는 뺐다. TO-DO 는 같은 화면의 TO-DO 탭에서 본다(WORK-5, 2026-10-20 재영).
// 출퇴근 등록으로 가는 버튼은 두지 않는다. 출퇴근은 하단 메뉴의 출퇴근 칸으로 간다(2026-10-12 재영).

// 빈 상태: 가운데 정렬 아이콘 · 제목(18px) · 설명 13px.
const emptyView = (icon, title, description) =>
  `<div class="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center"><span class="flex items-center justify-center pb-[6px] text-staff-placeholder">${icon}</span><p class="text-[18px] font-bold">${title}</p><p class="max-w-[260px] text-[13px] text-staff-text-sub">${description}</p></div>`;

// ── 시트 ──
// TO-DO 상세 시트(개발 화면 TodoSheet): 제목 · 내용 · 칩 · 수행 예정 · 상태 + 상태 바꾸기 [대기] [진행 중] [완료]. 근무지는 TO-DO 가 한 근무지라 두지 않는다.
// 긴급 건의 [완료]는 완료 처리 직후로 옮긴다. 되돌리기 토스트는 없다.
const sheets = (s) => {
  // 시트 상태(fridge·sharedInfo)에서 닫으면 TO-DO 목록으로 돌아간다. 목록에서 연 시트는 닫히기만 한다.
  const a = (name) => (isSheet(s) ? { "data-on-close": "#todo", "data-sheet-auto": s === name } : {});
  return todosOf(s)
    .map((t) => {
      const done = t.status === "done";
      const chips = (t.urgent && !done ? statusChip("warning", "긴급", "semibold") : "") + (t.shared ? statusChip("neutral", "공유", "semibold") : "");
      return todoSheet(t.sheet, {
        title: t.title,
        body: t.body,
        chips,
        rows: [
          ["수행 예정", t.dueLabel],
          ["상태", statusChip(STATUS[t.status].tone, t.doneByOther ? "완료됨" : STATUS[t.status].label, "semibold")],
        ],
        status: t.status,
        shared: t.shared,
        after: t.doneByOther ? `<p class="text-[13px] leading-[1.5] text-staff-text-sub">${t.meta}</p>` : "",
        done: t.urgent ? { "data-go": "todo-done", "data-close": true } : {},
        ...a(t.sheet),
      });
    })
    .join("");
};

const view = (s) => {
  const v = isSheet(s) ? "todo" : s;
  const tab = isTodo(v) ? "todo" : "schedule";
  // 탭: 오른쪽(TO-DO)은 nav-forward, 왼쪽(근무스케줄)은 nav-back. 지금 탭을 누르면 그대로 둔다.
  const tabs =
    v === "nosite"
      ? ""
      : segmentedControl({
          label: "보기",
          panelId: PANEL,
          value: tab,
          items: [
            { value: "schedule", label: "근무스케줄" },
            { value: "todo", label: "TO-DO" },
          ],
          itemAttrs: tab === "todo" ? { schedule: { "data-go": "week", "data-dir": "nav-back" } } : { todo: { "data-go": "todo" } },
        });
  const content =
    v === "nosite"
      ? emptyView(
          maskIcon("store-line.svg", 40),
          "근무가 종료되었습니다",
          "급여명세서는 보존 기간(3년) 동안<br>급여 탭에서 확인할 수 있습니다.",
        )
      : `<div id="${PANEL}" role="tabpanel" aria-labelledby="${segmentTabId(PANEL, tab)}" class="flex ${isTodo(v) ? "flex-1 " : ""}flex-col gap-[12px]">${isTodo(v) ? todoPanel(v) : ""}${
          v === "empty" ? emptyView(iconTile("nav-work.svg", 44), "이번 달 근무가 없습니다", "근무지에서 근무스케줄을 등록하면 여기에 표시됩니다.") : ""
        }${v === "week" ? schedule() : ""}</div>`;
  // 머리줄은 홈 · 출퇴근과 같은 근무지 머리줄(제목 줄 + 근무지 줄) — 근무지 카드는 뺐다. 근무지는 머리줄에서 보이고 바꾼다(2026-11-24)
  const header = tabHeader(
    topBar(
      v === "nosite"
        ? { title: "근무 정보", alarmHref: page("notify"), store: "근무 종료", chevron: false }
        : { title: "근무 정보", alarmHref: page("notify"), store: STORE, storeAttrs: { "data-open": "store" } },
    ),
  );
  return `<div class="flex flex-1 flex-col">${header}<main class="flex flex-col gap-[12px] px-[22px] pt-[12px] pb-[24px] leading-[1.5] ${v === "nosite" || isTodo(v) ? "flex-1" : ""}">${tabs}${content}</main><div class="sticky bottom-0 mt-auto">${bottomNav(
    "work",
  )}</div></div>${v === "nosite" || v === "empty" || v === "week" ? "" : sheets(s)}${v === "nosite" ? "" : storeSheet()}`;
};

export default () => ({
  title: "근무",
  states: STATES,
  html: STATES.map((s) => state(s.id, view(s.id))).join(""),
});
