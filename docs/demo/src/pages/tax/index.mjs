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
import { FIELD, backHeader, body, bottomSheet, button, card, dock, iconRow, label, maskIcon, notice, page, pageHeader, state, sunken, textField, values } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. why 는 목업의 안내 화면 시트라 안내 위에 띄운다.
const STATES = [
  { id: "intro", label: "안내", note: "날인 직후" },
  { id: "form", label: "입력", note: "동의 체크 없음" },
  { id: "done", label: "완료", note: "수집 일시·목적" },
  { id: "view", label: "등록된 값", note: "내 정보에서" },
  { id: "mismatch", label: "앞자리 불일치", note: "생년월일과 다름, 저장 막힘" },
  { id: "why", label: "주민등록번호를 따로 받는 이유", note: "안내 시트" },
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
  return `<fieldset class="flex flex-col gap-[8px]"><legend class="pb-[8px] text-[13px] font-semibold text-staff-text-sub">주민등록번호*</legend><div class="flex items-center gap-[8px]"><input aria-label="주민등록번호 앞 6자리" placeholder="앞 6자리" inputmode="numeric" maxlength="6" required value="${mismatch ? "950101" : "900101"}"${invalid} aria-describedby="${id}" class="${FIELD}"><span aria-hidden="true" class="text-staff-text-muted">–</span><input aria-label="주민등록번호 뒤 7자리" placeholder="뒤 7자리" type="password" inputmode="numeric" maxlength="7" autocomplete="off" required value="1234567" aria-describedby="${id}" class="${FIELD}"></div>${
    mismatch
      ? `<p id="${id}" role="alert" class="text-[12px] text-staff-error">주민등록번호 앞자리가 생년월일과 다릅니다.<br>생년월일이 잘못되었다면 근무지 관리자에게 수정을 요청해 주세요.</p>`
      : `<p id="${id}" class="text-[12px] text-staff-text-muted">본인 명의의 번호만 입력할 수 있습니다.</p>`
  }</fieldset>`;
};

const sheet = (a = {}) =>
  bottomSheet(
    "why",
    { title: "주민등록번호를 따로 받는 이유", ...a },
    `<p class="text-[14px] text-staff-text-sub">근로계약서에는 임금·근로시간·휴일·연차 같은 근로조건만 기재합니다.<br>본인 확인은 이름과 생년월일로 충분합니다.</p><p class="text-[14px] text-staff-text-sub">주민등록번호는 법령이 허용한 목적으로만 사용할 수 있습니다.<br>4대보험 신고와 원천징수 외에 쓰이지 않도록 계약서와 따로 수집합니다.</p>${notice(
      "관리자는 직원의 주민등록번호를 직접 입력하지 않습니다.",
    )}`,
  );

const intro = () =>
  pageHeader("신고 정보", { backHref: page("contract", "signed") }) +
  body(
    `<div class="flex flex-col items-center gap-[8px] text-center"><span class="text-staff-text-sub">${maskIcon("contract.svg", 28)}</span><h2 class="text-[22px] font-bold">신고 정보를 입력해 주세요</h2><p class="text-[14px] text-staff-text-sub">웨일카페 강남역점과 근로계약이 완료되었습니다.<br>4대보험 신고와 급여 지급에 필요한 정보입니다.</p></div>` +
      card(
        label("이용 목적") +
          `<div class="flex flex-col divide-y divide-staff-border-light pt-[10px]">${iconRow({ icon: "shield.svg", flipY: true, title: "4대보험 자격취득 신고", sub: "국민연금 · 건강보험 · 고용보험 · 산재보험" })}${iconRow({
            icon: "contract.svg",
            title: "근로소득 원천징수",
            sub: "급여에서 공제한 세금 신고",
          })}${iconRow({ icon: "nav-pay.svg", title: "급여 지급", sub: "매달 급여를 받을 계좌" })}</div>`,
      ) +
      notice("입력한 정보는 <strong>암호화해 보관</strong>합니다.<br>관리자에게는 일부를 가린 형태로만 보이고, 신고 서류를 만들 때만 사용합니다.", maskIcon("shield.svg", 14, true)) +
      button("주민등록번호를 따로 받는 이유", { variant: "ghost", "data-open": "why" }),
  ) +
  // 건너뛰는 길을 두지 않는다(TAX-4).
  dock(`${button(`${maskIcon("pencil.svg", 14)}입력하기`, { "data-go": "form" })}<p class="py-[2px] text-center text-[12px] text-staff-text-muted">신고 정보를 입력해야 앱을 이용할 수 있습니다</p>`);

const VIEWS = {
  intro: () => intro() + sheet(),

  form: (mismatch = false) =>
    backHeader("신고 정보", "intro") +
    body(
      `<div class="flex flex-col gap-[6px]"><h2 class="text-[22px] font-bold">주민등록번호와 급여 계좌</h2><p class="text-[14px] text-staff-text-sub">신고와 급여 이체에 그대로 사용되니 정확히 입력해 주세요.</p></div>` +
        // 동의 체크 없이 칸마다 받은 근거를 적는다(TAX-3 · 운영 정책 TAX-08).
        `<div class="flex flex-col gap-[8px]">${basis(RRN_BASIS.join("<br>"))}${rrnField(mismatch)}</div>` +
        `<div class="flex flex-col gap-[8px]">${basis(ACCOUNT_BASIS.join("<br>"))}${textField({
          label: "급여 계좌*",
          required: true,
          value: "국민은행 123456-01-234567",
          placeholder: "은행명과 계좌번호를 입력해 주세요",
          help: "본인 명의 계좌만 입력할 수 있습니다.",
        })}</div>` +
        sunken(
          values([
            ["이름", "김민서"],
            ["생년월일", "1990.01.01"],
          ]) + // 앞자리가 다르면 저장하지 않고 관리자 정정으로 보낸다(운영 정책 TAX-09) — 그때만 mismatch 상태로 알린다.
            `<p class="pt-[8px] text-[12px] text-staff-text-muted">가입할 때 입력한 정보입니다.<br>주민등록번호 앞자리가 생년월일과 다르면 등록할 수 없습니다.</p>`,
        ) +
        notice(
          "이 정보는 <strong>강남역점(사업주)</strong>이 수집하며, WHALE ERP는 위탁을 받아 암호화해 보관합니다.<br>법령과 근로계약에 따라 수집하는 정보로, <strong>별도 동의를 받지 않습니다.</strong>",
        ),
    ) +
    dock(mismatch ? button("등록하기", { disabled: true }) : button("등록하기", { "data-go": "done", "data-toast": "신고 정보를 등록했습니다" })),

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
    pageHeader("등록된 신고 정보", { backHref: page("me", "sites") }) +
    body(
      // 신고 정보는 근무지(직원 레코드)마다 따로다(TAX-8, 2026-10-20). 어느 근무지에 낸 값인지 맨 위에 적는다.
      `<p class="flex items-center gap-[8px] text-[16px] font-bold">${maskIcon("store-small.svg", 17)}웨일카페 강남역점</p>` +
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
        notice("관리자에게도 <strong>일부를 가린 형태로만</strong> 보입니다.", maskIcon("shield.svg", 14, true)),
    ) +
    dock(button("다시 입력하기", { variant: "ghost", "data-go": "form" })),

  mismatch: () => VIEWS.form(true),

  why: () => intro() + sheet({ "data-sheet-auto": true, "data-on-close": "#intro" }),
};

export default () => ({
  title: "신고 정보",
  states: STATES,
  html: `<main class="flex flex-1 flex-col leading-[1.5]">${STATES.map((s) => state(s.id, VIEWS[s.id]())).join("")}</main>`,
});
