// 직원 근무 앱 데모 · 홈. 기준 목업: docs/mockup/app/home.html — 상태 6개(평상시 · 처리할 일 쌓임 · 오늘 휴무 ·
// 가입 직후 · 퇴직 후 · 날인 요청 팝업)와 시트 1개(근무지 고르기), 화면 문구·가짜 값을 옮겼다. 쟁점 HOME-1~5 는 모두 확정이다.
//   HOME-1 순서는 오늘·이번 주 먼저, 서명 대기 계약서는 날인 요청 팝업으로 따로 알리고 TO-DO 카드에서 TO-DO 목록으로 바로 간다.
//   HOME-2 근무지 선택기는 홈 머리줄과 근무 정보의 근무지 카드 두 곳, 같은 앱 전역 근무지(2026-10-20). HOME-3 출퇴근 등록은 오늘 근무 카드 안 버튼으로 간다(하단 메뉴에 출퇴근 칸 없음).
//   HOME-4 날인 요청 팝업은 날인하기 전까지 앱을 열 때마다 띄운다 — 데모에서는 「날인 요청 팝업」 상태로 본다.
//   HOME-5 퇴직 후에는 「근무가 종료되었습니다」, 하단 메뉴와 알림 버튼은 그대로 두고 급여 탭으로 간다.
// 평상시(today)는 Figma 02.Main(node 8:3)을 따른다(오늘의 근무 node 9:152 · 이번 주 근무 node 9:242 · 근무지 시트 03.Sheet node 12:670).
// 그 밖 상태(처리할 일 카드 · 휴무 · 가입 직후 · 퇴직 후 · 날인 요청 팝업)는 Figma 없음 — DESIGN.md 기준 초안.
import { bottomNav, bottomSheet, button, empty, iconTile, img, infoRow, maskIcon, page, sectionTitle, state, statusChip, storeSheet, STORES, todoItem, todoList, todoSheet, topBar, weekSelector } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. store 는 목업의 「시트 열기」라 뒤에 평상시를, sign-req 는 가입 직후 빈 홈을 깐다(체결 완료 계약이 없어 점포 정보를 보이지 않음, 운영 정책 CTR-29).
// 빈 홈에는 날인을 기다리는 근로계약서 카드만 있어 「나중에」로 닫은 뒤에도 그 카드로 서명 대기 계약서에 간다.
// 연결 보류는 없다 — 가입하면 계정이 초대의 직원 레코드에 바로 이어진다(운영 정책 JOI-05 · ACC-15, 2026-10-19).
const STATES = [
  { id: "today", label: "평상시", note: "오늘 근무 있음" },
  { id: "todo", label: "처리할 일 쌓임", note: "계약·TO-DO·알림" },
  { id: "off", label: "오늘 예정 없음", note: "근무스케줄 없음" },
  { id: "empty", label: "가입 직후", note: "서명 대기 계약서만" },
  { id: "no-site", label: "근무지 없음 · 계약 전", note: "거절·만료·종료 뒤" },
  { id: "retired", label: "퇴직 후", note: "연결된 근무지 없음" },
  { id: "sign-req", label: "서명 요청 팝업", note: "가입 직후 빈 홈 위" },
  { id: "store", label: "근무지 고르기", note: "근무지 전환" },
];
const SHEET_VIEW = { store: "today", "sign-req": "empty" };

const CHECK_IN = page("check-in");
const CONTRACT = page("contract", "detail"); // 목업 contract.html#detail — 그 계약서 화면에서 날인한다
const NOTIFY = page("notify");
const STORE = STORES[0];

// 2026년 9월 둘째 주, 오늘은 10일(목). 근무일은 셋째 줄에 근무 시간을 쓰고, 쉬는 날은 흐리게 낮춘다.
const work = (key, weekday, date, note) => ({ key, weekday, date, work: true, note });
const off = (key, weekday, date) => ({ key, weekday, date, muted: true });
const WEEK_HEAD = [work("09-07", "월", 7, "09–18"), work("09-08", "화", 8, "09–18"), off("09-09", "수", 9)];
const WEEK_TAIL = [work("09-11", "금", 11, "13–22"), off("09-12", "토", 12), work("09-13", "일", 13, "10–19")];
const weekWith = (today) => [...WEEK_HEAD, today, ...WEEK_TAIL];

// 묶음 사이 12 — 근무 · 출퇴근 · 급여 탭과 같다(2026-11-24, 머리줄 아래 20 · 카드 사이 16 이 넓어 보였다). 하단 메뉴와는 24.
const sections = (children) => `<div class="flex flex-col gap-[12px]">${children}</div>`;

// 근무지 선택기가 없는 상태의 머리줄. TopBar 와 같은 자리·크기로 로고 · 알림 버튼(있을 때만)을 둔다.
const plainTopBar = (bell) =>
  `<header class="flex min-h-[44px] w-full items-center gap-[10px]"><span aria-hidden="true" class="relative size-[36px] shrink-0 -translate-y-[4.4px]">${img("logo-whale-small.svg", 36.193, 27.446, "absolute top-[8.75px] left-0")}${img(
    "logo-stars-small.svg",
    17.494,
    12.668,
    "absolute top-0 left-[5.43px]",
  )}</span><p class="min-w-0 flex-1"></p>${
    bell
      ? `<a href="${NOTIFY}" aria-label="알림" class="relative -mr-[10px] flex size-[44px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out active:bg-staff-info-bg">${img("bell.svg", 23, 23, "-scale-y-100")}</a>`
      : ""
  }</header>`;

// 오늘의 근무(Figma node 9:152). 출근 전이라 버튼은 출근하기(HOME-3).
// #DBE5FF·#BCCFFF 는 남보라 위의 흐린 글자, 그림자는 남보라를 옅게 깐 것이다.
// 안쪽 20, 시각과 「근로 · 휴게」 줄은 한 묶음 — 머리 줄 → 시각 12 · 묶음 → 버튼 16(보이는 글자 기준). 휴게를 뺀 시간이라 「근로」(2026-11-24)
const todayCard = ([start, end]) =>
  `<section aria-label="오늘 근무" class="flex flex-col rounded-[18px] bg-staff-primary p-[20px] leading-[1.5] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]"><div class="flex items-center justify-between"><p class="text-[12px] text-[#dbe5ff]">오늘 근무</p></div><div class="flex flex-col pt-[6px]"><p class="flex items-center gap-[4px] text-[30px] leading-[1.15] font-bold">${start}<span class="w-[23px] text-center text-[14px] font-normal text-[#bccfff]">—</span>${end}</p><p class="flex items-center gap-[6px] text-[12px] text-[#dbe5ff]">근로 8시간 <span class="text-[11px]">·</span> 휴게 60분</p></div><div class="pt-[14px]"><a href="${CHECK_IN}" class="flex min-h-[48px] items-center justify-center gap-[8px] rounded-[12px] bg-white px-[18px] text-[15px] font-bold text-staff-primary transition-colors duration-150 ease-out active:bg-staff-primary-inactive">출근하기${img(
    "arrow-right-brand.svg",
    14,
    12,
  )}</a></div></section>`;

// 예정된 근무가 없는 날 — 보라 카드 자리가 비었다는 뜻으로 남보라 점선 상자, 왼쪽 옅은 남보라 달력 칸, 제목은 보조 글자색.
// 앱은 근무스케줄이 없다는 것만 알아 「휴무」라고 단정하지 않는다(2026-11-24). 높이는 낮게 — 위아래 12 · 좌우 16(테두리 1px 를 빼 11 · 15)
const offCard = (next) =>
  `<section aria-label="오늘 근무" class="flex flex-col gap-[12px] rounded-[18px] border border-dashed border-[#bccfff] bg-white px-[15px] py-[11px] leading-[1.5]"><div class="flex items-center gap-[12px]"><span aria-hidden="true" class="flex size-[36px] shrink-0 items-center justify-center rounded-[12px] bg-[#eef2ff] text-staff-primary">${maskIcon("calendar-line.svg", 20)}</span><div class="flex min-w-0 flex-col"><p class="text-[15px] font-bold text-staff-text-sub">오늘 예정된 근무가 없습니다</p><p class="text-[12px] text-staff-text-sub">다음 근무 · ${next}</p></div></div></section>`;

// 이번 주 근무(Figma node 9:242). 월~일, 한국 표준시 기준. 처음 고른 날은 오늘. 머리 오른쪽은 날짜 범위 대신 「전체 보기 ›」(근무 탭 달력, 2026-11-24).
// 상자 바깥에서 칸까지 · 칸 사이 모두 8(안쪽 7 + 테두리 1)
const thisWeek = (days) =>
  `<section class="flex flex-col gap-[12px]">${sectionTitle("이번 주 근무", {
    right: `<a href="${page("work")}" class="-my-[13px] flex min-h-[44px] items-center text-[12px] text-staff-text-sub">전체 보기${img("chevron-right-small.svg", 11, 11, "-scale-y-100")}</a>`,
  })}<div class="flex flex-col gap-[8px] rounded-[18px] border border-staff-border-light bg-white p-[7px]">${weekSelector({
    days,
    selected: "09-10",
  })}</div></section>`;

// TO-DO 카드. 오른쪽 위 「전체 보기」로 근무 화면의 TO-DO 쪽에 바로 간다(HOME-1). TO-DO 가 없으면 섹션을 그리지 않는다(2026-10-20 재영).
// 줄이나 체크칸을 누르면 근무 탭과 같은 TO-DO 상세 시트를 열고 상태는 시트에서 바꾼다 — 체크 한 번에 바로 완료되지 않는다
// (개발 화면 home/todo-card.tsx, 2026-11-23 사용자 지정). 홈 시트에는 근무지 줄을 두지 않는다(고른 근무지의 TO-DO 만 보여서다).
const todoSection = (count, children) =>
  `<section class="flex flex-col gap-[12px]">${sectionTitle("TO-DO", {
    count,
    right: `<a href="${page("work", "todo")}" class="-my-[13px] flex min-h-[44px] items-center gap-[2px] text-[12px] text-staff-text-sub">전체 보기${img("chevron-right-small.svg", 11, 11, "-scale-y-100")}</a>`,
  })}<div class="rounded-[18px] border border-staff-border-light bg-white px-[16px]">${children}</div></section>`;

// 근무 정보(Figma 「나의 근무 정보」 줄 모양). 요약만 보이고 자세한 것은 각 화면에서 본다. 개발 화면 순서(급여명세서 · 근무스케줄 · 출퇴근 현황),
// 아이콘 바탕은 「이번 주 근무」 날짜 칸과 같은 옅은 남보라(홈 전용 iconTile soft, 2026-11-24)
const workInfo = () =>
  `<section class="flex flex-col gap-[12px]">${sectionTitle("근무 정보")}${infoRow({ href: page("pay"), icon: iconTile("payslip-line.svg", 33, "soft"), title: "급여명세서", description: "2026년 8월분 받음" })}${infoRow({
    href: page("work"),
    icon: iconTile("nav-work.svg", 33, "soft"),
    title: "근무스케줄",
    description: "이번 달 근무 12일",
  })}${infoRow({ href: page("attendance"), icon: iconTile("nav-attendance.svg", 33, "soft"), title: "출퇴근 현황", description: "이번 달 출근 9회 · 지각 0회" })}</section>`;

// 날인 대기 계약서 카드. 누르면 그 계약서로 간다.
const contractCard = (title, sub) =>
  `<a href="${CONTRACT}" class="flex items-center gap-[12px] rounded-[18px] bg-[#fff6e5] px-[16px] py-[14px] text-[#956013] transition-opacity duration-150 ease-out active:opacity-80">${maskIcon(
    "doc-line.svg",
    18,
  )}<span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="text-[14px] font-semibold">${title}</span><span class="text-[12px]">${sub}</span></span>${maskIcon(
    "chevron-right-muted.svg",
    12,
    true,
  )}</a>`;

const TODO_CHIP = { waiting: statusChip("neutral", "대기", "semibold"), doneByOther: statusChip("success", "완료됨", "semibold") };
// TO-DO 상세 시트(근무 탭과 같은 todoSheet). [완료]를 누르면 고른 칸을 옮기고 닫는다 — 되돌리기 토스트는 없다.
const todoSheets = (view) =>
  view === "today"
    ? todoSheet("todo-label", {
        title: "유통기한 라벨 점검",
        body: "진열대와 냉장고의 유통기한 라벨을 확인하고 지난 상품은 따로 빼 둔다.",
        rows: [
          ["수행 예정", "9월 10일(목) 20:00"],
          ["상태", TODO_CHIP.waiting],
        ],
        done: { "data-close": true },
      })
    : view === "todo"
      ? todoSheet("todo-refund", {
          title: "환불 요청 처리",
          body: "오전 주문 건 환불 요청을 확인하고 포스에서 환불 처리한다.",
          chips: statusChip("warning", "긴급", "semibold"),
          rows: [
            ["수행 예정", "9월 10일(목) 13:00"],
            ["상태", TODO_CHIP.waiting],
          ],
          done: { "data-close": true },
        }) +
        todoSheet("todo-closing", {
          title: "마감 정산표 작성",
          body: "전날 마감 정산표를 작성해 관리자에게 전송한다. 근무 직원 중 한 명만 완료 처리하면 된다.",
          chips: statusChip("neutral", "공유", "semibold"),
          rows: [
            ["수행 예정", "9월 10일(목) 10:00"],
            ["상태", TODO_CHIP.doneByOther],
          ],
          status: "done",
          shared: true,
          after: `<p class="text-[13px] leading-[1.5] text-staff-text-sub">이수민이 9월 10일(목) 09:12에 완료했습니다</p>`,
        })
      : "";

const CONTENT = {
  today: () =>
    sections(
      todayCard(["09:00", "18:00"]) +
        thisWeek(weekWith(work("09-10", "목", 10, "09–18"))) +
        todoSection(1, todoList(todoItem({ title: "유통기한 라벨 점검", meta: "오늘 20:00까지", open: "todo-label", badges: TODO_CHIP.waiting }))) +
        workInfo(),
    ),

  // 처리할 일은 카드로만 알린다(HOME-1). 날인 대기 카드는 경고 칩 색(#FFF6E5 · #956013)을 빌린다 — 이 카드에만 나와 토큰으로 두지 않는다.
  // 한 명 수행 TO-DO 를 다른 직원이 끝냈다 — 수행자와 완료 시각을 보이고 되돌릴 수 없다.
  todo: () =>
    sections(
      todayCard(["13:00", "22:00"]) +
        thisWeek(weekWith(work("09-10", "목", 10, "13–22"))) +
        contractCard("강남역점 근로계약서 대기", "남은 기한 26일") +
        todoSection(
          2,
          todoList(
            todoItem({ title: "환불 요청 처리", meta: "지금 바로", open: "todo-refund", badges: statusChip("warning", "긴급", "semibold") + TODO_CHIP.waiting }) +
              todoItem({
                title: "마감 정산표 작성",
                meta: "완료 · 이수민님이 09:12에 처리",
                done: true,
                open: "todo-closing",
                badges: statusChip("neutral", "공유", "semibold") + TODO_CHIP.doneByOther,
              }),
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
      offCard("9월 11일(금) 13:00 – 22:00") +
        thisWeek(weekWith(off("09-10", "목", 10))) +
        workInfo(),
    ),

  // 체결 완료 계약이 없으면 점포 정보를 보이지 않고 날인을 기다리는 근로계약서만 보인다(운영 정책 CTR-29). 근무스케줄은 체결 전에는 없다.
  empty: () =>
    `<section class="flex flex-col gap-[12px]">${sectionTitle("서명할 근로계약서")}${contractCard("웨일카페 강남역점", "10월 11일까지 서명해 주세요")}<p class="text-[12px] text-staff-text-sub">근로계약서에 서명해야 근무를 시작할 수 있습니다.</p></section>`,

  // 첫 근로계약서를 거부·만료·종료로 잃어 날인 대기도 체결 완료도 없는 때. 퇴직 후와 달리 근무한 적이 없다(운영 정책 CTR-29).
  "no-site": () =>
    empty(
      maskIcon("doc-line.svg", 24),
      "연결된 근무지가 없습니다",
      `<p>근무지에서 근로계약서를 보내면 여기에 표시됩니다.<br>거절했거나 기한이 지난 계약서는 아래에서 확인해 주세요.</p><div class="flex flex-col gap-[8px] pt-[8px]">${button(
        `${maskIcon("doc-line.svg", 16)}근로계약서 보기`,
        { variant: "outline", href: page("contract", "list") },
      )}</div>`,
    ),

  retired: () =>
    empty(
      maskIcon("store-line.svg", 24),
      "근무가 종료되었습니다",
      `<p class="[&_strong]:font-bold [&_strong]:text-staff-text">급여명세서는 <strong>보존 기간(3년)</strong> 동안 확인할 수 있습니다.</p><div class="flex flex-col gap-[8px] pt-[8px]">${button(
        `${maskIcon("payslip-line.svg", 16)}급여명세서 보기`,
        { variant: "outline", href: page("pay") },
      )}</div>`,
    ),
};

// 근무지 선택기는 근무지가 정해진 상태에서만(HOME-2). 가입 직후는 점포 이름도 두지 않고(운영 정책 CTR-29), 알림 버튼은 퇴직 후에도 남는다(HOME-5).
const header = (view) =>
  view === "today" || view === "todo" || view === "off"
    ? topBar({ store: STORE, storeAttrs: { "data-open": "store" }, alarmHref: NOTIFY, hasNewAlarm: view === "todo" })
    : plainTopBar(view === "retired" || view === "no-site");

// 하단 메뉴는 모든 상태에서 그대로(HOME-5). 화면 아래에 붙여 둔다.
// 개발 화면 홈: 좌우 24 · 위 20 · 아래 24, 머리줄과 묶음 사이도 12(2026-11-24)
const screen = (view) =>
  `<div class="flex flex-1 flex-col leading-[1.5]"><main class="flex flex-1 flex-col gap-[12px] px-[24px] pt-[20px] pb-[24px]">${header(view)}${CONTENT[
    view
  ]()}</main><div class="sticky bottom-0 mt-auto">${bottomNav("home")}</div></div>`;

// 날인 요청 팝업(HOME-1·4). 서명 대기 근로계약서가 도착하면 홈 위에 띄우고, 날인하기 전까지 앱을 열 때마다 다시 띄운다.
const signReqSheet = (a = {}) =>
  bottomSheet(
    "sign-req",
    { title: "서명할 계약서가 도착했습니다", closeLabel: "나중에", ...a },
    `<dl class="flex flex-col divide-y divide-[#f5e3c0] rounded-[12px] bg-[#fff6e5] px-[14px] py-[4px]">${[
      ["근무지", "웨일카페 강남역점"],
      ["고용 형태", "파트타이머"],
      ["서명 기한", "2026-10-11 · 26일 남음"],
    ]
      .map(
        ([k, v]) =>
          `<div class="flex items-center gap-[12px] py-[10px]"><dt class="shrink-0 text-[13px] font-semibold text-[#956013]">${k}</dt><dd class="min-w-0 flex-1 text-right text-[13px]">${v}</dd></div>`,
      )
      .join(
        "",
      )}</dl><p class="text-[14px] text-staff-text-sub">서명해야 근무가 시작됩니다. 지금 확인하지 않아도 계약서 화면에서 다시 볼 수 있습니다.</p>${button(
      `${maskIcon("doc-line.svg", 14)}서명하러 가기`,
      { href: CONTRACT },
    )}`,
  );

const BLOCKS = {
  today: () => screen("today") + todoSheets("today") + storeSheet(),
  todo: () => screen("todo") + todoSheets("todo") + storeSheet(),
  off: () => screen("off") + storeSheet(),
  store: () => screen(SHEET_VIEW.store) + storeSheet({ "data-sheet-auto": true, "data-on-close": "#today" }),
  "sign-req": () => screen(SHEET_VIEW["sign-req"]) + signReqSheet({ "data-sheet-auto": true, "data-on-close": "#empty" }),
};

export default () => ({
  title: "홈",
  states: STATES,
  html: STATES.map((s) => state(s.id, BLOCKS[s.id] ? BLOCKS[s.id]() : screen(s.id))).join(""),
});
