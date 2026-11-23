// 신고 정보 데모. 기준 목업: docs/mockup/app/tax.html — 상태 5개(안내 · 입력 · 완료 · 등록된 값 · 앞자리 불일치)와 시트 1개(주민등록번호를 따로 받는 이유),
// 화면 문구·가짜 값·하단 버튼의 이동(data-go)·알림(data-toast)을 그대로 옮겼다.
// 신고 정보는 날인을 마친 직원이 직접 넣는 4대보험 취득 신고·원천징수용 값이고 계약서와 따로 받는다(STAFF-16).
// 확정 쟁점: 주민등록번호는 계약서에 넣지 않는다(TAX-1) · 날인 직후 본인이 넣는다, 관리자가 대신 받는 길 없음(TAX-2) ·
// 동의 체크 없이 수집 목적을 적는다(TAX-3) · 건너뛸 수 없다(TAX-4) · 급여 계좌를 같은 화면에서 받는다(TAX-5) ·
// 신고 서류를 누가 만드는지는 2차로 미룸(TAX-6). 안내는 근거별로 나눈다 — 주민등록번호는 법령, 급여 계좌는 계약 이행(운영 정책 TAX-08).
// 처리방침 문구는 우리 초안 · 법무 확인 대기(TAX-7)라 화면 문구도 목업 그대로 두었다.
// 목업과 다른 점: 주민등록번호 입력칸은 앞 6자리와 뒤 7자리로 나누고 뒷자리를 가려 보인다(목업은 한 칸에 그대로 보임).
// Figma 없음 — DESIGN.md 기준 초안.
// 입력 화면의 뒤로 가기는 들어온 곳(안내 또는 등록된 값)으로 돌아간다(목업 data-go-back) — assets/staff.js 가 맞춘다.
import { FIELD, backHeader, body, bottomSheet, button, card, dock, iconTile, label, maskIcon, notice, page, pageHeader, state, sunken, values } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. 「따로 받는 이유」 시트는 개발 화면에서 뺐다(2026-11-23). bank 는 입력 화면 위 은행 시트.
const STATES = [
  { id: "intro", label: "안내", note: "날인 직후" },
  { id: "form", label: "입력", note: "동의 체크 없음" },
  { id: "done", label: "완료", note: "수집 일시·목적" },
  { id: "view", label: "등록된 값", note: "내 정보에서" },
  { id: "mismatch", label: "앞자리 불일치", note: "생년월일과 다름, 저장 막힘" },
  { id: "empty", label: "입력 전", note: "내 근무지에서 · 왜 · 언제 · 안 하면" },
  { id: "bank", label: "은행 선택", note: "바텀시트 한 줄 3개" },
];

// 두 값의 받은 근거(운영 정책 TAX-08). 입력 화면과 등록된 값 화면이 같은 문장을 쓴다 — 입력 화면만 두 줄로 끊는다.
const RRN_BASIS = ["4대보험 신고와 근로소득 원천징수를 위해 <b>법령에 따라</b> 수집하며,", "신고 서류를 만들 때만 사용합니다."];
const ACCOUNT_BASIS = ["<b>근로계약에 따라</b> 급여를 지급하기 위해 수집하며,", "급여 지급 외에는 사용하지 않습니다."];

// 받은 근거 한 줄(Caption 12px). 강조는 <b>.
const basis = (children) => `<p class="pt-[6px] text-[12px] text-staff-text-sub first:pt-0 [&_b]:font-bold [&_b]:text-staff-text">${children}</p>`;

// 주민등록번호: 앞 6자리는 보이고 뒤 7자리는 가린다(type=password). textField 는 한 칸이라 FIELD 로 두 칸을 그린다.
// mismatch: 앞자리가 계정 생년월일과 다를 때만 앞칸을 빨갛게 하고 칸 아래 오류를 띄운다. 오류 문구에 생년월일 값은 넣지 않는다(운영 정책 TAX-09).
const rrnField = (mismatch) => {
  const id = mismatch ? "tax-rrn-err" : "tax-rrn-help";
  const invalid = mismatch ? ' aria-invalid="true"' : "";
  return `<fieldset class="flex flex-col gap-[8px]">${LEGEND("주민등록번호")}${basis(RRN_BASIS.join("<br>"))}<div class="flex items-center gap-[8px]"><input aria-label="주민등록번호 앞 6자리" placeholder="앞 6자리" inputmode="numeric" maxlength="6" required value="${mismatch ? "950101" : "900101"}"${invalid} aria-describedby="${id}" class="${FIELD}"><span aria-hidden="true" class="text-staff-text-muted">–</span><input aria-label="주민등록번호 뒤 7자리" placeholder="뒤 7자리" type="password" inputmode="numeric" maxlength="7" autocomplete="off" required value="1234567" aria-describedby="${id}" class="${FIELD}"></div>${
    mismatch
      ? `<p id="${id}" role="alert" class="text-[12px] text-staff-error">주민등록번호 앞자리가 생년월일과 다릅니다.<br>생년월일이 잘못되었다면 근무지 관리자에게 수정을 요청해 주세요.</p>`
      : `<p id="${id}" class="text-[12px] text-staff-text-muted">주민등록번호 앞자리는 생년월일과 같아야 합니다.</p>`
  }</fieldset>`;
};

// 칸 이름(개발 화면 tax-profile-fields LEGEND) — 15px 굵게, 필수는 빨간 별표. 근거(basis)는 이름 아래 · 입력칸 위(2026-11-23 사용자 지정).
const LEGEND = (name) => `<legend class="pb-[4px] text-[15px] font-bold text-staff-text">${name}<span aria-hidden="true" class="text-staff-error">*</span></legend>`;

// 은행은 기본 선택 상자 대신 바텀시트에서 한 줄 3개로 고른다(2026-11-23 사용자 지정). 목록은 공통코드 BANK 순서.
const BANKS = ["KDB산업은행", "IBK기업은행", "KB국민은행", "Sh수협은행", "NH농협은행", "지역농축협", "우리은행", "SC제일은행", "한국씨티은행", "iM뱅크", "부산은행", "광주은행", "제주은행", "전북은행", "경남은행", "새마을금고", "신협", "저축은행", "산림조합", "우체국", "하나은행", "신한은행", "케이뱅크", "카카오뱅크", "토스뱅크"];
const bankSheet = (a = {}) =>
  bottomSheet(
    "bank",
    { title: "은행 선택", ...a },
    `<ul class="grid grid-cols-3 gap-[8px]">${BANKS.map((b) => {
      const on = b === "KB국민은행";
      return `<li><button type="button" aria-pressed="${on}" data-close class="flex min-h-[48px] w-full items-center justify-center rounded-[12px] border px-[6px] text-center text-[14px] font-semibold break-keep ${on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text"}">${b}</button></li>`;
    }).join("")}</ul>`,
  );

const accountField = () =>
  `<fieldset class="flex flex-col gap-[8px]">${LEGEND("급여 계좌")}${basis(ACCOUNT_BASIS.join("<br>"))}<div class="relative"><button type="button" data-open="bank" aria-haspopup="dialog" aria-label="은행 KB국민은행" class="${FIELD} pr-[44px] text-left">KB국민은행</button><span aria-hidden="true" class="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-staff-text-sub">${maskIcon("chevron-down.svg", 16)}</span></div><input aria-label="계좌번호" inputmode="numeric" placeholder="계좌번호(숫자만)" value="12345601234567" class="${FIELD}"></fieldset>`;

// 개발 화면 new-tax-profile TaxProfileIntro 와 같다(2026-11-23 정돈): 흰 바탕 · 입력할 정보 두 줄 · 암호화 안내 · [입력하기]는 안내 바로 아래.
// 「따로 받는 이유」 링크 · 시트와 「입력해야 앱을 이용할 수 있습니다」는 뺐다(같은 말 반복 · 입력하지 않아도 앱을 막지 않는다).
const intro = () =>
  pageHeader("신고 정보", { backHref: page("contract", "signed") }) +
  `<div class="flex flex-1 flex-col justify-center gap-[24px] bg-white px-[24px] pt-[20px] pb-[32px] leading-[1.5] break-keep"><div class="flex flex-col items-center gap-[8px] text-center"><span class="mb-[6px] flex">${iconTile("id-card-line.svg", 44)}</span><h2 class="text-[20px] font-bold">신고 정보를 입력해 주세요</h2><p class="text-[14px] text-staff-text-sub">웨일카페 강남역점과 근로계약이 완료되었습니다.</p></div><section class="rounded-[16px] border border-staff-border-light px-[18px] py-[14px]"><p class="text-[13px] text-staff-text-sub">입력할 정보</p><ul class="flex flex-col divide-y divide-staff-border-light"><li class="py-[12px]"><span class="block text-[15px] font-semibold">주민등록번호</span><span class="block text-[13px] text-staff-text-sub">4대보험 신고(가입 대상인 경우) · 근로소득 원천징수</span></li><li class="pt-[12px] pb-[2px]"><span class="block text-[15px] font-semibold">급여 계좌</span><span class="block text-[13px] text-staff-text-sub">매달 급여 이체</span></li></ul></section><p class="flex gap-[8px] text-[13px] text-staff-text-sub"><span class="mt-[3px] flex shrink-0">${maskIcon("shield.svg", 14, true)}</span><span>입력한 정보는 <strong class="text-staff-text">암호화하여 안전하게 보관</strong>합니다.<br>관리자에게는 주민등록번호 일부만 표시되며, 급여 계좌는 급여 이체를 위해 전체 정보가 표시됩니다.</span></p>${button("입력하기", { "data-go": "form" })}</div>`;

// 내 근무지 › 신고정보 · 계좌에서 아직 넣지 않았을 때(개발 화면 tax-profile/page.tsx 빈 상태, 2026-11-23).
const GUIDE = [
  ["왜 필요한가요?", "근무지가 급여 세금(원천징수)을 신고하고, 급여를 이체하는 데 사용합니다."],
  ["언제 입력하나요?", "근로계약서에 서명한 직후 입력합니다."],
  ["입력하지 않으면?", "근무지가 급여 계좌를 알 수 없어 급여 이체가 늦어질 수 있습니다."],
];
const empty = () =>
  pageHeader("신고 정보", { backHref: page("me", "sites") }) +
  `<div class="flex flex-1 flex-col bg-white px-[24px] pt-[20px] pb-[24px] leading-[1.5] break-keep"><div class="flex flex-1 flex-col items-center justify-center gap-[8px] py-[40px] text-center"><span class="mb-[6px] flex">${iconTile("id-card-line.svg", 44)}</span><p class="text-[17px] font-bold">입력한 신고 정보가 없습니다</p><p class="text-[14px] text-staff-text-sub">웨일카페 강남역점</p><p class="pt-[8px] text-[14px] text-staff-text-sub">근로계약서에 서명했다면<br>지금 입력해 주세요.</p><dl class="mt-[17px] flex w-full flex-col gap-[12px] rounded-[16px] bg-staff-bg px-[18px] py-[16px] text-left text-[13px] leading-[1.6]">${GUIDE.map(([q, a]) => `<div><dt class="font-semibold text-staff-text"><span class="mr-[4px] text-staff-primary/50">Q.</span>${q}</dt><dd class="text-staff-text-sub">${a}</dd></div>`).join("")}</dl><div class="mt-[20px] w-full">${button("신고 정보 입력하기", { "data-go": "form" })}</div></div></div>`;

const VIEWS = {
  intro: () => intro(),

  // 개발 화면 TaxProfileCreateForm 과 같다(2026-11-23 정돈): 흰 바탕 · 이름 · 생년월일(회색, 고칠 수 없는 값)을 주민등록번호 위로 ·
  // 칸 이름 아래 근거 · 은행은 바텀시트.
  form: (mismatch = false, withSheet = true) =>
    backHeader("신고 정보", "intro") +
    `<div class="flex flex-1 flex-col bg-white">` +
    body(
      `<div class="flex flex-col gap-[6px]"><h2 class="text-[22px] font-bold">주민등록번호와 급여 계좌</h2><p class="text-[14px] text-staff-text-sub">본인 명의의 주민등록번호와 계좌만 입력할 수 있습니다.</p></div>` +
        `<div class="w-full rounded-[12px] border border-staff-border-light bg-staff-bg p-[14px]">${values([
          ["이름", "김민서"],
          ["생년월일", "1990.01.01"],
        ])}<p class="pt-[8px] text-[12px] text-staff-text-muted">가입할 때 입력한 정보입니다.</p></div>` +
        rrnField(mismatch) +
        accountField() +
        notice(
          "이 정보는 <strong>강남역점(사업주)</strong>이 수집하며, WHALE ERP는 위탁을 받아 암호화해 보관합니다.<br>법령과 근로계약에 따라 수집하는 정보로, <strong>별도 동의를 받지 않습니다.</strong>",
        ),
    ) +
    dock(mismatch ? button("등록하기", { disabled: true }) : button("등록하기", { "data-go": "done", "data-toast": "신고 정보를 등록했습니다" })) +
    `</div>` +
    (withSheet ? bankSheet() : ""),

  done: () =>
    body(
      `<div class="flex flex-col gap-[6px]"><h1 class="text-[22px] font-bold">신고 정보 등록이 완료되었습니다</h1><p class="text-[14px] text-staff-text-sub">이제 근무를 시작할 수 있습니다.</p></div>` +
        sunken(
          values([
            ["주민등록번호", "900101-1******"],
            ["급여 계좌", "국민 ******-01-234567"],
            ["이용 목적", "4대보험 신고 · 원천징수"],
            ["등록 일시", "2026.09.14 14:08"],
          ]),
        ) +
        `<p class="text-[12px] text-staff-text-muted">내 정보에서 언제든 확인하고 수정할 수 있습니다.</p>`,
      { center: true },
    ) + dock(button("근무 시작하기", { href: page("home") })),

  view: () =>
    pageHeader("신고 정보", { backHref: page("me", "sites") }) +
    body(
      // 신고 정보는 근무지(직원 레코드)마다 따로다(TAX-8, 2026-10-20). 어느 근무지에 낸 값인지 맨 위에 적는다.
      `<p class="flex items-center gap-[8px] text-[16px] font-bold">${maskIcon("store-line.svg", 17)}웨일카페 강남역점</p>` +
      card(
        `${label("주민등록번호")}<p class="pt-[4px] text-[18px] font-bold">900101-1******</p><p class="pt-[6px] text-[12px] text-staff-text-muted">보안을 위해 뒷자리는 다시 보여 드리지 않습니다.<br>수정하려면 다시 입력해 주세요.</p>`,
      ) +
        card(
          `${label("급여 계좌")}<p class="pt-[4px] text-[18px] font-bold">국민 ******-01-234567</p><p class="pt-[6px] text-[12px] text-staff-text-muted">계좌를 변경하면 다음 급여부터 새 계좌로 지급됩니다.</p>`,
        ) +
        sunken(
          label("등록 정보") +
            `<div class="pt-[8px]">${values([
              ["등록 일시", "2026.09.14 14:08"],
              ["이용 목적", "4대보험 신고 · 원천징수"],
            ])}</div>`,
        ) +
        sunken(label("수집 근거") + basis(`<b>주민등록번호</b> — ${RRN_BASIS.join(" ")}`) + basis(`<b>급여 계좌</b> — ${ACCOUNT_BASIS.join(" ")}`)) +
        notice("이 정보는 <strong>강남역점(사업주)</strong>이 수집하며, WHALE ERP는 위탁을 받아 암호화해 보관합니다.") +
        notice("관리자에게 주민등록번호는 일부를 가린 형태로만 보이고, 급여 계좌는 급여를 이체하도록 그대로 보입니다.", maskIcon("shield.svg", 14, true)),
    ) +
    dock(button("다시 입력하기", { variant: "ghost", "data-go": "form" })),

  mismatch: () => VIEWS.form(true),

  empty: () => empty(),
  bank: () => VIEWS.form(false, false) + bankSheet({ "data-sheet-auto": true, "data-on-close": "#form" }),
};

export default () => ({
  title: "신고 정보",
  states: STATES,
  html: `<main class="flex flex-1 flex-col leading-[1.5]">${STATES.map((s) => state(s.id, VIEWS[s.id]())).join("")}</main>`,
});
