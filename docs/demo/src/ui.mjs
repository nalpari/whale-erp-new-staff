// 데모 HTML 을 그리는 함수들. 직원 근무 앱 src/components/common 의 컴포넌트를 HTML 문자열로 옮겼다.
// 클래스 문자열은 컴포넌트 코드와 한 글자도 다르면 안 된다 — 다르면 앱 화면과 생김새가 어긋난다.
// 컴포넌트가 바뀌면 여기도 고치고 node docs/demo/build.mjs 를 다시 돌린다.
// 값은 데모를 만드는 사람이 쓴 글자뿐이라 따로 이스케이프하지 않는다(사용자 입력이 들어오지 않는다).
//
// 화면 동작은 assets/staff.js 가 아래 data- 단서로 붙인다.
//   data-state="id"            상태 블록. 주소 #id 와 맞는 것만 보인다(state()).
//   data-go="id" [data-dir="nav-back"]   같은 화면의 다른 상태로 간다.
//   data-open="이름"            같은 상태 블록 안의 <dialog data-sheet="이름"> 를 연다. data-close 는 그 시트를 닫는다.
//   data-sheet-auto            상태가 보일 때 바로 열리는 시트. data-on-close="#id" 또는 주소로 닫힐 때 옮겨 간다.
//   data-toast="문구"           토스트를 띄운다.
//   role="switch"              Switch 켜고 끄기. data-check 는 TodoItem·CheckBox 체크칸.
//   data-pick                  고르기 묶음(SegmentedControl·WeekSelector·SheetOption). 칸마다 data-on/data-off 클래스, data-show="패널 id".
//   data-slot="이름" / data-set="이름=글자"   눌렀을 때 같은 이름 칸의 글자를 바꾼다.

let seq = 0;
export const uid = (p = "s") => `${p}-${++seq}`;
export const resetIds = () => (seq = 0);
export const attrs = (a = {}) =>
  Object.entries(a)
    .filter(([, v]) => v !== false && v != null)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`))
    .join("");
const each = (list, f) => list.map(f).join("");

// theme.ts
export const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";
export const PRESS = `transition-[background-color,border-color,color] duration-150 ${EASE_OUT} disabled:pointer-events-none disabled:opacity-40`;
export const FIELD =
  "h-[52px] w-full rounded-[12px] border border-staff-border bg-white px-[14px] text-[16px] text-staff-text outline-none! transition-[border-color] duration-150 ease-out placeholder:text-staff-placeholder focus:border-staff-primary aria-invalid:border-staff-error";
export const STAFF_THEME =
  "bg-staff-bg font-staff leading-normal text-staff-text scheme-light antialiased selection:bg-staff-primary selection:text-white [&_*:focus-visible]:outline-staff-primary [&_:is(input,textarea)]:caret-staff-primary! [&_input:-webkit-autofill]:shadow-[0_0_0_100px_white_inset] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--color-staff-text)] [&_:is(a[href],button:enabled,label:has(input:enabled))]:cursor-pointer";

// 이 데모 모듈 전체가 같은 A(assets 상대 경로)·R(데모 루트 상대 경로)를 쓴다. build.mjs 가 화면마다 setPaths 로 맞춘다.
export let A = "assets/";
export let R = "";
export const setPaths = (a, r) => ((A = a), (R = r));
// 다른 화면으로 가는 주소. page("login", "locked") → ../login/index.html#locked
export const page = (name, state) => `${R}${name ? `${name}/` : ""}index.html${state ? `#${state}` : ""}`;

// next/image 자리. public/icons 를 assets/icons 로 옮겼다.
export const img = (name, w, h, cls = "", alt = "") => `<img alt="${alt}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ""} src="${A}icons/${name}">`;

// icon.tsx
export const maskIcon = (name, size, flipY = false) =>
  `<span aria-hidden="true" class="shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${flipY ? "-scale-y-100" : ""}" style="width:${size}px;height:${size}px;mask-image:url(${A}icons/${name})"></span>`;

// icon.tsx IconTile — 둥근 네모 바탕(한 변의 1/3)에 선 아이콘. 바탕은 옅은 회색 · 아이콘은 보조 글자색 — 보라 아이콘은 쓰지 않는다(2026-11-24).
// tone="soft" 는 홈 전용 — 「이번 주 근무」 날짜 칸과 같은 옅은 남보라(#EEF2FF) 바탕, 아이콘은 그대로 보조 글자색(2026-11-24).
export const iconTile = (name, size, tone = "neutral") =>
  `<span aria-hidden="true" class="flex shrink-0 items-center justify-center text-staff-text-sub ${tone === "soft" ? "bg-[#eef2ff]" : "bg-staff-bg"}" style="width:${size}px;height:${size}px;border-radius:${size / 3}px">${maskIcon(name, Math.round(size * 0.6))}</span>`;

// staff-root.tsx
export const staffRoot = (html) => `<div class="${STAFF_THEME} min-h-[100dvh]">${html}</div>`;

// brand-logo.tsx
export const brandLogo = () =>
  `<div class="flex flex-col items-center gap-[8px]"><div class="relative size-[60px]">${img("logo-whale.svg", 60.322, 45.744, "absolute top-[14.58px] left-0")}${img("logo-stars.svg", 29.156, 21.113, "absolute top-0 left-[9.05px]")}</div><p class="text-center leading-[1.5] text-staff-text"><span class="block text-[28px] font-bold tracking-[-0.08px]">WHALE ERP</span><span class="block text-[13px] font-medium tracking-[-0.025em]">FOR RESTAURANT&amp;CAFE</span></p></div>`;

// top-bar.tsx StoreMark — 근무지 줄의 점포 표시: 흰 바탕 · 1px 테두리 동그라미(28px) 안 먹색 점포 아이콘(2026-11-24)
export const storeMark = () =>
  `<span aria-hidden="true" class="flex size-[28px] shrink-0 items-center justify-center rounded-full border border-staff-border bg-white text-staff-text">${maskIcon("store-line.svg", 15)}</span>`;

// top-bar.tsx. 근무지 머리줄 — 홈 · 근무 · 출퇴근 탭이 같이 쓴다(2026-11-24, 배달 앱 주소 머리줄을 본뜸).
//   홈(title 없음): 고래 로고 · 근무지(17px bold) + 꺾쇠 · 오른쪽 알림 종(상자 없음)
//   탭 화면(title): 첫 줄 제목(22px bold) · 종, 둘째 줄 근무지(15px bold) + 꺾쇠 · 오른쪽 끝 action. store 를 비우면 근무지 줄 없이 제목 줄만(급여 · 내 정보)
// storeAttrs: 근무지 버튼에 붙일 단서(시트 열기 등). 근무지 이름 칸은 data-slot="store" 라 고르면 바뀐다. chevron=false 면 꺾쇠 없음(근무지가 하나).
export const topBar = ({ store, storeAttrs = {}, alarmHref, hasNewAlarm = false, title, backHref, action = "", titleAfter = "", chevron = true }) => {
  const storeButton =
    store !== undefined
      ? `<button type="button"${attrs(storeAttrs)} aria-label="근무지 바꾸기, 지금 ${store}" class="flex min-h-[44px] max-w-full min-w-0 items-center gap-[6px] font-bold text-staff-text ${title ? "text-[15px]" : "text-[17px]"}">${storeMark()}<span class="truncate" data-slot="store">${store}</span>${chevron ? img("chevron-down.svg", 13, 13, "shrink-0 -scale-y-100") : ""}</button>`
      : "";
  const bell = `<a href="${alarmHref}" aria-label="${hasNewAlarm ? "알림, 새 알림 있음" : "알림"}" class="relative -mr-[10px] flex size-[44px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out active:bg-staff-info-bg">${img("bell.svg", 23, 23, "-scale-y-100")}${hasNewAlarm ? `<span class="absolute top-[10px] right-[11px] size-[8px] rounded-full border border-white bg-[#c24242]"></span>` : ""}</a>`;
  // 고래 몸통(별 아래) 가운데를 점포 동그라미 · 글자 가운데에 맞춘다 — 상자 가운데로 두면 별 때문에 몸통이 4.4px 처져 보였다(2026-11-24)
  if (!title)
    return `<header class="flex w-full items-center gap-[10px]"><span aria-hidden="true" class="relative size-[36px] shrink-0 -translate-y-[4.4px]">${img("logo-whale-small.svg", 36.193, 27.446, "absolute top-[8.75px] left-0")}${img("logo-stars-small.svg", 17.494, 12.668, "absolute top-0 left-[5.43px]")}</span><div class="min-w-0 flex-1">${storeButton}</div>${bell}</header>`;
  return `<header class="flex w-full flex-col"><div class="flex min-h-[44px] items-center gap-[12px]">${
    backHref ? `<a href="${backHref}" data-dir="nav-back" aria-label="뒤로" class="-ml-[10px] flex size-[44px] shrink-0 items-center justify-center">${img("back.svg", 19, 19, "-scale-y-100")}</a>` : ""
  }<div class="flex min-w-0 flex-1 items-center gap-[2px]"><h1 class="min-w-0 truncate text-[22px] leading-[1.4] font-bold">${title}</h1>${titleAfter}</div>${storeButton ? "" : action}${bell}</div>${
    storeButton ? `<div class="flex items-center justify-between gap-[10px]"><div class="min-w-0 flex-1">${storeButton}</div>${action}</div>` : ""
  }</header>`;
};
// 탭 화면 머리줄을 감싸는 흰 띠(store-header · title-header). 근무지 줄이 있으면 아래 8, 제목 줄만이면 아래 12
export const tabHeader = (html, { store = true } = {}) => `<div class="bg-white px-[24px] pt-[16px] ${store ? "pb-[8px]" : "pb-[12px]"}">${html}</div>`;
// 머리줄 오른쪽 글자 알약(「출퇴근 현황 ›」 · 「출퇴근하기 ›」). 보이는 알약 36px, 누르는 칸은 위아래를 넓혀 44px
export const pillLink = (href, label, icon = "") =>
  `<a href="${href}" class="group -my-[4px] flex min-h-[44px] shrink-0 items-center"><span class="flex h-[36px] items-center gap-[4px] rounded-full border border-staff-border bg-white pr-[10px] pl-[12px] text-[13px] font-semibold text-staff-text-sub group-active:bg-staff-primary-inactive ${PRESS}">${icon}${label}${maskIcon("chevron-right-small.svg", 12)}</span></a>`;

// sub-line.tsx — 값 · 항목 아래 한 칸 들여 둥근 └ 선(12×14, #C3CAD6)과 13px 흐린 글자
export const subLine = (children) =>
  `<span class="flex items-start gap-[6px] pl-[4px] text-[13px] leading-[1.5] break-keep text-staff-text-muted"><svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" fill="none" class="mt-[1px] shrink-0"><path d="M1.5 0.5V5.5Q1.5 9.5 5.5 9.5H11" stroke="#c3cad6" stroke-width="1.4" stroke-linecap="round"></path></svg><span class="min-w-0">${children}</span></span>`;

// section-title.tsx
export const sectionTitle = (title, { count, right = "" } = {}) =>
  `<div class="flex w-full items-center justify-between gap-[8px] leading-[1.5]"><h2 class="flex items-center gap-[8px] text-[16px] font-bold text-staff-text">${title}${count !== undefined ? `<span class="text-[12px] text-staff-primary">${count}</span>` : ""}</h2>${right}</div>`;

// page-header.tsx. backHref 는 다른 화면 주소, backAttrs 를 주면 링크 대신 그 단서를 단 버튼(데모 BackHeader 와 같은 일).
export const pageHeader = (title, { backHref, action = "" } = {}) =>
  `<header class="flex min-h-[72px] w-full items-center gap-[20px] bg-white px-[22px] py-[14px]">${backHref ? `<a href="${backHref}" data-dir="nav-back" aria-label="뒤로" class="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">${img("back.svg", 19, 19, "-scale-y-100")}</a>` : ""}<h1 class="min-w-0 flex-1 truncate text-[18px] leading-[1.5] font-bold">${title}</h1>${action}</header>`;

// period-nav.tsx. prevAttrs/nextAttrs: 누를 때 단서
export const periodNav = ({ label, prevLabel, nextLabel, prevAttrs = {}, nextAttrs = {} }) => {
  const buttonClass = "flex min-h-[44px] items-center text-[15px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:text-staff-text";
  return `<div class="flex w-full items-center gap-[8px] leading-[1.5]"><div class="min-w-0 flex-1"><button type="button"${attrs(prevAttrs)} class="${buttonClass}">${img("chevron-left-24.svg", 24, 24, "-scale-y-100")}${prevLabel}</button></div><p class="shrink-0 text-[16px] font-bold text-staff-text">${label}</p><div class="flex min-w-0 flex-1 justify-end"><button type="button"${attrs(nextAttrs)} class="${buttonClass} gap-[2px]">${nextLabel}${img("chevron-right-24.svg", 24, 24, "-scale-y-100")}</button></div></div>`;
};

// status-chip.tsx
const CHIP = {
  success: "bg-[#eaf8f2] text-[#13785e]",
  warning: "bg-[#fff6e5] text-[#956013]",
  working: "bg-[#e1e8ff] text-staff-primary",
  progress: "bg-[#eef2ff] text-staff-primary",
  neutral: "border border-staff-border-light bg-[#f9fbfd] text-staff-text-sub",
};
export const statusChip = (tone, text, weight = "bold") =>
  `<span class="shrink-0 rounded-[8px] px-[10px] py-[4px] text-[11px] leading-[1.5] ${weight === "bold" ? "font-bold" : "font-semibold"} ${CHIP[tone]}">${text}</span>`;

// switch-row.tsx. 켜고 끄는 클래스는 staff.js 가 같은 문자열로 바꾼다.
export const SWITCH_ON = "bg-staff-primary";
export const SWITCH_OFF = "bg-staff-primary-inactive";
export const sw = ({ checked, disabled = false, label, describedBy, ...a }) =>
  `<button type="button" role="switch" aria-checked="${checked}" aria-label="${label}"${describedBy ? ` aria-describedby="${describedBy}"` : ""}${disabled ? " disabled" : ""}${attrs(a)} class="relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-200 ${EASE_OUT} before:absolute before:-inset-y-[8px] before:inset-x-0 before:content-[''] ${checked ? SWITCH_ON : SWITCH_OFF} disabled:opacity-50"><span class="absolute top-[3px] left-[3px] size-[22px] rounded-full bg-white shadow-[0_3px_14px_rgba(36,56,89,0.02)] transition-transform duration-200 ${EASE_OUT} ${checked ? "translate-x-[20px]" : ""}"></span></button>`;
export const switchRow = ({ title, description, checked, locked = false, ...a }) => {
  const id = uid("sw");
  return `<li class="flex items-center gap-[12px] py-[17px] leading-[1.5]"><div class="flex min-w-0 flex-1 flex-col"><p class="text-[15px] font-semibold text-staff-text">${title}</p><p id="${id}" class="pt-[2px] text-[12px] text-staff-text-sub">${description}</p></div>${sw({ checked, disabled: locked, label: title, describedBy: id, ...a })}</li>`;
};

// work-time-bar.tsx
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const pad = (n) => String(n).padStart(2, "0");
export function workTimeBar({ schedule, worked, ongoing = false, from = 8, to = 20 } = {}) {
  const span = (to - from) * 60;
  const position = (t) => Math.min(Math.max(((toMinutes(t) - from * 60) / span) * 100, 0), 100);
  const place = (r) => `left:${position(r.start)}%;right:${100 - position(r.end)}%`;
  const ticks = Array.from({ length: Math.floor((to - from) / 4) + 1 }, (_, i) => from + i * 4);
  const label = [schedule && `예정 ${schedule.start}–${schedule.end}`, worked && `근무 ${worked.start}–${ongoing ? "진행 중" : worked.end}`].filter(Boolean).join(", ");
  return `<div class="flex w-full flex-col"><div role="img" aria-label="${label || "근무 없음"}" class="relative h-[26px] w-full overflow-clip rounded-[6px] bg-[#edf0f6]">${
    schedule
      ? `<div class="absolute inset-y-0 rounded-[5px] border border-dashed border-[#b6c1d5] bg-[repeating-linear-gradient(45deg,transparent_0_5px,rgba(22,25,28,0.04)_5px_10px)]" style="${place(schedule)}"></div>`
      : ""
  }${worked ? `<div class="absolute inset-y-[5px] rounded-[5px] bg-[#7676e4] ${ongoing ? "[mask-image:linear-gradient(to_right,black_82%,transparent)]" : ""}" style="${place(worked)}"></div>` : ""}</div><div class="flex justify-between text-[11px] leading-[1.5] text-staff-text-sub">${each(ticks, (h) => `<span>${pad(h)}:00</span>`)}</div></div>`;
}

// attendance-day.tsx. status: { label, tone }. cardAttrs: 카드를 누를 수 있게 할 때(데모 시트 열기)
const DAY_CARD = {
  done: "border-staff-border-light bg-white text-staff-text",
  today: "border-[#dce4ff] bg-[#eef2ff] text-staff-primary",
  upcoming: "border-staff-border-light bg-[#f9fbfd] text-staff-text-sub",
};
export function attendanceDayCard({ state, day, store, status, edited = false, summary, ...bar }) {
  const sub = state === "done" ? "text-staff-text-sub" : "";
  // 사방 20(아래 32 는 위아래가 달라 보였다), 근무지는 출퇴근 현황이 탭 위에 한 번 두어 비운다, 요약은 출근 · 퇴근 한 쌍씩 한 줄(2026-11-24)
  return `<article class="flex flex-col gap-[3px] rounded-[18px] border px-[20px] py-[20px] leading-[1.5] ${DAY_CARD[state]}"><div class="flex items-center gap-[8px] pb-[5px]"><h3 class="min-w-0 flex-1 text-[13px] font-bold">${day}</h3>${store ? `<span class="truncate text-[12px] ${sub}">${store}</span>` : ""}${edited ? img("pencil.svg", 11.719, 13.719, "", "수정된 기록") : ""}${status ? statusChip(status.tone, status.label) : ""}</div>${workTimeBar(bar)}<p class="pt-[2px] text-[12px] whitespace-pre-line ${sub}">${summary}</p></article>`;
}
export const dayOffRow = (label) =>
  `<p class="rounded-[12px] border border-staff-border-light bg-[#f9fbfd] px-[9px] pt-[11px] pb-[10px] text-center text-[13px] leading-[1.5] text-staff-text-sub">${label}</p>`;

// bottom-sheet.tsx. name: data-open 으로 여는 이름. a: dialog 에 붙일 단서(data-sheet-auto · data-on-close 등)
export const bottomSheet = (name, { title, description, closeLabel = "닫기", ...a }, children) =>
  `<dialog data-sheet="${name}" aria-label="${title}"${attrs(a)} class="m-0 mt-auto max-h-[90dvh] w-full max-w-none translate-y-full overflow-visible bg-transparent p-0 transition-[translate,overlay,display] transition-discrete duration-200 ease-in open:translate-y-0 open:duration-[260ms] open:ease-[cubic-bezier(0.23,1,0.32,1)] starting:open:translate-y-full backdrop:bg-[rgba(23,37,61,0.38)] backdrop:opacity-0 backdrop:backdrop-blur-[1.5px] backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 motion-reduce:transition-none motion-reduce:backdrop:transition-none"><div class="flex max-h-[90dvh] flex-col overflow-y-auto rounded-t-[26px] bg-white px-[24px] pt-[12px] pb-[max(22px,env(safe-area-inset-bottom))] leading-[1.5] text-staff-text shadow-[0_-8px_28px_rgba(22,25,28,0.16)]"><span aria-hidden="true" class="mx-auto h-[4px] w-[40px] shrink-0 rounded-[2px] bg-[#dce1e9]"></span><h2 class="pt-[25px] text-[20px] font-bold">${title}</h2>${description ? `<p class="pt-[19px] text-[14px] text-staff-text-sub">${description}</p>` : ""}<div class="flex flex-col gap-[13px] pt-[20px]">${children}<button type="button" data-close class="flex min-h-[52px] items-center justify-center rounded-[14px] text-[15px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive">${closeLabel}</button></div></div></dialog>`;
// 고르기 시트의 한 줄(bottom-sheet.tsx SheetOption). 왼쪽 정렬, 앞에 아이콘(근무지면 storeMark)을 둘 수 있다.
// 고른 줄은 남색 테두리 · 옅은 회색 바탕 · 먹색 글자에 오른쪽 끝 20px 남색 체크 동그라미(2026-11-24).
// 고른 표시는 staff.js 가 data-pick 묶음 안에서 옮긴다 — 줄 색은 data-on/data-off, 체크 동그라미는 data-pick-only 로 숨긴다.
const OPTION_ON = "border-staff-navy bg-staff-bg text-staff-text";
const OPTION_OFF = "border-[#e4e8ef] bg-white text-staff-text-sub";
export const sheetOption = (label, { selected = false, icon = "", ...a } = {}) =>
  `<button type="button" aria-pressed="${selected}" data-on="${OPTION_ON}" data-off="${OPTION_OFF}"${attrs(a)} class="flex min-h-[52px] items-center gap-[10px] rounded-[12px] border px-[14px] text-left text-[15px] font-semibold transition-colors duration-150 ease-out active:bg-staff-primary-inactive disabled:opacity-40 ${selected ? OPTION_ON : OPTION_OFF}">${icon}<span class="min-w-0 flex-1 truncate">${label}</span><span aria-hidden="true" data-pick-only class="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-staff-navy text-white${selected ? "" : " hidden"}"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 5 8.6l4.5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button>`;

// 근무지 고르기 시트(Figma 03.Sheet, HOME-2·WORK-4). 선택지는 /design 과 같다(2026-10-12 재영), 제목·설명은 문구 정리로 바꿨다. 홈 상단 선택기와
// 근무 정보의 근무지 카드가 같은 시트를 열고, 고른 근무지를 앱 전체가 따른다. 최근 선택이 곧 지금 근무지다.
// 고르면 화면의 근무지 이름(data-slot="store")을 바꾸고 닫는다. 체크는 data-pick 묶음이 고른 칸으로 옮긴다.
// 고를 수 있는 근무지는 체결 완료 계약이 있는 곳뿐이다(운영 정책 CTR-29). 퇴직한 합정점은 내 정보·급여 필터에만 남는다.
export const STORES = ["웨일카페 강남역점", "웨일카페 홍대점"];
export const storeSheet = (a = {}) =>
  bottomSheet(
    "store",
    { title: "근무지 선택", description: "선택한 근무지의 근무 정보가 표시됩니다.", ...a },
    `<div data-pick class="contents">${STORES.map((s) =>
      sheetOption(s, {
        icon: storeMark(),
        selected: s === STORES[0],
        "data-set": `store=${s}`,
        "data-toast": s === STORES[0] ? undefined : `${s}으로 변경했습니다`,
        "data-close": true,
      }),
    ).join("")}</div>`,
  );

// button.tsx. href 를 주면 링크. a: 그 밖 속성(data-go · disabled 등)
const BTN = {
  primary: "h-[52px] rounded-[12px] bg-staff-primary text-[15px] font-bold text-white active:bg-[#3e3fc6]",
  ghost: "h-[52px] rounded-[14px] text-[15px] font-bold text-staff-text-sub active:bg-staff-primary-inactive",
  outline: "h-[44px] rounded-[12px] border border-staff-border bg-white text-[14px] font-semibold text-staff-text active:bg-staff-primary-inactive",
};
const SHELL = `inline-flex w-full items-center justify-center gap-[8px] px-[18px] whitespace-nowrap ${PRESS}`;
export function button(label, { variant = "primary", href, ...a } = {}) {
  return href !== undefined
    ? `<a href="${href}"${attrs(a)} class="${SHELL} ${BTN[variant]}">${label}</a>`
    : `<button type="button"${attrs(a)} class="${SHELL} ${BTN[variant]}">${label}</button>`;
}

// text-field.tsx. React 의 defaultValue 는 value 로 준다.
export function textField({ label, help, error, ...a }) {
  const id = uid("f");
  const note = error || help;
  const pw = a.type === "password";
  const input = `<input${attrs(a)} id="${id}"${error ? ' aria-invalid="true"' : ""}${note ? ` aria-describedby="${id}-note"` : ""} class="${FIELD}${pw ? " pr-[52px]" : ""}">`;
  // 비밀번호 칸은 오른쪽 끝에 눈 버튼을 붙인다. 가린 채로 시작하고 누를 때마다 바뀐다(staff.js).
  const field = pw
    ? `<div class="relative">${input}<button type="button" data-pw-toggle aria-label="비밀번호 표시" class="absolute inset-y-0 right-[4px] flex w-[44px] items-center justify-center">${img("eye.svg", 20, 20)}${img("eye-slash.svg", 20, 20, "hidden")}</button></div>`
    : input;
  return `<div class="flex w-full flex-col gap-[8px]"><label for="${id}" class="text-[13px] font-semibold text-staff-text-sub">${label}</label>${field}${
    note ? `<p id="${id}-note" class="text-[12px] ${error ? "text-staff-error" : "text-staff-text-muted"}">${note}</p>` : ""
  }</div>`;
}

// notice.tsx. icon: HTML
export const notice = (children, icon) =>
  `<div class="flex w-full gap-[6px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-[13px] leading-[1.5] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">${
    icon ? `<span aria-hidden="true" class="flex w-[20px] shrink-0 items-center justify-center">${icon}</span>` : ""
  }<p class="min-w-0 flex-1">${children}</p></div>`;

// badge.tsx
const BADGE = {
  working: "bg-staff-primary-inactive text-staff-primary",
  progress: "bg-[#eef2ff] text-staff-primary",
  success: "bg-[#dcfce7] text-[#16a34a]",
  danger: "bg-[#fee2e2] text-[#dc2626]",
  warning: "bg-[#fef3c7] text-[#d97706]",
  waiting: "bg-[#f1f5f9] text-[#64748b]",
  plain: "bg-staff-bg text-staff-text-sub",
};
export const badge = (tone, text) =>
  `<span class="inline-flex shrink-0 items-center rounded-[8px] px-[10px] py-[4px] text-[12px] font-semibold whitespace-nowrap ${BADGE[tone]}">${text}</span>`;

// card.tsx
export const card = (children) => `<div class="w-full rounded-[16px] border border-staff-border-light bg-white p-[16px]">${children}</div>`;
const HERO = { primary: "bg-staff-primary", navy: "bg-staff-navy" };
export const heroCard = (tone, children) => `<div class="w-full rounded-[20px] p-[20px] text-white ${HERO[tone]}">${children}</div>`;

// info-row.tsx
export const infoRow = ({ href, icon, title, description }) =>
  `<a href="${href}" class="flex w-full items-center gap-[9px] rounded-[18px] border border-staff-border-light bg-white p-[16px] leading-[1.5] transition-colors duration-150 ease-out active:bg-staff-info-bg">${icon.endsWith(".svg") ? img(icon, 33, 33) : icon}<span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="truncate text-[14px] font-semibold text-staff-text">${title}</span>${
    description ? `<span class="truncate text-[12px] text-staff-text-sub">${description}</span>` : ""
  }</span>${img("chevron-right-muted.svg", 12, 12, "-scale-y-100")}</a>`;

// segmented-control.tsx. items: { value, label }. panelId 를 주면 탭(내용 쪽은 segmentPanel 로 그린다).
// panels: 탭마다 내용 id 를 따로 둘 때 { value: panelElementId } — staff.js 가 고른 칸의 data-show 만 보인다.
export const SEG_ON = "bg-staff-primary text-white";
export const SEG_OFF = "text-staff-text-muted";
export const segmentTabId = (panelId, value) => `${panelId}-tab-${value}`;
export function segmentedControl({ items, value, label, panelId, show = {}, itemAttrs = {} }) {
  return `<div role="${panelId ? "tablist" : "group"}" aria-label="${label}" data-pick class="flex w-full gap-[6px] rounded-[10px] bg-[#edf0f6] p-[3px]">${each(items, (item) => {
    const on = item.value === value;
    const role = panelId
      ? ` role="tab" id="${segmentTabId(panelId, item.value)}" aria-selected="${on}"${on ? ` aria-controls="${panelId}"` : ""}`
      : ` aria-pressed="${on}"`;
    return `<button type="button"${role} data-on="${SEG_ON}" data-off="${SEG_OFF}"${show[item.value] ? ` data-show="${show[item.value]}"` : ""}${attrs(itemAttrs[item.value])} class="min-h-[44px] flex-1 rounded-[10px] px-[14px] text-[13px] leading-[1.5] font-bold transition-[background-color,color] duration-200 ${EASE_OUT} ${on ? SEG_ON : SEG_OFF}">${item.label}</button>`;
  })}</div>`;
}

// bottom-nav.tsx. 데모 경로(demo-nav.ts): 출퇴근 칸은 출퇴근 등록으로 간다.
export const NAV_ITEMS = [
  { page: "home", label: "홈", icon: "nav-home.svg", activeIcon: "nav-home-on.svg" },
  { page: "work", label: "근무", icon: "nav-work.svg", activeIcon: "nav-work-on.svg" },
  { page: "check-in", label: "출퇴근", icon: "nav-attendance.svg" },
  { page: "pay", label: "급여", icon: "nav-pay.svg" },
  { page: "me", label: "내 정보", icon: "nav-me.svg" },
];
export function bottomNav(current) {
  return `<nav aria-label="주 메뉴" style="view-transition-name:bottom-nav" class="flex w-full items-end border-t border-staff-border-light bg-white px-[12px] pt-[9px] pb-[max(9px,env(safe-area-inset-bottom))] shadow-[0_-5px_10px_rgba(35,55,82,0.01)]">${each(NAV_ITEMS, (item) => {
    const on = item.page === current;
    return `<a href="${page(item.page)}"${on ? ' aria-current="page"' : ""} class="flex min-h-[54px] flex-1 flex-col items-center gap-[3.5px] rounded-[12px] py-[6px] text-[11px] leading-[1.5] transition-colors duration-150 ease-out ${
      on ? "font-bold text-staff-primary" : "text-staff-text-sub"
    }">${maskIcon((on && item.activeIcon) || item.icon, 23, true)}${item.label}</a>`;
  })}</nav>`;
}

// week-selector.tsx. days: { key, weekday, date, work?, muted?, note? }
export const weekTone = (on, muted) =>
  on
    ? "border-staff-primary bg-staff-primary text-white shadow-[0_5px_6px_rgba(49,93,245,0.16)]"
    : muted
      ? "border-[#dce4ff] bg-white text-staff-placeholder"
      : "border-[#dce4ff] bg-[#eef2ff] text-staff-text-sub";
export function weekSelector({ days, selected, show = {} }) {
  return `<div data-pick class="flex w-full gap-[8px]">${each(days, (day) => {
    const on = day.key === selected;
    // 고르지 않은 날의 근무 시간 글자는 남보라. 고르면 빠진다 — data-on/off 로 같이 바꾸게 note 칸에 표시를 단다.
    return `<button type="button" aria-pressed="${on}" aria-label="${day.weekday} ${day.date}일 ${day.note ?? (day.work ? "근무" : "예정 없음")}" data-on="${weekTone(true)}" data-off="${weekTone(false, day.muted)}"${show[day.key] ? ` data-show="${show[day.key]}"` : ""} class="flex min-w-0 flex-1 flex-col items-center gap-[4px] rounded-[10px] border py-[10px] leading-[1.5] transition-[background-color,border-color,color,box-shadow] duration-200 ${EASE_OUT} ${weekTone(on, day.muted)}"><span class="text-[12px]">${day.weekday}</span><span class="text-[16px] font-bold">${day.date}</span>${
      day.note ? `<span data-note class="text-[10px] ${on ? "" : "text-staff-primary"}">${day.note}</span>` : day.work ? `<span class="flex h-[6px] items-center gap-[3px]"><span class="size-[4px] rounded-[2px] bg-current"></span></span>` : ""
    }</button>`;
  })}</div>`;
}

// todo-list.tsx. 체크칸 단서는 staff.js(data-check)가 바탕·그림·제목 색을 바꾼다. onToggle 이 없으면(toggle=false) 보기 전용.
export const todoList = (children) => `<ul class="w-full divide-y divide-[#e8edf3]">${children}</ul>`;
export const CHECK_ON = "bg-staff-primary";
export const CHECK_OFF = "bg-staff-primary-inactive";
const checkMark = (done) => img(done ? "todo-check-on.svg" : "todo-check-off.svg", 12, 9, "pointer-events-none");
// open(시트 이름)을 주면 체크칸 · 제목 칸 어디를 눌러도 그 TO-DO 상세 시트(todoSheet)를 열고 체크는 바뀌지 않는다 — 상태는 시트에서 바꾼다
// (개발 화면 홈 카드 · 근무 탭, 2026-11-23 사용자 지정. 체크 한 번에 바로 완료돼 사라지면 잘못 눌렀을 때 당황스러웠다).
// 체크칸은 같은 모양의 버튼이고, 누르는 칸은 체크박스처럼 사방 8px 넓다.
// 체크칸 — 안 한 일은 흰 바탕 · 1.5px 테두리, 한 일은 남색(navy) 바탕 · 흰 체크(보라는 튀었다, 2026-11-24). staff.js 는 data-check="todo" 를 이 두 클래스로 바꾼다
export const TODO_CHECK_ON = "border-staff-navy bg-staff-navy";
export const TODO_CHECK_OFF = "border-staff-border bg-white";
export const todoItem = ({ title, meta, done = false, overdue = false, toggle = true, open, badges = "", ...a }) => {
  const box = `relative flex size-[24px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] transition-colors duration-150 ${EASE_OUT} ${done ? TODO_CHECK_ON : TODO_CHECK_OFF}`;
  const check = open
    ? `<button type="button" data-open="${open}"${attrs(a)} aria-label="${title} 상세 보기" class="${box}"><span aria-hidden="true" class="absolute -inset-[8px] rounded-[10px]"></span>${checkMark(done)}</button>`
    : `<label data-check="todo" class="${box}"><input type="checkbox"${done ? " checked" : ""}${toggle ? "" : " disabled"}${attrs(a)} aria-label="${title} 완료" class="absolute -inset-[8px] appearance-none rounded-[10px]">${checkMark(done)}</label>`;
  const line = open ? "span" : "p";
  const text = `<${line} data-check-title class="truncate text-[15px] font-semibold ${done ? "text-staff-text-muted" : "text-staff-text"}">${title}</${line}><${line} class="truncate pt-[2px] text-[12px] ${overdue ? "text-[#956013]" : "text-staff-text-sub"}">${meta}</${line}>`;
  const main = open
    ? `<button type="button" data-open="${open}" class="flex min-w-0 flex-1 flex-col text-left">${text}</button>`
    : `<div class="flex min-w-0 flex-1 flex-col">${text}</div>`;
  return `<li class="flex items-center gap-[12px] py-[17px] leading-[1.5]">${check}${main}${badges ? `<div class="flex shrink-0 gap-[4px]">${badges}</div>` : ""}</li>`;
};

// TO-DO 상세 시트(work/todo-panel.tsx TodoSheet). 홈 TO-DO 카드와 근무 탭이 같이 쓴다. 제목 · 내용 · 긴급/공유 칩 · 수행 예정 · (근무지) · 상태,
// 아래에 상태 바꾸기 [대기] [진행 중] [완료] — 개발 화면처럼 시트를 닫지 않고 고른 칸만 바뀐다. done(속성)을 주면 [완료]가 그 상태로 옮기며 닫는다.
// 되돌리기 토스트는 없다. 공유 TO-DO 는 닫기 버튼이 「확인」이고 수행자 안내를 붙인다.
const TODO_STATES = [
  ["waiting", "대기"],
  ["progress", "진행 중"],
  ["done", "완료"],
];
export const todoSheet = (name, { title, body, chips = "", rows, status = "waiting", shared = false, after = "", done = {}, ...a }) =>
  bottomSheet(
    name,
    { title, description: body, ...(shared ? { closeLabel: "확인" } : {}), ...a },
    `${chips ? `<div class="flex gap-[4px]">${chips}</div>` : ""}${sunken(values(rows))}${after}${shared ? notice("먼저 완료 처리한 사람이 수행자로 기록됩니다.") : ""}<div role="group" aria-label="상태 바꾸기" data-pick class="flex flex-col gap-[8px]">${each(TODO_STATES, ([v, label]) =>
      sheetOption(label, { selected: v === status, ...(v === "done" && v !== status ? done : {}) }),
    )}</div>`,
  );

// ── 데모 조각(옛 src/app/demo/_components). DESIGN.md 「데모 조각」 절 ──

// alert.tsx
const ALERT = { warning: "bg-[#fff6e5] text-[#956013]", danger: "bg-[#fee2e2] text-[#dc2626]" };
export const alert = (tone, children) =>
  `<div class="w-full space-y-[2px] rounded-[12px] p-[14px] text-left text-[13px] leading-[1.5] [&_strong]:font-bold ${ALERT[tone]}">${children}</div>`;

// back-header.tsx. 뒤로 가기가 같은 화면 안 상태 이동(data-go)이다.
export const backHeader = (title, backState) =>
  `<header class="flex min-h-[72px] w-full items-center gap-[20px] bg-white px-[22px] py-[14px]"><button type="button" data-go="${backState}" data-dir="nav-back" aria-label="뒤로" class="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">${img("back.svg", 19, 19, "-scale-y-100")}</button><h1 class="min-w-0 flex-1 truncate text-[18px] leading-[1.5] font-bold">${title}</h1></header>`;

// body.tsx
const BODY = {
  form: (center) => `flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] ${center ? "text-center" : ""}`,
  detail: (center) => `flex flex-1 flex-col gap-[20px] px-[22px] pb-[14px] ${center ? "pt-[52px] text-center" : "pt-[22px]"}`,
  // 하단 메뉴 탭 화면 본문 — 묶음 사이 · 위 여백 모두 12(2026-11-24)
  tab: () => "flex flex-1 flex-col gap-[12px] px-[22px] pt-[12px] pb-[14px]",
  // 출퇴근 화면 본문(좌우 24 · 아래 8)
  tab24: () => "flex flex-1 flex-col gap-[12px] px-[24px] pt-[12px] pb-[8px]",
};
export const body = (children, { variant = "form", center = false } = {}) => `<div class="${BODY[variant](center)}">${children}</div>`;
export const dock = (children, inset = 24) =>
  `<div class="mt-auto flex flex-col gap-[8px] bg-white pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))] ${inset === 30 ? "px-[30px]" : "px-[24px]"}">${children}</div>`;

// check-box.tsx. toggle=false 면 누를 수 없다.
export const checkBox = ({ checked = false, label, toggle = true, ...a }) =>
  `<label data-check class="relative flex size-[28px] shrink-0 items-center justify-center rounded-[2px] transition-colors duration-150 ${EASE_OUT} ${checked ? CHECK_ON : CHECK_OFF}"><input type="checkbox"${checked ? " checked" : ""}${toggle ? "" : " disabled"}${attrs(a)} aria-label="${label}" class="absolute -inset-[8px] appearance-none rounded-[10px]">${checkMark(checked)}</label>`;

// danger-button.tsx
const DANGER = `flex h-[52px] items-center justify-center rounded-[12px] bg-staff-error text-[15px] font-bold text-white transition-[background-color] duration-150 ${EASE_OUT} active:bg-[#dc2626]`;
export const dangerButton = (label, { href, ...a } = {}) =>
  href !== undefined ? `<a href="${href}"${attrs(a)} class="${DANGER}">${label}</a>` : `<button type="button"${attrs(a)} class="${DANGER}">${label}</button>`;

// empty.tsx. icon: HTML
export const empty = (icon, title, children) =>
  `<div class="flex flex-1 flex-col items-center justify-center gap-[14px] px-[8px] pb-[52px] text-center"><span class="flex size-[56px] items-center justify-center rounded-full border border-staff-border-light bg-white text-staff-text-sub">${icon}</span><h2 class="text-[18px] font-bold">${title}</h2><div class="flex max-w-[300px] flex-col gap-[8px] text-[14px] text-staff-text-sub">${children}</div></div>`;

// icon-row.tsx
export const iconRow = ({ icon, title, sub, flipY = false }) =>
  `<div class="flex items-center gap-[12px] py-[8px] text-left first:pt-0 last:pb-0"><span class="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">${maskIcon(icon, 16, flipY)}</span><div class="min-w-0 flex-1"><p class="text-[14px] font-semibold">${title}</p><p class="text-[12px] text-staff-text-sub">${sub}</p></div></div>`;

// sunken.tsx. rows: [이름, 값 HTML]
export const sunken = (children, { label, prose = false } = {}) =>
  `<div class="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-left ${prose ? "text-[13px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text" : ""}">${
    label ? `<p class="pb-[6px] text-[13px] font-semibold text-staff-text-sub">${label}</p>` : ""
  }${children}</div>`;
export const values = (rows) =>
  `<dl class="flex flex-col divide-y divide-staff-border-light">${each(
    rows,
    ([k, v]) =>
      `<div class="flex items-start gap-[12px] py-[9px] first:pt-0 last:pb-0"><dt class="shrink-0 text-[13px] font-medium text-staff-text-sub">${k}</dt><dd class="min-w-0 flex-1 text-right text-[13px] text-staff-text">${v}</dd></div>`,
  )}</dl>`;

// text.tsx
export const label = (children) => `<p class="text-[13px] font-semibold text-staff-text-sub">${children}</p>`;
export const tiny = (children) => `<p class="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text-sub">${children}</p>`;

// use-toast.tsx. 화면마다 하나 두고 staff.js 가 글자를 넣어 2초 보인다.
export const toast = () =>
  `<p role="status" data-toast-box hidden class="fixed bottom-[120px] left-1/2 z-40 -translate-x-1/2 rounded-[12px] bg-staff-navy/90 px-[16px] py-[10px] text-[13px] font-semibold whitespace-nowrap text-white"></p>`;

// 상태 블록. 보이는 것은 staff.js 가 정한다(주소 #상태, 모르면 첫 상태). contents 라 React 판처럼 안 요소가 바로 감싸는 틀의 자식이 된다.
export const state = (id, html) => `<div data-state="${id}" class="contents" hidden>${html}</div>`;

// demo-states.tsx. 상태 이름·번호는 staff.js 가 지금 상태로 채운다.
export function demoStates(states) {
  return `<details data-demo-states class="group fixed top-[8px] right-[8px] z-50 max-w-[280px] text-[12px] leading-[1.5] text-white max-[600px]:top-[40%] max-[600px]:right-0"><summary class="ml-auto flex max-[600px]:rounded-r-none max-[600px]:px-[10px] max-[600px]:py-[6px] w-fit cursor-pointer list-none items-center gap-[6px] rounded-full bg-staff-navy/85 px-[12px] py-[8px] font-semibold shadow-[0_4px_12px_rgba(24,34,55,0.18)] [&::-webkit-details-marker]:hidden"><span data-demo-count>상태 1/${states.length}</span><span data-demo-label class="font-normal text-white/70 max-[600px]:hidden">${states[0].label}</span></summary><div class="mt-[6px] max-h-[55dvh] overflow-y-auto rounded-[12px] bg-staff-navy/95 p-[6px] shadow-[0_8px_28px_rgba(22,25,28,0.24)]">${each(
    states,
    (s, i) =>
      `<button type="button" data-demo-pick="${s.id}" data-label="${s.label}" aria-current="${i === 0}" class="flex w-full items-baseline gap-[8px] rounded-[8px] px-[10px] py-[7px] text-left hover:bg-white/10 aria-[current=true]:bg-white/15"><span class="w-[16px] shrink-0 text-white/50 tabular-nums">${i + 1}</span><span><span class="font-semibold">${s.label}</span>${s.note ? `<span class="text-white/60"> · ${s.note}</span>` : ""}</span></button>`,
  )}<a href="${R}index.html" class="mt-[4px] block rounded-[8px] border-t border-white/10 px-[10px] py-[8px] text-white/80 hover:bg-white/10">← 데모 목록</a></div></details>`;
}
