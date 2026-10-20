// 직원 근무 앱 데모 · 급여. 기준 목업: docs/mockup/app/pay.html — 상태 5개(목록 · 상세 · 다시 보낸 명세서 · 빈 상태 · 필터 결과 없음)와
// 시트 3개(급여명세서 안내 · 점포 필터 · 연도 필터), 화면 문구·가짜 값·버튼 이동(data-go)·알림(data-toast)을 옮겼다. 금액은 목업 그대로다.
// 확정 쟁점: PAY-1 다시 보낸 명세서는 최신 값으로 덮고 이전 금액도, 바뀐 줄 표시(「· 정정됨」)도 없다(2026-10-20), 상세에 처리 이력
//   (확정 취소와 가장 최근 발송 한 줄만, 「재발송」 줄과 다시 발송 안내는 두지 않음(2026-10-20), 관리자 이름 없음) · PAY-2 상세에서만 명세서 내보내기(목록에는 버튼 없음) ·
//   PAY-3 연장수당은 한 줄 계산식 · PAY-4 퇴직한 뒤에도 급여 탭에서 생성일부터 3년 동안 조회, 탈퇴하면 볼 수 없음.
// 노무·세무 확인 대기: PAY-5(주휴·연장 계산식) · PAY-6(파트타이머 3.3% 원천징수 — 기본 공제의 소득세·지방소득세 대신)는 목업의 예시 금액 그대로.
// PAY-7(3.3% 끝자리 처리, 미정 · 세무 확인 대기, 2026-10-08)은 3.3% 원천징수 줄에 작은 글자로 붙이고 금액은 목업처럼 10원 단위 반올림 값 그대로다.
// 이 화면에 「입금」이라는 말은 쓰지 않는다(급여 지급은 이 시스템의 범위 밖).
// 목록은 Figma 08.급여(node 17:825 · 실지급액 카드 17:1003)를 따르되 문구·금액은 목업이다 — Figma 의 「도착」은 입금으로 읽혀 목업의 「발송」으로,
// 「퇴직 전까지 조회」는 PAY-4 로 바뀐 목업 문구로 바꿨다. 7월 줄은 목업처럼 상태 칩 없이 둔다(Figma 는 「다시 보냄」 칩).
// 상세 · 다시 보낸 명세서 · 빈 상태 · 안내 시트는 Figma 없음 — DESIGN.md 기준 초안. 상세의 실지급액은 목록과 같은 짙은 남색 카드다.
// 하단 메뉴는 목업처럼 다섯 칸이다(2026-10-08 재영 결정, Figma 는 네 칸).
import { backHeader, badge, body, bottomNav, bottomSheet, button, card, heroCard, img, notice, page, pageHeader, sheetOption, state, tiny } from "../../ui.mjs";

// 목업 오른쪽 목록 순서 그대로. 마지막은 목업의 「시트 열기」라 목록 위에 시트를 띄운다.
const STATES = [
  { id: "list", label: "목록", note: "기본 화면" },
  { id: "detail", label: "상세", note: "지급·공제·실지급액" },
  { id: "resent", label: "다시 보낸 명세서", note: "확정 취소 후 정정" },
  { id: "empty", label: "빈 상태", note: "발송된 것 없음" },
  { id: "filter-empty", label: "필터 결과 없음", note: "퇴직한 점포 고름" },
  { id: "about", label: "급여명세서 안내", note: "계산 주체 설명" },
];

// 목업 지난 명세서. 6월·5월도 목업처럼 8월 상세로 간다.
// 급여는 고른 근무지와 관계없이 받은 명세서를 모두 보이고, 줄마다 점포를 적는다(PAY-8, 2026-10-20 재영).
const PAST = [
  { month: "2026년 8월", sent: "웨일카페 강남역점 · 9월 10일 발송", amount: "844,430원", to: "detail", sentBadge: false },
  { month: "2026년 8월", sent: "웨일카페 홍대점 · 9월 5일 발송", amount: "312,000원", to: "detail", sentBadge: false },
  { month: "2026년 7월", sent: "웨일카페 강남역점 · 8월 20일 발송", amount: "835,430원", to: "resent", sentBadge: false },
  { month: "2026년 6월", sent: "웨일카페 홍대점 · 7월 3일 발송", amount: "745,340원", to: "detail", sentBadge: true },
  { month: "2026년 5월", sent: "웨일카페 강남역점 · 6월 3일 발송", amount: "889,490원", to: "detail", sentBadge: true },
];

// 명세서 한 장. amount 가 null 이면 계산 대상이 아니라 「해당 없음」이다(0원이 아니다). 합계·실지급액은 줄에서 더한다.
// 파트타이머 · 시급 10,320원 · 수·금·토 10:00~15:30(휴게 30분) 주 15시간. 공제는 4대보험 네 줄 + 3.3% 원천징수(PAY-6).
const PAYSLIPS = {
  detail: {
    period: "2026년 8월 1일 – 8월 31일",
    meta: "웨일카페 강남역점 · 파트타이머 · 9월 10일 발송",
    sent: true,
    earnings: [
      { name: "기본급", sub: "65시간 × 10,320원", amount: 670_800 },
      { name: "주휴수당", sub: "주 15시간 이상 · 개근 · 4주", amount: 123_840 },
      { name: "연장수당", sub: "8월 22일(토) 9시간 근무 · 소정 5시간 초과 4.0시간 × 1.5배", amount: 61_920 },
      { name: "식대", sub: "비과세", amount: 100_000 },
    ],
    deductions: [
      { name: "국민연금", amount: 38_550 },
      { name: "건강보험", amount: 30_370 },
      { name: "장기요양보험", amount: 3_930 },
      { name: "고용보험", amount: 7_710 },
      { name: "3.3% 원천징수", sub: "끝자리 세무 확인 대기(PAY-7)", amount: 31_570 },
    ],
    history: [["09-10 09:12", "발송"]],
  },
  resent: {
    period: "2026년 7월 1일 – 7월 31일",
    meta: "웨일카페 강남역점 · 파트타이머",
    sent: false,
    earnings: [
      { name: "기본급", sub: "70시간 × 10,320원", amount: 722_400 },
      { name: "주휴수당", sub: "주 15시간 이상 · 개근 · 4주", amount: 123_840 },
      { name: "연장수당", sub: "소정근로시간을 넘긴 날 없음", amount: null },
      { name: "식대", sub: "비과세", amount: 100_000 },
    ],
    deductions: [
      { name: "국민연금", amount: 38_080 },
      { name: "건강보험", amount: 30_000 },
      { name: "장기요양보험", amount: 3_880 },
      { name: "고용보험", amount: 7_620 },
      { name: "3.3% 원천징수", sub: "끝자리 세무 확인 대기(PAY-7)", amount: 31_230 },
    ],
    history: [
      // 발송 줄이 여럿이면 가장 최근 발송 한 줄만 보인다(운영 정책 PAY-20, 2026-10-20). 08-03 첫 발송은 보이지 않는다.
      ["08-20 10:05", "발송"],
      ["08-19 17:40", "확정 취소"],
    ],
  },
};

const won = (n) => n.toLocaleString("ko-KR");
const sum = (lines) => lines.reduce((total, l) => total + (l.amount ?? 0), 0);

// 목업 abar 의 안내 아이콘(ph-info). public/icons 에 없어 원 안의 i 를 직접 그린다. 보조 글자색.
const infoIcon = (size = 22) =>
  `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-staff-text-sub"><circle cx="12" cy="12" r="9.25"></circle><path d="M12 11v5.5M12 7.6v.1"></path></svg>`;

// 목업 table.pay: 항목 이름 아래 계산 근거를 작은 글자로 붙인다(PAY-3). 「해당 없음」은 흐린 글자. 정정된 줄도 따로 표시하지 않는다(PAY-1, 2026-10-20).
const payTable = (head, lines, totalLabel, total) =>
  card(
    `<table class="w-full text-[14px]"><thead><tr class="text-[13px] font-semibold text-staff-text-sub"><th class="pb-[8px] text-left font-semibold">${head}</th><th class="pb-[8px] text-right font-semibold">금액</th></tr></thead><tbody>${lines
      .map(
        (l) =>
          `<tr class="border-t border-staff-border-light align-top"><td class="py-[10px] pr-[12px]">${l.name}${
            l.sub ? `<span class="block text-[12px] break-keep text-staff-text-muted">${l.sub}</span>` : ""
          }</td><td class="py-[10px] text-right whitespace-nowrap tabular-nums ${l.amount === null ? "text-staff-text-muted" : ""}">${l.amount === null ? "해당 없음" : won(l.amount)}</td></tr>`,
      )
      .join(
        "",
      )}</tbody><tfoot><tr class="border-t border-staff-border font-bold"><td class="pt-[10px]">${totalLabel}</td><td class="pt-[10px] text-right tabular-nums">${won(total)}</td></tr></tfoot></table>`,
  );

// 상세와 다시 보낸 명세서가 같이 쓰는 본문: 급여 기간 · 지급 항목 · 공제 항목 · 실지급액 · 처리 이력 · 내보내기(PAY-2).
const payslipView = (p) => {
  const earningsTotal = sum(p.earnings);
  const deductionsTotal = sum(p.deductions);
  return (
    // 목업 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14.
    `<section class="flex flex-col gap-[8px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]"><div class="flex items-start justify-between gap-[12px]"><div class="flex flex-col gap-[4px]"><p class="text-[13px] font-semibold text-staff-text-sub">급여 기간</p><p class="text-[16px] font-bold">${p.period}</p></div>${
      p.sent ? badge("success", "발송 완료") : ""
    }</div><p class="text-[12px] text-staff-text-muted">${p.meta}</p></section>` +
    payTable("지급 항목", p.earnings, "지급 합계", earningsTotal) +
    payTable("공제 항목", p.deductions, "공제 합계", deductionsTotal) +
    // 실지급액: 목록의 이번 달 카드와 같은 짙은 남색(DESIGN.md — 급여 화면에서 가장 먼저 볼 숫자).
    heroCard(
      "navy",
      `<div class="flex items-center justify-between gap-[12px]"><p class="text-[18px] font-bold">실지급액</p><p class="font-bold tabular-nums"><span class="text-[28px]">${won(earningsTotal - deductionsTotal)}</span><span class="text-[17px]"> 원</span></p></div>`,
    ) +
    // PAY-1: 시각과 짧은 꼬리표만. 관리자 이름은 적지 않는다. 최근 것이 위.
    card(
      `<p class="text-[13px] font-semibold text-staff-text-sub">처리 이력</p><ul class="flex flex-col gap-[4px] pt-[8px] text-[12px] text-staff-text-muted">${p.history
        .map(([at, kind]) => `<li><span class="tabular-nums">${at}</span> · ${kind}</li>`)
        .join("")}</ul>`,
    ) +
    button("명세서 내보내기", { variant: "outline", "data-toast": "처리 완료본 PDF 를 공유합니다" })
  );
};

const listHeader = () =>
  pageHeader("급여", {
    backHref: page("home"),
    action: `<button type="button" data-open="about" aria-label="급여명세서 안내" class="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">${infoIcon()}</button>`,
  });
const backToList = () => backHeader("급여명세서", "list");

const sheet = (a = {}) =>
  bottomSheet(
    "about",
    { title: "급여명세서는 이렇게 만들어집니다", ...a },
    `<p class="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text"><strong>기본급·주휴수당·연장수당</strong>은 근로계약과 출퇴근 기록으로 시스템이 계산하고 관리자가 확인합니다. <strong>나머지 지급 항목과 공제 항목은 관리자가 직접 넣습니다.</strong> 요율이 해마다 바뀌거나 사람이 판단할 값이기 때문입니다.</p><p class="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">맨 위 금액은 <strong>그 달에 받은 급여명세서의 실지급액을 모두 더한 값</strong>입니다. 받은 날(발송일) 기준이고, 근무지가 여럿이면 함께 더합니다.</p>${notice(
      "급여 지급(입금)은 이 앱이 처리하지 않습니다. 명세서 데이터는 생성일로부터 3년간 보관됩니다.",
      infoIcon(16),
    )}`,
  );

// 명세서 목록 필터(PAY-10, 2026-10-20 재영): 점포 · 연도(급여 기간 기준) 칩. 처음은 전체 점포 · 올해, 바꾼 칩은 남보라로 강조한다.
const chip = (label, sheetName, on) =>
  `<button type="button" data-open="${sheetName}" class="flex h-[36px] items-center gap-[6px] rounded-full border px-[14px] text-[13px] font-semibold ${
    on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text-sub"
  }">${label}${img("chevron-down.svg", 12, 12, "-scale-y-100")}</button>`;

// 점포는 명세서를 받은 적이 있는 곳 모두(퇴직한 곳 포함), 연도는 보관 3년에 맞춰 올해부터 3년 전까지(PAY-4). 합정점(퇴직, 2025년 명세서만)을 고르면 필터 결과 없음으로 간다.
const filterSheets = () =>
  bottomSheet(
    "pf-store",
    { title: "점포", description: "명세서를 받은 적이 있는 점포를 모두 보입니다. 퇴직한 곳도 들어갑니다." },
    `<div data-pick class="contents">${[
      ["전체 점포", { "data-go": "list" }],
      ["웨일카페 강남역점", { "data-toast": "웨일카페 강남역점 명세서만 보입니다" }],
      ["웨일카페 홍대점", { "data-toast": "웨일카페 홍대점 명세서만 보입니다" }],
      ["웨일베이커리 합정점 · 퇴직", { "data-go": "filter-empty" }],
    ]
      .map(([label, a], i) => sheetOption(label, { selected: i === 0, "data-close": true, ...a }))
      .join("")}</div>`,
  ) +
  bottomSheet(
    "pf-year",
    { title: "연도", description: "급여 기간 기준입니다. 보관 기간 3년에 맞춰 올해부터 3년 전까지 고릅니다." },
    `<div data-pick class="contents">${[2026, 2025, 2024, 2023]
      .map((y, i) => sheetOption(`${y}년`, { selected: i === 0, "data-close": true, "data-toast": i ? `${y}년 명세서를 보여 줍니다` : undefined }))
      .join("")}</div>`,
  );

const list = (filtered = false) =>
  listHeader() +
  body(
    // 이번 달 실지급액(Figma node 17:1003): 짙은 남색 · radius 24 · 안쪽 25. 남색 위 흐린 글자 #BAC7DE·#D1DAEB 는 이 카드에만 쓴다(/design/pay 그대로).
    // 이번 달에 받은(발송된) 명세서 전체의 실지급액 합. 근무지와 관계없이 세고 누르는 곳은 없다. 합계·건수·점포는 api 가 내려 준 값이다(PAY-9, 운영 정책 PAY-08).
    `<section aria-label="이번 달에 받은 급여명세서" class="flex flex-col rounded-[24px] bg-staff-navy p-[25px] text-white"><p class="text-[13px] text-[#bac7de]">9월에 받은 급여명세서 · 실지급액 합계</p><p class="pt-[14px] pb-[16px] font-bold"><span class="text-[32px]">1,156,430</span><span class="text-[17px]"> 원</span></p><p class="border-t border-white/13 pt-[15px] text-[12px] text-[#d1daeb]">명세서 2건 · 웨일카페 강남역점, 웨일카페 홍대점</p></section>` +
      `<section class="flex flex-col rounded-[20px] border border-staff-border-light bg-white p-[20px]"><div class="flex items-center justify-between"><h2 class="text-[13px] font-semibold text-staff-text-sub">명세서</h2><span class="text-[12px] text-staff-text-muted">${filtered ? 0 : PAST.length}건</span></div><div class="flex gap-[8px] pt-[10px]">${chip(filtered ? "웨일베이커리 합정점" : "전체 점포", "pf-store", filtered)}${chip("2026년", "pf-year", false)}</div>${
        filtered
          ? `<div class="flex flex-col items-center gap-[10px] pt-[24px] pb-[6px] text-center"><p class="text-[14px] text-staff-text-sub">조건에 맞는 명세서가 없습니다</p>${button("필터 지우기", { variant: "outline", "data-go": "list" })}</div>`
          : ""
      }<ul class="divide-y divide-staff-border-light pt-[4px]"${filtered ? " hidden" : ""}>${PAST.map(
        (p) =>
          `<li><button type="button" data-go="${p.to}" class="flex min-h-[44px] w-full items-center gap-[12px] py-[17px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"><span class="flex min-w-0 flex-1 flex-col"><span class="truncate text-[15px] font-semibold">${p.month}</span><span class="truncate pt-[2px] text-[12px] text-staff-text-sub">${p.sent}</span></span><span class="flex shrink-0 flex-col items-end gap-[3px]"><span class="text-[13.5px] tabular-nums">${p.amount}</span>${
            p.sentBadge ? badge("success", "발송 완료") : ""
          }</span></button></li>`,
      ).join("")}</ul></section>` +
      // 목업 grow 뒤 tiny · Figma mt-auto: 본문이 짧으면 맨 아래에 붙는다.
      `<div class="mt-auto">${tiny("명세서는 이메일로도 발송됩니다. <b>퇴직한 뒤에도 이 급여 탭에서</b> 조회할 수 있고, 명세서를 만든 날부터 3년 동안 볼 수 있습니다. 계정을 탈퇴하면 볼 수 없습니다.")}</div>`,
    { variant: "detail" },
  );

const VIEWS = {
  list: () => list() + sheet() + filterSheets(),
  "filter-empty": () => list(true) + sheet() + filterSheets(),
  detail: () =>
    backToList() +
    body(payslipView(PAYSLIPS.detail) + tiny("급여 지급은 이 화면에서 처리하지 않습니다. 실제 지급은 회사의 지급 절차를 따릅니다."), { variant: "detail" }),
  resent: () =>
    backToList() +
    body(
      payslipView(PAYSLIPS.resent),
      { variant: "detail" },
    ),
  empty: () =>
    listHeader() +
    body(
      `<div class="flex flex-1 flex-col items-center justify-center gap-[8px] py-[52px] text-center">${img("menu-payslip.svg", 44, 44, "mb-[6px]")}<p class="text-[18px] font-bold">아직 받은 명세서가 없습니다</p><p class="max-w-[230px] text-[13px] text-staff-text-sub">급여명세서는 관리자가 확정해 발송한 뒤에만 이 화면에 나타납니다.</p></div>`,
      { variant: "detail" },
    ) +
    sheet(),
  about: () => list() + sheet({ "data-sheet-auto": true, "data-on-close": "#list" }),
};

export default () => ({
  title: "급여",
  states: STATES,
  // 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다(/design/pay 그대로).
  html: `<div class="flex flex-1 flex-col"><main class="flex flex-1 flex-col leading-[1.5]">${STATES.map((s) => state(s.id, VIEWS[s.id]())).join("")}</main><div class="sticky bottom-0 mt-auto">${bottomNav("pay")}</div></div>`,
});
