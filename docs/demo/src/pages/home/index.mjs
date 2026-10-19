// 직원 근무 앱 데모 · 홈. 기준 목업: docs/mockup/app/home.html — 상태 6개(평상시 · 처리할 일 쌓임 · 오늘 휴무 ·
// 가입 직후 · 퇴직 후 · 날인 요청 팝업)와 시트 1개(근무지 고르기), 화면 문구·가짜 값을 옮겼다. 쟁점 HOME-1~5 는 모두 확정이다.
//   HOME-1 순서는 오늘·이번 주 먼저, 서명 대기 계약서는 날인 요청 팝업으로 따로 알리고 TO-DO 카드에서 TO-DO 목록으로 바로 간다.
//   HOME-2 근무지 선택기는 홈 머리줄에만 둔다. HOME-3 출퇴근 등록은 오늘 근무 카드 안 버튼으로 간다(하단 메뉴에 출퇴근 칸 없음).
//   HOME-4 날인 요청 팝업은 날인하기 전까지 앱을 열 때마다 띄운다 — 데모에서는 「날인 요청 팝업」 상태로 본다.
//   HOME-5 퇴직 후에는 「근무지가 없습니다」, 하단 메뉴와 알림 버튼은 그대로 두고 급여 탭으로 간다.
// 평상시(today)는 Figma 02.Main(node 8:3)을 따른다(오늘의 근무 node 9:152 · 이번 주 근무 node 9:242 · 근무지 시트 03.Sheet node 12:670).
// 그 밖 상태(처리할 일 카드 · 휴무 · 가입 직후 · 퇴직 후 · 날인 요청 팝업)는 Figma 없음 — DESIGN.md 기준 초안.
import { bottomNav, bottomSheet, button, empty, img, infoRow, maskIcon, page, sectionTitle, sheetOption, state, statusChip, todoItem, todoList, topBar, weekSelector } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. store 는 목업의 「시트 열기」라 뒤에 평상시를, sign-req 는 가입 직후 빈 홈을 깐다(체결 완료 계약이 없어 점포 정보를 보이지 않음, 운영 정책 CTR-29).
// 연결 보류는 없다 — 가입하면 계정이 초대의 직원 레코드에 바로 이어진다(운영 정책 JOI-05 · ACC-15, 2026-10-19).
const STATES = [
  { id: "today", label: "평상시", note: "오늘 근무 있음" },
  { id: "todo", label: "처리할 일 쌓임", note: "계약·TO-DO·알림" },
  { id: "off", label: "오늘 휴무", note: "근무 없음" },
  { id: "empty", label: "가입 직후", note: "정보 없음" },
  { id: "retired", label: "퇴직 후", note: "연결된 근무지 없음" },
  { id: "sign-req", label: "날인 요청 팝업", note: "가입 직후 빈 홈 위" },
  { id: "store", label: "근무지 고르기", note: "근무지 전환" },
];
const SHEET_VIEW = { store: "today", "sign-req": "empty" };

const CHECK_IN = page("check-in");
const CONTRACT = page("contract", "detail"); // 목업 contract.html#detail — 그 계약서 화면에서 날인한다
const NOTIFY = page("notify");
const STORES = ["웨일카페 강남역점", "웨일카페 홍대점", "웨일베이커리 합정점"];
const STORE = STORES[0];

// 2026년 9월 둘째 주, 오늘은 10일(목). 근무일은 셋째 줄에 근무 시간을 쓰고, 쉬는 날은 흐리게 낮춘다.
const work = (key, weekday, date, note) => ({ key, weekday, date, work: true, note });
const off = (key, weekday, date) => ({ key, weekday, date, muted: true });
const WEEK_HEAD = [work("09-07", "월", 7, "09–18"), work("09-08", "화", 8, "09–18"), off("09-09", "수", 9)];
const WEEK_TAIL = [work("09-11", "금", 11, "13–22"), off("09-12", "토", 12), work("09-13", "일", 13, "10–19")];
const weekWith = (today) => [...WEEK_HEAD, today, ...WEEK_TAIL];

// 묶음 사이 20(Figma 02.Main), 하단 메뉴와는 24.
const sections = (children) => `<div class="flex flex-col gap-[20px]">${children}</div>`;

// 근무지 선택기가 없는 상태의 머리줄. TopBar 와 같은 자리·크기로 로고 · 이름(누를 수 없음) · 알림 버튼(있을 때만)을 둔다.
const plainTopBar = (title, bell) =>
  `<header class="flex min-h-[44px] w-full items-center gap-[10px]"><span class="relative size-[36px] shrink-0">${img("logo-whale-small.svg", 36.193, 27.446, "absolute top-[8.75px] left-0")}${img(
    "logo-stars-small.svg",
    17.494,
    12.668,
    "absolute top-0 left-[5.43px]",
  )}</span><p class="min-w-0 flex-1 truncate text-[15px] font-bold">${title ?? ""}</p>${
    bell
      ? `<a href="${NOTIFY}" aria-label="알림" class="flex size-[44px] shrink-0 items-center justify-center rounded-[14px] border border-[#e9edf3] bg-white transition-colors duration-150 ease-out active:bg-staff-info-bg">${img("bell.svg", 21, 21, "-scale-y-100")}</a>`
      : ""
  }</header>`;

// 오늘의 근무(Figma node 9:152). 출근 전이라 버튼은 출근하기(HOME-3).
// #DBE5FF·#BCCFFF 는 남보라 위의 흐린 글자, 그림자는 남보라를 옅게 깐 것이다.
const todayCard = ([start, end]) =>
  `<section aria-label="오늘 근무" class="flex flex-col gap-[4px] rounded-[18px] bg-staff-primary px-[23px] pt-[24px] pb-[23px] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"><p class="text-[12px] text-[#dbe5ff]">오늘 근무</p><p class="flex h-[46px] items-center gap-[4px] text-[30px] font-bold tracking-[-0.025em]">${start}<span class="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>${end}</p><p class="flex items-center gap-[6px] pb-[15px] text-[12px] text-[#dbe5ff]">휴게 60분 <span class="text-[11px]">·</span> 총 8시간 근무</p><a href="${CHECK_IN}" class="flex min-h-[48px] items-center justify-center gap-[8px] rounded-[12px] bg-white px-[18px] text-[15px] font-bold text-staff-primary transition-colors duration-150 ease-out active:bg-staff-primary-inactive">출근하기${img(
    "arrow-right-brand.svg",
    14,
    12,
  )}</a></section>`;

// 이번 주 근무(Figma node 9:242). 월~일, 한국 표준시 기준. 처음 고른 날은 오늘.
const thisWeek = (days) =>
  `<section class="flex flex-col gap-[13px]">${sectionTitle("이번 주 근무", {
    right: `<span class="text-[14px] text-staff-text-sub">9/7 (월) – 9/13 (일)</span>`,
  })}<div class="flex flex-col gap-[13px] rounded-[18px] border border-staff-border-light bg-white px-[12px] pt-[16px] pb-[12px]">${weekSelector({
    days,
    selected: "09-10",
  })}<p class="border-t border-staff-border-light pt-[12px] text-[12px] text-staff-text-sub">이번 주는 월요일부터 일요일까지, 한국 표준시 기준입니다</p></div></section>`;

// TO-DO 카드. 오른쪽 위 「전체보기」로 근무 화면의 TO-DO 쪽에 바로 간다(HOME-1).
const todoSection = (count, children) =>
  `<section class="flex flex-col gap-[12px]">${sectionTitle("TO-DO", {
    count,
    right: `<a href="${page("work", "todo")}" class="-my-[13px] flex min-h-[44px] items-center gap-[2px] text-[12px] text-staff-text-sub">전체보기${img("chevron-right-small.svg", 11, 11, "-scale-y-100")}</a>`,
  })}<div class="rounded-[18px] border border-staff-border-light bg-white px-[16px]">${children}</div></section>`;

// 근무 정보(Figma 「나의 근무 정보」 줄 모양). 요약만 보이고 자세한 것은 각 화면에서 본다.
const workInfo = () =>
  `<section class="flex flex-col gap-[12px]">${sectionTitle("근무 정보")}${infoRow({ href: page("work"), icon: "menu-schedule.svg", title: "근무스케줄", description: "이번 달 근무 12일" })}${infoRow({
    href: page("attendance"),
    icon: "menu-attendance.svg",
    title: "출퇴근 현황",
    description: "이번 달 출근 9회 · 지각 0회",
  })}${infoRow({ href: page("pay"), icon: "menu-payslip.svg", title: "급여명세서", description: "2026년 8월분 발송됨" })}</section>`;

const CONTENT = {
  today: () =>
    sections(
      todayCard(["09:00", "18:00"]) +
        thisWeek(weekWith(work("09-10", "목", 10, "09–18"))) +
        todoSection(1, todoList(todoItem({ title: "유통기한 라벨 점검", meta: "오늘 20:00까지" }))) +
        workInfo(),
    ),

  // 처리할 일은 카드로만 알린다(HOME-1). 날인 대기 카드는 경고 칩 색(#FFF6E5 · #956013)을 빌린다 — 이 카드에만 나와 토큰으로 두지 않는다.
  // 한 명 수행 TO-DO 를 다른 직원이 끝냈다 — 수행자와 완료 시각을 보이고 되돌릴 수 없다.
  todo: () =>
    sections(
      todayCard(["13:00", "22:00"]) +
        thisWeek(weekWith(work("09-10", "목", 10, "13–22"))) +
        `<a href="${CONTRACT}" class="flex items-center gap-[12px] rounded-[18px] bg-[#fff6e5] px-[16px] py-[14px] text-[#956013] transition-opacity duration-150 ease-out active:opacity-80">${maskIcon(
          "contract.svg",
          18,
        )}<span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="text-[14px] font-semibold">강남역점 근로계약서 대기</span><span class="text-[12px]">남은 기한 26일</span></span>${maskIcon(
          "chevron-right-muted.svg",
          12,
          true,
        )}</a>` +
        todoSection(
          2,
          todoList(
            todoItem({ title: "환불 요청 처리", meta: "지금 바로", badges: statusChip("warning", "긴급", "semibold") }) +
              todoItem({ title: "마감 정산표 작성", meta: "완료 · 이수민님이 09:12에 처리", done: true, toggle: false }),
          ),
        ) +
        `<a href="${NOTIFY}" class="flex items-center gap-[12px] rounded-[18px] border border-staff-border-light bg-staff-info-bg px-[16px] py-[14px] transition-colors duration-150 ease-out active:bg-staff-primary-inactive">${img(
          "bell.svg",
          18,
          18,
          "-scale-y-100",
        )}<span class="min-w-0 flex-1 text-[14px]">미확인 알림 3건이 있습니다</span>${img("chevron-right-muted.svg", 12, 12, "-scale-y-100")}</a>` +
        workInfo(),
    ),

  off: () =>
    sections(
      `<div class="flex flex-col gap-[2px] rounded-[18px] border border-staff-border-light bg-staff-info-bg px-[20px] py-[18px]"><p class="text-[16px] font-bold">오늘은 근무가 없는 날입니다</p><p class="text-[12px] text-staff-text-sub">이번 주 다른 근무일은 아래에서 확인하세요</p></div>` +
        thisWeek(weekWith(off("09-10", "목", 10))) +
        `<section class="flex flex-col gap-[12px]">${sectionTitle("TO-DO")}<p class="rounded-[18px] border border-staff-border-light bg-staff-info-bg px-[16px] py-[18px] text-center text-[12px] text-staff-text-muted">오늘은 처리할 TO-DO가 없습니다</p></section>` +
        workInfo(),
    ),

  empty: () =>
    empty(
      maskIcon("nav-work.svg", 24, true),
      "아직 쌓인 근무 정보가 없습니다",
      `<p>웨일카페 강남역점과 연결되었습니다. 관리자가 근무스케줄을 등록하면 이 화면에 오늘 근무와 이번 주 근무가 표시됩니다.</p>`,
    ),

  retired: () =>
    empty(
      maskIcon("store.svg", 24, true),
      "근무지가 없습니다",
      `<p class="[&_strong]:font-bold [&_strong]:text-staff-text">연결된 근무지가 없습니다. 근무와 출퇴근 화면도 같은 안내를 보여 줍니다. 받은 급여명세서는 <strong>급여 탭</strong>에서, 알림은 위쪽 종에서 계속 볼 수 있습니다.</p><div class="flex flex-col gap-[8px] pt-[8px]">${button(
        `${maskIcon("nav-pay.svg", 16, true)}급여 탭으로 가기`,
        { variant: "outline", href: page("pay") },
      )}<p class="text-[12px] text-staff-text-muted">보존 기간인 3년 동안 조회할 수 있습니다.</p></div>`,
    ),
};

// 근무지 선택기는 근무지가 정해진 상태에서만(HOME-2). 가입 직후는 이름만, 알림 버튼은 퇴직 후에도 남는다(HOME-5).
const header = (view) =>
  view === "today" || view === "todo" || view === "off"
    ? topBar({ store: STORE, storeAttrs: { "data-open": "store" }, alarmHref: NOTIFY, hasNewAlarm: view === "todo" })
    : plainTopBar(view === "empty" ? "웨일카페 강남역점" : undefined, view === "retired");

// 하단 메뉴는 모든 상태에서 그대로(HOME-5). 화면 아래에 붙여 둔다.
const screen = (view) =>
  `<div class="flex flex-1 flex-col gap-[24px] leading-[1.5]"><main class="flex flex-1 flex-col px-[22px] pt-[42px]">${header(
    view,
  )}<div class="flex flex-col gap-[5px] pt-[24px] pb-[20px]"><h1 class="text-[26px] font-bold">하은님, 좋은 아침이에요</h1><p class="text-[12px] text-staff-text-sub">9월 10일 목요일 · 오늘도 기분 좋은 하루 되세요</p></div>${CONTENT[
    view
  ]()}</main><div class="sticky bottom-0 mt-auto">${bottomNav("home")}</div></div>`;

// 근무지 고르기(Figma 03.Sheet). 제목·설명·선택지는 /design 과 같다(2026-10-12 재영). 고른 근무지를 근무·출퇴근 현황·급여·알림이 모두 따른다(HOME-2). 최근 선택이 곧 지금 근무지다.
// 고르면 머리줄 점포 이름(data-slot="store")을 바꾸고 닫는다. 체크는 data-pick 묶음이 고른 칸으로 옮긴다.
const storeSheet = (a = {}) =>
  bottomSheet(
    "store",
    { title: "어디에서 근무하시나요?", description: "선택한 근무지의 정보를 보여드려요.", ...a },
    `<div data-pick class="contents">${STORES.map((s) =>
      sheetOption(s, {
        selected: s === STORE,
        "data-set": `store=${s}`,
        "data-toast": s === STORE ? undefined : `${s}으로 전환했습니다`,
        "data-close": true,
      }),
    ).join("")}</div>`,
  );

// 날인 요청 팝업(HOME-1·4). 서명 대기 근로계약서가 도착하면 홈 위에 띄우고, 날인하기 전까지 앱을 열 때마다 다시 띄운다.
const signReqSheet = (a = {}) =>
  bottomSheet(
    "sign-req",
    { title: "날인할 계약서가 도착했습니다", closeLabel: "나중에", ...a },
    `<dl class="flex flex-col divide-y divide-[#f5e3c0] rounded-[12px] bg-[#fff6e5] px-[14px] py-[4px]">${[
      ["근무지", "웨일카페 강남역점"],
      ["고용 형태", "파트타이머"],
      ["날인 기한", "2026-10-11 · 26일 남음"],
    ]
      .map(
        ([k, v]) =>
          `<div class="flex items-center gap-[12px] py-[10px]"><dt class="shrink-0 text-[13px] font-semibold text-[#956013]">${k}</dt><dd class="min-w-0 flex-1 text-right text-[13px]">${v}</dd></div>`,
      )
      .join(
        "",
      )}</dl><p class="text-[14px] text-staff-text-sub">날인해야 근무가 시작됩니다. 지금 확인하지 않아도 계약서 화면에서 다시 볼 수 있습니다.</p>${button(
      `${maskIcon("contract.svg", 14)}날인하러 가기`,
      { href: CONTRACT },
    )}`,
  );

const BLOCKS = {
  today: () => screen("today") + storeSheet(),
  todo: () => screen("todo") + storeSheet(),
  off: () => screen("off") + storeSheet(),
  store: () => screen(SHEET_VIEW.store) + storeSheet({ "data-sheet-auto": true, "data-on-close": "#today" }),
  "sign-req": () => screen(SHEET_VIEW["sign-req"]) + signReqSheet({ "data-sheet-auto": true, "data-on-close": "#empty" }),
};

export default () => ({
  title: "홈",
  states: STATES,
  html: STATES.map((s) => state(s.id, BLOCKS[s.id] ? BLOCKS[s.id]() : screen(s.id))).join(""),
});
