// 직원 근무 앱 데모 · 알림. 기준 목업: docs/mockup/app/notify.html — 상태 4개(알림함 · 알림 없음 · 수신 설정 · 연결 끊김),
// 화면 문구·가짜 값·버튼의 이동(data-go)·알림(data-toast)을 옮겼다. 목업에 시트는 없다. 쟁점 NOTI-1~8 은 모두 확정이다.
//   직원 알림은 근로계약서 발송 · 근무스케줄 변경 · TO-DO 수행 임박 · 급여명세서 발송 넷뿐이다(S-AYBNWF).
//   NOTI-1 TO-DO 배정 알림은 없고 수행 예정 일시가 다가오면 수행 임박 알림을 한 번 보낸다(2026-10-19). 근무시간 외 보류 규칙은 없다. 긴급 TO-DO 는 빨간 점.
//   NOTI-2 알림톡은 자동 대체 없이 프로세스별로 함께 보낸다. NOTI-3 알림함은 14일 보관. NOTI-4 한 줄에 발송 결과까지 적는다.
//   NOTI-5 알림함은 머리줄 알림 버튼으로 들어온다(홈 데모). NOTI-6 다시 보낸 급여명세서도 처음과 같은 「도착했습니다」(2026-10-20).
//   알림을 누르면 관련 화면으로 가며 자동으로 읽음 처리된다. 직원 알림함은 줄마다 읽음을 바꿀 수 있고(S-IMFWJT), 머리에 「모두 읽음」도 둔다(NOTI-7,
//   2026-10-08) — 관리자 웹 운영 알림함은 모두 읽음만 둔다.
//   수신은 수신 설정 묶음(근로계약서 · 근무스케줄 · TO-DO · 급여명세서) 단위로 켜고 끈다. 네 묶음 모두 끌 수 있고(NOTI-8, 2026-10-20), 꺼 둔 묶음의 알림도
//   알림함에는 남는다(S-SIGZJQ). TO-DO 묶음은 수행 임박 알림의 앱 푸시다.
// 수신 설정(settings)은 Figma 09.알림설정(node 17:1097)을 따른다. 알림함 · 알림 없음 · 연결 끊김은 Figma 없음 — DESIGN.md 기준 초안.
// 목업과 다른 점: 목업 btn--quiet(더 보기)는 outline 버튼이다. 하단 메뉴는 목업처럼 다섯 칸이다(2026-10-08 재영 결정).
// 목업에서 링크가 없던 읽은 줄도 같은 규칙으로 관련 화면에 잇는다. 줄마다 읽음을 바꾸는 동작은 목업에 그려져 있지 않아 왼쪽 점을 누르는 것으로 그렸다.
// 데모라 다른 화면으로 갔다 돌아오면 읽음 표시는 처음으로 돌아간다. 읽음 바꾸기 · 모두 읽음은 assets/staff.js 가 맡는다.
import { PRESS, backHeader, bottomNav, button, empty, maskIcon, notice, page, pageHeader, state, switchRow } from "../../ui.mjs";

// 목업 오른쪽 목록 순서 그대로.
const STATES = [
  { id: "inbox", label: "알림함", note: "미확인 4건" },
  { id: "inbox-empty", label: "알림 없음", note: "빈 상태" },
  { id: "settings", label: "수신 설정", note: "수신 설정 묶음별 토글" },
  { id: "gone", label: "연결 끊김", note: "데이터 삭제·접근 불가" },
];

// 알림 유형별 아이콘과 누르면 가는 곳. 목업 pay.html 에 「다시 보낸 명세서」 상태가 있어 다시 발송 알림은 그리로 간다.
const KIND = {
  contract: { icon: "contract.svg", flipY: false, href: () => page("contract", "detail") },
  schedule: { icon: "nav-work.svg", flipY: true, href: () => page("work") },
  todo: { icon: "check.svg", flipY: false, href: () => page("work", "todo") },
  payslip: { icon: "nav-pay.svg", flipY: true, href: () => page("pay", "detail") },
};

// 목업 알림함 여덟 줄 그대로. 위 넷이 미확인이다.
const NOTIFICATIONS = [
  {
    id: "n1",
    kind: "contract",
    title: "근로계약서가 도착했습니다",
    sub: "웨일카페 강남역점 · 2026년 9월 근로계약서 · 서명 대기",
    sent: "알림톡으로도 보냈습니다",
    time: "4분 전",
    unread: true,
  },
  { id: "n2", kind: "schedule", title: "이번 주 근무스케줄이 바뀌었습니다", sub: "9월 12일 (토) 근무가 13:00–22:00으로 바뀌었습니다", time: "1시간 전", unread: true },
  { id: "n3", kind: "todo", title: "곧 해야 할 TO-DO가 있습니다 · 긴급", sub: "환불 요청 처리 · 오늘 15:00", time: "3시간 전", unread: true, urgent: true },
  { id: "n4", kind: "payslip", title: "8월 급여명세서가 도착했습니다", sub: "급여 기간 8월 1일 – 8월 31일", time: "5시간 전", unread: true, href: () => page("pay", "resent") },
  { id: "n5", kind: "todo", title: "곧 해야 할 TO-DO가 있습니다", sub: "유통기한 라벨 점검 · 어제 14:00 · 읽음", time: "어제 13:00" },
  { id: "n6", kind: "payslip", title: "8월 급여명세서가 도착했습니다", sub: "읽음", time: "8일 전" },
  { id: "n7", kind: "schedule", title: "근무스케줄이 바뀌었습니다", sub: "9월 9일 (수) 근무가 휴무로 바뀌었습니다 · 읽음", time: "4일 전" },
  { id: "n8", kind: "contract", title: "근로계약서가 도착했습니다", sub: "2026년 8월 근로계약서 · 서명 완료 · 읽음", time: "12일 전" },
];

// public/icons 에 없는 아이콘 둘(목업 ph-gear-six · ph-link-break). 이 화면에만 나와 글자색을 따르는 선 아이콘으로 그린다.
const gearIcon = () =>
  `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>`;
const linkBreakIcon = () =>
  `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2"></path><path d="M4 4l16 16"></path></svg>`;

// 알림 한 줄. 왼쪽 점이 읽음 상태를 보이고 누르면 바꾼다(S-IMFWJT, 누르는 칸 44px). 미확인은 남보라, 긴급 TO-DO 는 빨간 점(TopBar 새 알림 점과 같은 #C24242),
// 읽음은 빈 고리. 나머지를 누르면 읽음으로 바꾸고 관련 화면으로 간다. 읽은 줄은 글자를 흐리게 가라앉힌다.
const notificationRow = ({ kind, title, sub, sent, time, unread, urgent, href }) => {
  const k = KIND[kind];
  return `<li class="flex items-start"><button type="button" aria-label="${unread ? `${title} 읽음으로 표시` : `${title} 안 읽음으로 표시`}" aria-pressed="${!unread}" class="flex size-[44px] shrink-0 items-center justify-center self-stretch pt-[2px]"><span class="size-[8px] rounded-full ${
    unread ? (urgent ? "bg-[#c24242]" : "bg-staff-primary") : "border border-staff-border"
  }"></span></button><a href="${(href ?? k.href)()}" class="flex min-w-0 flex-1 items-start gap-[12px] py-[14px] pr-[16px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"><span class="flex size-[22px] shrink-0 items-center justify-center ${
    unread ? "text-staff-text" : "text-staff-placeholder"
  }">${maskIcon(k.icon, kind === "todo" ? 14 : 19, k.flipY)}</span><span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="text-[14px] font-semibold ${unread ? "text-staff-text" : "text-staff-text-muted"}">${title}</span><span class="text-[12px] text-staff-text-sub">${sub}</span>${
    // 그 알림의 발송 결과(NOTI-4).
    sent ? `<span class="text-[12px] text-staff-text-muted">${sent}</span>` : ""
  }</span><span class="shrink-0 pt-[2px] text-[12px] text-staff-text-muted">${time}</span></a></li>`;
};

// 알림함으로 들어가는 머리줄 오른쪽 버튼(목업 abar__end 톱니). 누르는 칸 44px, PageHeader 뒤로 가기처럼 -10px 여백.
const settingsButton = () =>
  `<button type="button" data-go="settings" aria-label="알림 설정" class="m-[-10px] flex size-[44px] shrink-0 items-center justify-center text-staff-text">${gearIcon()}</button>`;

const header = (id) =>
  id === "settings" ? backHeader("알림 설정", "inbox") : pageHeader("알림", { backHref: page("home"), action: id === "gone" ? "" : settingsButton() });

const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

const MAIN = {
  inbox: () =>
    `<main class="flex flex-1 flex-col gap-[16px] px-[16px] pt-[16px] pb-[24px]"><div class="-my-[8px] flex items-center justify-between pl-[2px]"><span class="text-[13px] font-semibold text-staff-text-sub">미확인 ${unreadCount}건</span><button type="button" data-toast="모두 읽음으로 바꿨습니다" class="h-[44px] rounded-[14px] px-[12px] text-[13px] font-bold text-staff-text-sub active:bg-staff-primary-inactive ${PRESS}">모두 읽음</button></div><ul class="flex flex-col divide-y divide-staff-border-light overflow-hidden rounded-[16px] border border-staff-border-light bg-white">${NOTIFICATIONS.map(
      notificationRow,
    ).join("")}</ul>${button("더 보기", { variant: "outline", "data-toast": "20건을 더 불러왔습니다" })}${notice(
      "알림은 <strong>14일</strong> 동안 보관됩니다.<br>근로계약서와 급여명세서는 각 화면에서 계속 볼 수 있습니다.",
      maskIcon("history.svg", 16, true),
    )}</main>`,

  "inbox-empty": () =>
    `<main class="flex flex-1 flex-col">${empty(maskIcon("bell.svg", 24, true), "받은 알림이 없습니다", "새 알림이 오면 여기에 표시됩니다.")}</main>`,

  // 수신 설정 — Figma 09.알림설정(node 17:1097)의 여백·목록·안내 블록, 문구는 목업.
  settings: () =>
    `<main class="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px]"><p class="pb-[4px] text-[14px]">받을 푸시 알림을 선택해 주세요.<br>꺼 둔 알림도 알림함에서 확인할 수 있습니다.</p><ul class="divide-y divide-[#e8edf3]">${switchRow({
      title: "근로계약서",
      description: "근로계약서를 받으면 알려 드립니다",
      checked: true,
    })}${switchRow({ title: "근무스케줄 변경", description: "근무 시간이나 근무일이 바뀌면 알려 드립니다", checked: true })}` +
    // 네 묶음 모두 직원이 끈다(NOTI-8, 2026-10-20). TO-DO 묶음은 수행 임박 알림의 앱 푸시다.
    `${switchRow({ title: "TO-DO", description: "해야 할 시간이 다가오면 알려 드립니다", checked: true })}${switchRow({
      title: "급여명세서",
      description: "급여명세서를 받으면 알려 드립니다",
      checked: true,
    })}</ul>` +
    // 채널 안내(node 17:1241): #F9FBFD 바탕 · 옅은 테두리 · radius 14 · 안쪽 14. 문구는 NOTI-2 확정 뒤의 목업 문구.
    `<p class="mt-auto rounded-[14px] border border-staff-border-light bg-[#f9fbfd] p-[14px] text-[12px] text-staff-text-sub">근로계약서처럼 꼭 확인해야 하는 알림은<br>카카오 알림톡으로도 함께 보낼 수 있습니다.</p></main>`,

  // 알림을 눌렀지만 관련 항목이 지워졌거나 볼 수 없을 때. 알림은 알림함에 남는다.
  gone: () =>
    `<main class="flex flex-1 flex-col">${empty(
      linkBreakIcon(),
      "해당 내용을 열 수 없습니다",
      `삭제되었거나 더 이상 볼 수 없는 내용입니다.<div class="pt-[8px]">${button("알림함으로 돌아가기", {
        variant: "ghost",
        "data-go": "inbox",
        "data-dir": "nav-back",
      })}</div>`,
    )}</main>`,
};

export default () => ({
  title: "알림",
  states: STATES,
  // 목업 탭바는 수신 설정·연결 끊김에서 빠진다(data-unless). 알림은 메뉴 칸이 아니라 지금 칸이 없다.
  html:
    STATES.map((s) =>
      state(
        s.id,
        `<div class="flex flex-1 flex-col leading-[1.5]">${header(s.id)}${MAIN[s.id]()}${
          s.id === "inbox" || s.id === "inbox-empty" ? `<div class="sticky bottom-0 mt-auto">${bottomNav(null)}</div>` : ""
        }</div>`,
      ),
    ).join(""),
});
