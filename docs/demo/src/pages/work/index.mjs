// 직원 근무 앱 데모 · 근무. 옛 React 판 src/app/demo/work(page.tsx · todo-panel.tsx · month-calendar.tsx)를 옮겼다.
// 기준 목업: docs/mockup/app/work.html — 상태 6개(월 달력 · TO-DO 목록 · 완료 처리 직후 · 공유 TO-DO 선점됨 · 근무지 없음 · 등록된 근무 없음)와
// 시트 2개(긴급 TO-DO 상세 · 공유 TO-DO 안내). 쟁점 WORK-1~4 는 모두 확정이고 그대로 따른다:
//   WORK-1 근무스케줄은 월 달력, 고른 날 상세는 달력 아래 · WORK-2 근무 화면 안에서 근무스케줄·TO-DO 탭으로 나눔
//   WORK-3 공유 TO-DO 수행자 이름 공개 · WORK-4 근무지 전환은 홈 상단과 이 화면의 근무지 카드 두 곳, 같은 앱 전역 근무지(2026-10-20)
// 화면 틀은 Figma 06.근무 정보(node 15:183 · 본문 15:193), TO-DO 목록은 Figma 07.근무 정보_list(node 17:602~)를 따른다.
// 월 달력 · 고른 날 상세 · 근무지 없음 · 등록된 근무 없음 · 시트 2개는 Figma 없음 — DESIGN.md 기준 초안. 하단 메뉴는 다섯 칸(2026-10-08 재영 결정).
// React 판과 다른 점: 미완료 TO-DO 체크칸을 켜도 체크칸·제목 색만 바뀌고 줄 순서·개수·상태 칩은 그대로다(React 판은 다시 정렬했다).
import {
  STORES,
  bottomNav,
  bottomSheet,
  button,
  card,
  checkBox,
  EASE_OUT,
  img,
  maskIcon,
  notice,
  page,
  pageHeader,
  storeSheet,
  periodNav,
  segmentedControl,
  segmentTabId,
  state,
  statusChip,
  sunken,
  todoList,
  values,
  workTimeBar,
} from "../../ui.mjs";

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
  { id: "fridge", title: "냉장고 온도 점검 및 사진 제출", meta: "9월 10일(목) 14:00", status: "waiting", due: "09-10 14:00", urgent: true, sheet: "fridge" },
  { id: "clean", title: "마감 청소 사진 촬영", meta: "9월 9일(수) · 기한 지남", status: "waiting", due: "09-09", overdue: true },
  { id: "menu", title: "신메뉴 시식 후 피드백 작성", meta: "9월 10일(목) · 시간 미정", status: "progress", due: "09-10" },
  { id: "stock", title: "매장 재고 실사 보조", meta: "9월 11일(금) 10:00", status: "waiting", due: "09-11 10:00", shared: true, sheet: "sharedInfo" },
  { id: "pop", title: "여름 시즌 POP 철거", meta: "9월 8일(화) 16:40 완료", status: "done", due: "09-08 16:40" },
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

// 공통 TodoItem 과 같은 줄에, 제목을 누르면 상세 시트를 여는 버튼만 더했다(목업 row__main 버튼).
// 긴급 건 체크칸은 완료 처리 직후로 옮기고, 나머지 미완료 건은 그 자리에서 켜고 끈다. 완료된 건은 보기 전용.
const todoRow = (t) => {
  const done = t.status === "done";
  const overdue = t.overdue && !done;
  const label = `${t.title} 완료`;
  const box = done
    ? checkBox({ checked: true, label, toggle: false })
    : t.urgent
      ? checkBox({ checked: false, label, "data-go": "todo-done", "data-toast": "완료 처리했습니다" })
      : checkBox({ checked: false, label });
  const text = `<span${done ? "" : " data-check-title"} class="block truncate text-[15px] font-semibold ${done ? "text-staff-text-muted" : "text-staff-text"}">${t.title}</span><span class="block truncate pt-[2px] text-[12px] ${overdue ? "text-[#956013]" : "text-staff-text-sub"}">${t.meta}</span>`;
  const main =
    t.sheet && !t.doneByOther
      ? `<button type="button" data-open="${t.sheet}" class="-my-[4px] flex min-h-[44px] min-w-0 flex-1 flex-col justify-center rounded-[10px] text-left transition-colors duration-150 ${EASE_OUT} active:bg-staff-primary-inactive">${text}</button>`
      : `<div class="min-w-0 flex-1">${text}</div>`;
  const badges =
    (t.urgent && !done ? statusChip("warning", "긴급", "semibold") : "") +
    (t.shared ? statusChip("neutral", "공유", "semibold") : "") +
    statusChip(STATUS[t.status].tone, t.doneByOther ? "완료됨" : STATUS[t.status].label, "semibold");
  return `<li class="flex items-center gap-[12px] py-[17px] leading-[1.5]">${box}${main}<div class="flex shrink-0 gap-[4px]">${badges}</div></li>`;
};
const todoPanel = (s) => {
  const todos = todosOf(s).sort((a, b) => rank(a) - rank(b) || a.due.localeCompare(b.due));
  const count = (st) => todos.filter((t) => t.status === st).length;
  return `<div class="flex flex-col gap-[20px]"><p class="flex gap-[14px] text-[12px] text-staff-text-muted"><span>대기 <b class="text-staff-text">${count("waiting")}</b></span><span>진행 중 <b class="text-[#315df5]">${count(
    "progress",
  )}</b></span><span>완료 <b class="text-[#13785e]">${count("done")}</b></span></p>${todoList(todos.map(todoRow).join(""))}</div>`;
};

// 근무지 카드: 두 탭 위에 두고 누르면 홈과 같은 근무지 고르기 시트를 연다(WORK-4, 2026-10-20 재영). 고른 근무지는 앱 전체가 따른다.
// 근무지가 하나뿐인 직원이면 누를 수 없는 표시로 두고 펼침 표시를 뺀다.
const storeCard = () =>
  `<button type="button" data-open="store" aria-label="근무지 바꾸기, 지금 ${STORE}" class="flex w-full items-center gap-[14px] rounded-[18px] border border-staff-border-light bg-[#eef2ff] px-[20px] py-[18px] text-left">${storeSmall()}<span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="truncate text-[16px] font-bold" data-slot="store">${STORE}</span><span class="text-[12px] text-staff-text-sub">연결된 근무지 ${STORES.length}곳 · 눌러서 바꾸기</span></span>${img("chevron-down.svg", 15, 15, "-scale-y-100")}</button>`;

// ── 근무스케줄 탭(week) ──
const storeSmall = () => img("store-small.svg", 14.625, 13.5);
const schedule = () =>
  `<section class="flex flex-col gap-[8px]">${periodNav({
    label: "2026년 9월",
    prevLabel: "이전 달",
    nextLabel: "다음 달",
    prevAttrs: { "data-toast": "8월로 옮겼습니다" },
    nextAttrs: { "data-toast": "10월로 옮겼습니다" },
  })}<div class="flex flex-col gap-[12px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">${monthCalendar()}<p class="border-t border-staff-border-light pt-[12px] text-[12px] text-staff-text-muted">근무가 있는 날에만 시간이 붙습니다. 날짜를 누르면 아래에 그날 상세가 열립니다.</p></div></section>` +
  `<section class="flex flex-col gap-[8px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">고른 날 · 9월 10일(목)</h2>${card(
    `<div class="flex items-center gap-[12px]">${storeSmall()}<p class="min-w-0 flex-1 truncate text-[14px] font-semibold">${STORE}</p></div>`,
  )}${card(
    `<p class="pb-[8px] text-[13px] font-semibold text-staff-text-sub">근무 시간</p>${workTimeBar({
      schedule: { start: "09:00", end: "18:00" },
      worked: { start: "09:02", end: "14:12" },
      ongoing: true,
    })}<p class="pt-[8px] text-[12px] text-staff-text-muted">점선은 예정, 채운 칠은 실제 기록입니다</p>`,
  )}${sunken(
    values([
      ["예정 시간", "09:00 – 18:00"],
      ["휴게시간", "60분"],
      ["실제 출근", "09:02"],
    ]),
  )}</section>` +
  notice("근무스케줄은 관리자가 등록합니다. 이 화면에서는 조회만 할 수 있습니다.");
// TO-DO 요약 카드(Figma 06)는 뺐다. TO-DO 는 같은 화면의 TO-DO 탭에서 본다(WORK-5, 2026-10-20 재영).
// 출퇴근 등록으로 가는 버튼은 두지 않는다. 출퇴근은 하단 메뉴의 출퇴근 칸으로 간다(2026-10-12 재영).

// 빈 상태: 가운데 정렬 아이콘 · 제목(18px) · 설명 13px.
const emptyView = (icon, title, description) =>
  `<div class="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center"><span class="flex items-center justify-center pb-[6px] text-staff-placeholder">${icon}</span><p class="text-[18px] font-bold">${title}</p><p class="max-w-[260px] text-[13px] text-staff-text-sub">${description}</p></div>`;

// ── 시트 ──
const sheets = (s) => {
  // 시트 상태(fridge·sharedInfo)에서 닫으면 TO-DO 목록으로 돌아간다. 목록에서 연 시트는 닫히기만 한다.
  const a = (name) => (isSheet(s) ? { "data-on-close": "#todo", "data-sheet-auto": s === name } : {});
  return (
    bottomSheet(
      "fridge",
      { title: "냉장고 온도 점검 및 사진 제출", ...a("fridge") },
      `<div class="flex">${statusChip("warning", "긴급")}</div><p class="text-[14px] text-staff-text-sub">강남역점 냉장·냉동고 온도를 확인하고 온도계가 보이는 사진을 찍어 관리자에게 전송한다. 이상 온도가 발견되면 즉시 전화로도 알린다.</p>${sunken(
        values([
          ["수행 예정", "9월 10일(목) 14:00"],
          ["근무지", STORE],
          ["상태", statusChip("neutral", "대기")],
        ]),
      )}${button("완료로 표시", { "data-go": "todo-done", "data-toast": "완료 처리했습니다", "data-close": true })}`,
    ) +
    bottomSheet(
      "sharedInfo",
      { title: "매장 재고 실사 보조", closeLabel: "확인", ...a("sharedInfo") },
      `<div class="flex">${statusChip("neutral", "공유")}</div><p class="text-[14px] text-staff-text-sub">강남역점 재고 실사를 돕는다. 강남역점 근무 직원 4명 전체에게 배정되었고, 그중 한 명만 완료 처리하면 나머지 전원에게도 완료로 표시된다.</p>${notice(
        "먼저 완료 처리한 사람이 수행자로 기록됩니다.",
      )}`,
    )
  );
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
          maskIcon("store.svg", 40, true),
          "근무지가 없습니다",
          "연결된 근무지가 없어 스케줄과 TO-DO 를 보여 줄 수 없습니다. 받은 급여명세서는 급여 탭에서 계속 볼 수 있습니다.",
        )
      : `<div id="${PANEL}" role="tabpanel" aria-labelledby="${segmentTabId(PANEL, tab)}" class="flex flex-col gap-[20px]">${isTodo(v) ? todoPanel(v) : ""}${
          v === "empty" ? emptyView(img("menu-schedule.svg", 44, 44), "이번 달 등록된 근무가 없습니다", "관리자가 스케줄을 등록하면 이 달력에 표시됩니다.") : ""
        }${v === "week" ? schedule() : ""}</div>`;
  return `<div class="flex flex-1 flex-col">${pageHeader("근무 정보", {
    backHref: page("home"),
  })}<main class="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5] ${v === "nosite" ? "flex-1" : ""}">${v === "nosite" ? "" : storeCard()}${tabs}${content}</main><div class="sticky bottom-0 mt-auto">${bottomNav(
    "work",
  )}</div></div>${v === "nosite" || v === "empty" || v === "week" ? "" : sheets(s)}${v === "nosite" ? "" : storeSheet()}`;
};

export default () => ({
  title: "근무",
  states: STATES,
  html: STATES.map((s) => state(s.id, view(s.id))).join(""),
});
