// 직원 근무 앱 데모 · 내 정보. src/app/demo/me/page.tsx 를 옮겼다. 기준 목업: docs/mockup/app/me.html — 상태 6개(내 정보 ·
// 비밀번호 변경 · 이메일 변경 · 새 이메일 인증 · 주소 검색 · 소속 근무지)와 시트 9개(변경 이력 · 약관 보기 · 잠시 멈춤 ·
// 일시 중지 동안의 카드 · 철회한 뒤의 카드 · 본사 제공 동의 내용 · 본사 제공 동의 철회 · 위치정보 동의 철회 · 로그아웃), 화면 문구·가짜 값·이동(data-go)·알림(data-toast)을 옮겼다.
// 생년월일은 가입한 뒤 고치지 않고(운영 정책 ACC-13), 휴대전화번호는 계정의 신원 기준이라 1차에 바꾸지 않으며(2026-10-19),
// 소속 근무지·고용 형태는 근로계약으로만 바뀌어 읽기 전용이다. 직원이 고치는 건 이메일·주소·비밀번호다. 번호 변경 상태 셋은 없앴다.
// 위치정보 동의 카드: 동의 상태·일시·버전, 약관 보기 · 잠시 멈춤 · 동의 철회(운영 정책 ATT-23·26). 일시 중지 중이면 같은 카드가 「다시 켜기」로 바뀐다.
// 본사 제공 동의 카드: 가맹 점포 직원의 선택 동의, 내용 보기 · 동의 철회(운영 정책 ATT-30). 동의 문구는 법무 검토 중(ATT-8).
// 두 카드 모두 철회하면 같은 자리에서 「동의하지 않음 · 철회 일시」와 「다시 동의하기」로 바뀐다(ME-5, 2026-10-08). 목업의 「철회한 뒤의 카드」 시트는
// 두 카드를 철회한 모양으로 바꾼 상태(revoked)로 그린다.
// 확정 쟁점: ME-1 재설정 핀 10분(로그인 화면) · ME-2 주소는 주소 검색으로 도로명을 고르고 상세주소만 적는다 · ME-3 이메일은 새 이메일 인증 뒤에 바뀐다 ·
// ME-4 비밀번호 규칙(세 가지 8자 · 두 가지 10자 · 최대 20자 · 이메일 아이디와 겹치지 않기) · ME-5 철회 뒤 카드. 로그아웃은 맨 아래(S-PHHICH 확정).
// 목업과 다른 점: 목업의 「일시 중지 동안의 카드」 시트는 카드 자체를 일시 중지 모양으로 바꾼 상태(paused)로 그린다.
// 이메일 변경·새 이메일 인증·주소 검색은 목업에 머리줄이 없어 같은 뒤로 가기 머리줄을 붙였다. 출퇴근 등록 화면으로 가는 버튼 둘은 데모용으로 더했다.
// 탈퇴 화면은 목업에도 아직 없고 이번 데모 범위 밖이다.
// Figma 없음 — DESIGN.md 기준 초안.
//
// HTML 판에서 다른 점: 화면 안에서 철회하거나 다시 동의하면 두 모양(동의함·철회 등)을 미리 그려 두고 data-pick·data-show 로 바꾼다.
// 그래서 숨긴 카드가 DOM 에 함께 있고, 그 버튼은 <div data-pick> 하나로 감싸여 있다. 주소 검색에서 고른 도로명은 내 정보로 옮겨지지 않는다(토스트만).
import { alert, backHeader, badge, body, bottomNav, bottomSheet, button, card, dangerButton, dock, FIELD, img, label, maskIcon, notice, page, state, sunken, textField, uid, values } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. 뒤의 둘은 목업의 「시트 열기」라 내 정보 화면을 뒤에 깐다.
const STATES = [
  { id: "view", label: "내 정보", note: "기본 화면" },
  { id: "password", label: "비밀번호 변경", note: "본인이 직접" },
  { id: "email", label: "이메일 변경", note: "아이디가 바뀐다" },
  { id: "email-pin", label: "새 이메일 인증", note: "10분 · 5회" },
  { id: "addr", label: "주소 검색", note: "도로명 고르기" },
  { id: "sites", label: "소속 근무지", note: "조회만" },
  { id: "history", label: "변경 이력", note: "항목·일시·전후" },
  { id: "revoked", label: "동의 철회 뒤", note: "다시 동의하기" },
  { id: "paused", label: "위치 수집 일시 중지", note: "다시 켜기" },
];

const TITLE = {
  password: "비밀번호 변경",
  email: "이메일 변경",
  "email-pin": "새 이메일 인증",
  addr: "주소 검색",
  sites: "소속 근무지",
};
// 머리줄 뒤로 가기가 돌아가는 곳. 새 이메일 인증만 이메일 입력으로, 나머지는 내 정보로.
const BACK = { "email-pin": "email" };

const ADDRESSES = ["서울 마포구 양화로 12", "서울 마포구 양화로 12-1"];

const go = (id, toast) => ({ "data-go": id, "data-toast": toast });
const back = (id, toast) => ({ "data-go": id, "data-dir": "nav-back", "data-toast": toast });
const ghost = (text, a = {}) => button(text, { variant: "ghost", ...a });
const outline = (text, a = {}) => button(text, { variant: "outline", ...a });

// 미리 그린 두 모양 중 하나. 카드 맨 바깥 div 에 id 를 달고 지금 아닌 쪽은 숨긴다.
const panel = (html, id, shown) => html.replace("<div ", `<div id="${id}"${shown ? "" : " hidden"} `);
// 누르면 show 를 보이고 hide 를 숨기는 버튼(staff.js 고르기 묶음: 숨은 짝 칸의 data-show 가 hide 를 숨긴다).
const swapButton = (text, show, hide, a = {}) => `<div data-pick>${button(text, { "data-show": show, ...a })}<span hidden data-show="${hide}"></span></div>`;

// 읽기 전용 칸(목업 input--ro): 입력칸과 같은 52px · radius 12 지만 안내 바탕·옅은 테두리·보조 글자로 고칠 수 없음을 보인다.
// action 이 있으면 오른쪽에 44px 외곽선 버튼(96px 폭)을 둔다.
const readOnlyField = ({ label: name, value, help, action }) => {
  const id = uid("ro");
  return `<div class="flex flex-col gap-[8px]"><label for="${id}" class="text-[13px] font-semibold text-staff-text-sub">${name}</label><div class="flex items-center gap-[8px]"><input id="${id}" readonly value="${value}"${
    help ? ` aria-describedby="${id}-help"` : ""
  } class="h-[52px] w-full min-w-0 rounded-[12px] border border-staff-border-light bg-staff-info-bg px-[14px] text-[16px] text-staff-text-sub outline-none!">${
    action ? `<div class="w-[96px] shrink-0">${action}</div>` : ""
  }</div>${help ? `<p id="${id}-help" class="text-[12px] text-staff-text-muted">${help}</p>` : ""}</div>`;
};

// 카드 안 작은 버튼(목업 btn--sm): 44px 외곽선 버튼. 줄에 여럿이면 칸을 나눠 갖는다.
const smallButton = (text, a = {}) => `<div class="min-w-0 flex-1">${outline(text, a)}</div>`;

const cardHead = (title, right) => `<div class="flex items-center justify-between gap-[12px]">${label(title)}${right}</div>`;

// 카드 안 안내 한 줄(Caption 12px). muted 는 한 단계 더 흐린 끝줄.
const tinyLine = (text, muted = false) => `<p class="pt-[8px] text-[12px] ${muted ? "text-staff-placeholder" : "text-staff-text-muted"}">${text}</p>`;

// 비밀번호·신고 정보 줄: 아이콘 · 제목 14px semibold · 설명 12px · 오른쪽 버튼(96px).
const iconLine = ({ icon, title, sub, flipY = false }, right) =>
  `<div class="flex items-center gap-[12px] py-[12px] first:pt-0 last:pb-0"><span class="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">${maskIcon(
    icon,
    18,
    flipY,
  )}</span><div class="min-w-0 flex-1"><p class="text-[14px] font-semibold">${title}</p><p class="truncate text-[12px] text-staff-text-muted">${sub}</p></div><div class="w-[96px] shrink-0">${right}</div></div>`;

// 하위 화면 첫 줄: 제목 Title 1 + 설명 14px.
const lead = (title, text) => `<div class="flex flex-col gap-[6px]"><h2 class="text-[22px] font-bold">${title}</h2><p class="text-[14px] text-staff-text-sub">${text}</p></div>`;

// 비밀번호 조건 한 줄. 맞으면 성공색 체크, 아직이면 빈 동그라미와 흐린 글자.
const rule = (ok, text) =>
  `<li class="flex items-center gap-[8px] py-[6px] text-[13px] [&_b]:font-bold ${ok ? "font-medium text-staff-text" : "text-staff-text-muted"}">${
    ok
      ? `<span class="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white">${maskIcon("check.svg", 10)}</span>`
      : `<span aria-hidden="true" class="size-[16px] shrink-0 rounded-full border-[1.5px] border-staff-placeholder"></span>`
  }<span class="sr-only">${ok ? "충족" : "미충족"}</span><span>${text}</span></li>`;

// 내 정보 화면(view·history·revoked·paused 공통). 위치정보·본사 제공 카드는 바꿀 모양을 함께 그린다.
// ids: 같은 상태 블록 안 시트의 철회 버튼이 이 id 로 카드를 바꾼다.
const meView = (mode, ids) => {
  const paused = mode === "paused";
  const revoked = mode === "revoked";
  const toastReagreeLoc = "위치정보 수집에 다시 동의했습니다";
  // 일시 중지 중에 철회했다가 다시 동의하면 수집하는 상태(동의함)로 돌아온다 — 그 경우 내 정보(view)로 옮긴다.
  const locReagree = paused ? button("다시 동의하기", go("view", toastReagreeLoc)) : swapButton("다시 동의하기", ids.locOn, ids.locOff, { "data-toast": toastReagreeLoc });

  const locRevokedCard = card(
    `${cardHead("위치정보 동의", badge("plain", "동의하지 않음"))}${tinyLine("2026년 10월 2일 18:40 철회 · 위치정보 수집·이용 동의 v1.2")}<div class="flex flex-col gap-[8px] pt-[10px]">${locReagree}<div class="flex gap-[8px]">${smallButton(
      "약관 보기",
      { "data-open": "terms" },
    )}</div></div>${tinyLine("동의하지 않은 동안 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다음 출퇴근 등록 때 동의해도 됩니다.", true)}`,
  );
  const locPausedCard = card(
    `${cardHead("위치정보 동의", badge("warning", "일시 중지"))}${tinyLine("2026년 9월 29일 14:20 부터 일시 중지 · 동의는 2026년 3월 15일 09:04 그대로")}<div class="flex flex-col gap-[8px] pt-[10px]">${button(
      "다시 켜기",
      go("view"),
    )}<div class="flex gap-[8px]">${smallButton("약관 보기", { "data-open": "terms" })}${smallButton("동의 철회", { "data-open": "revoke" })}</div></div>${tinyLine(
      "일시 중지 동안 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다시 켜면 새로 동의하지 않아도 됩니다.",
      true,
    )}<!-- 데모용: 일시 중지 동안의 출퇴근 등록 화면 --><div class="pt-[10px]">${outline("출퇴근 등록 화면 보기", { href: page("check-in", "paused") })}</div>`,
  );
  const locAgreedCard = card(
    `${cardHead("위치정보 동의", badge("success", "동의함"))}${tinyLine("2026년 3월 15일 09:04 동의 · 위치정보 수집·이용 동의 v1.2")}<div class="flex gap-[8px] pt-[10px]">${smallButton("약관 보기", {
      "data-open": "terms",
    })}${smallButton("잠시 멈춤", { "data-open": "pause" })}${smallButton("동의 철회", { "data-open": "revoke" })}</div>${tinyLine(
      "동의하지 않으면 앱으로 출퇴근을 등록할 수 없고, 다음 출퇴근 등록 때 다시 동의할 수 있습니다.",
      true,
    )}`,
  );
  const bpRevokedCard = card(
    `${cardHead("본사 제공 동의", badge("plain", "동의하지 않음"))}${tinyLine("2026년 10월 2일 18:42 철회 · 가맹본부 웨일카페 · 본사 제공 동의 v1.0")}<div class="flex flex-col gap-[8px] pt-[10px]">${swapButton(
      "다시 동의하기",
      ids.bpOn,
      ids.bpOff,
      { "data-toast": "본사 제공에 다시 동의했습니다" },
    )}<div class="flex gap-[8px]">${smallButton("내용 보기", { "data-open": "bpshare" })}</div></div>${tinyLine("지금은 본사에 점포별 숫자로만 보입니다. 다시 동의하면 개인 단위로 보입니다.", true)}`,
  );
  const bpAgreedCard = card(
    `${cardHead("본사 제공 동의", badge("success", "동의함"))}${tinyLine("2026년 3월 15일 09:04 동의 · 가맹본부 웨일카페 · 본사 제공 동의 v1.0")}<div class="flex gap-[8px] pt-[10px]">${smallButton("내용 보기", {
      "data-open": "bpshare",
    })}${smallButton("동의 철회", { "data-open": "bprevoke" })}</div>${tinyLine("철회해도 가입과 근무는 그대로입니다. 본사에는 점포별 숫자로만 보입니다.", true)}`,
  );

  return `<header class="flex min-h-[72px] w-full items-center bg-white px-[22px] py-[14px]"><h1 class="min-w-0 flex-1 text-[18px] font-bold">내 정보</h1><button type="button" data-open="history" class="-mr-[10px] flex min-h-[44px] items-center rounded-[10px] px-[10px] text-[13px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive">변경 이력</button></header><main class="flex flex-col gap-[14px] px-[16px] pt-[16px] pb-[24px]">${card(
    `${label("기본 정보")}<div class="flex flex-col gap-[10px] pt-[8px]">${readOnlyField({ label: "이름", value: "이하은" })}${readOnlyField({ label: "생년월일", value: "1998-04-12" })}${readOnlyField({
      label: "입사일",
      value: "2025-11-03",
    })}</div>${tinyLine("생년월일은 가입한 뒤 고칠 수 없습니다.")}`,
  )}<div class="flex flex-col gap-[6px]"><button type="button" data-go="sites" class="flex w-full items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-staff-info-bg p-[16px] text-left transition-colors duration-150 ease-out active:bg-staff-primary-inactive"><span class="min-w-0 flex-1">${label(
    "소속 근무지",
  )}<span class="block pt-[4px] text-[15px] font-bold">웨일카페 강남역점 외 1곳</span></span>${badge("plain", "파트타이머")}${img(
    "chevron-right-muted.svg",
    12,
    12,
    "-scale-y-100",
  )}</button><p class="px-[4px] text-[12px] text-staff-text-muted">소속 근무지와 고용 형태는 근로계약으로만 바뀝니다.</p></div><!-- 위치정보 동의(운영 정책 ATT-23·26). 일시 중지 중이면 같은 자리에서 「다시 켜기」로 돌아온다 — 다시 켤 때 동의 절차가 없다. -->${panel(
    locRevokedCard,
    ids.locOff,
    revoked,
  )}${panel(paused ? locPausedCard : locAgreedCard, ids.locOn, !revoked)}<!-- 본사 제공 동의(운영 정책 ATT-30). 가맹 점포 직원에게만 묻는 선택 동의라 철회해도 가입과 근무는 그대로다. -->${panel(
    bpRevokedCard,
    ids.bpOff,
    revoked,
  )}${panel(bpAgreedCard, ids.bpOn, !revoked)}${card(
    `${label("연락처")}<div class="flex flex-col gap-[10px] pt-[8px]">${readOnlyField({
      label: "휴대전화번호",
      value: "010-4821-7736",
      help: "가입 때 넣은 번호로, 앱에서 바꿀 수 없습니다.",
    })}${readOnlyField({
      label: "이메일 · 로그인 아이디",
      value: "haeun.lee@gmail.com",
      help: "로그인할 때 쓰는 아이디라 새 이메일로 인증번호를 받아 확인한 뒤에 바뀝니다.",
      action: smallButton("변경", go("email")),
    })}<!-- 주소는 검색으로 도로명을 고르고 상세주소만 적는다(ME-2). 이미 쓴 계약서에는 반영하지 않는다는 안내를 빼지 않는다. --><div class="flex flex-col gap-[6px]">${readOnlyField({
      label: "주소",
      value: ADDRESSES[0],
      action: smallButton("검색", go("addr")),
    })}<input aria-label="상세주소" placeholder="상세주소" value="3층 302호" class="${FIELD}"><p class="pt-[2px] text-[12px] text-staff-text-muted">도로명 주소는 검색해서 고르고 상세주소만 직접 적습니다. 주소를 바꾸면 지금 계약서에는 반영되지 않고 다음에 새로 쓰는 계약부터 적용됩니다.</p></div></div><div class="pt-[12px]">${button(
      "변경사항 저장",
      { "data-toast": "변경사항을 저장했습니다" },
    )}</div>`,
  )}${card(
    `<div class="flex flex-col divide-y divide-staff-border-light">${iconLine({ icon: "shield.svg", flipY: true, title: "비밀번호", sub: "마지막 변경 2026년 6월 2일" }, outline("변경", go("password")))}${iconLine(
      { icon: "contract.svg", title: "신고 정보", sub: "900101-1****** · 국민 ******-01-234567" },
      outline("보기", { href: page("tax", "view") }),
    )}</div>`,
  )}<!-- 로그아웃은 내 정보 맨 아래(S-PHHICH 확정). 자주 누를 것이 아니고 실수로 눌리면 곤란해서 가장 아래다. --><hr class="my-[4px] border-staff-border-light">${ghost("로그아웃", {
    "data-open": "logout",
  })}</main><div class="sticky bottom-0 mt-auto">${bottomNav("me")}</div>`;
};

// 내 정보 위에 뜨는 시트들. history 상태에서는 변경 이력 시트가 바로 열리고 닫으면 내 정보로 돌아간다.
const sheets = (mode, ids) =>
  bottomSheet(
    "history",
    {
      title: "변경 이력",
      description: "연락처·주소·비밀번호를 바꾼 기록입니다. 비밀번호는 바뀐 사실만 남고 값은 남지 않습니다.",
      ...(mode === "history" ? { "data-sheet-auto": true, "data-on-close": "#view" } : {}),
    },
    `<ul class="flex flex-col divide-y divide-staff-border-light">${[
      ["이메일 변경", "haeun98@gmail.com → haeun.lee@gmail.com", "2026-07-02"],
      ["휴대전화번호 변경", "010-2231-9944 → 010-4821-7736", "2026-05-14"],
      ["비밀번호 변경", "본인이 직접 변경", "2026-06-02"],
      ["주소 변경", "서울 마포구 동교로 5 → 서울 마포구 양화로 12", "2026-04-18"],
    ]
      .map(
        ([title, sub, date]) =>
          `<li class="flex items-start gap-[12px] py-[12px]"><span class="min-w-0 flex-1"><span class="block text-[14px] font-semibold">${title}</span><span class="block text-[12px] text-staff-text-sub">${sub}</span></span><span class="shrink-0 text-[12px] text-staff-text-muted tabular-nums">${date}</span></li>`,
      )
      .join("")}</ul>${outline("더 보기", { "data-toast": "20건을 더 불러왔습니다" })}`,
  ) +
  bottomSheet(
    "terms",
    { title: "위치정보 수집·이용 동의" },
    `<p class="-mt-[12px] text-[12px] text-staff-text-muted">v1.2 · 2026년 3월 1일부터</p>${sunken(
      `<p class="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">출퇴근을 등록할 때 근무지 반경 안인지를 확인하는 데만 씁니다. <b>위치는 휴대전화 안에서만 확인하고 서버로 보내지 않으며</b> 기록에는 출퇴근 시각만 남습니다. 동의는 내 정보에서 언제든 철회할 수 있고, 철회하면 앱으로 등록할 수 없습니다.</p>`,
    )}<p class="text-[12px] text-staff-text-muted">약관 버전이 바뀌면 다음 출퇴근 등록 때 새 버전으로 다시 동의를 받습니다.</p>`,
  ) +
  // 일시 중지(운영 정책 ATT-26). 버튼 이름은 「잠시 멈춤」「다시 켜기」. 동의는 남고 수집만 멎어 다시 켤 때 동의 절차가 없다.
  bottomSheet(
    "pause",
    { title: "위치 수집을 잠시 멈출까요", closeLabel: "그대로 두기" },
    `<p class="text-[14px] font-bold text-staff-text">잠시 멈춘 동안에는 앱으로 출퇴근을 등록할 수 없습니다. 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다시 켜면 새로 동의하지 않아도 됩니다.</p>${sunken(
      `<p class="text-[14px] text-staff-text-sub">동의는 그대로 남고 수집만 멎습니다. 철회와 달리 다시 켤 때 동의 절차가 없습니다.</p>`,
    )}${button("잠시 멈춤", { ...go("paused", "위치 수집을 멈췄습니다"), "data-close": true })}`,
  ) +
  bottomSheet(
    "revoke",
    { title: "위치정보 동의를 철회할까요", closeLabel: "그대로 두기" },
    `<p class="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">철회하면 <strong>앱으로 출퇴근을 등록할 수 없습니다. 출퇴근 기록은 근무지 관리자에게 문의해 주세요.</strong></p>${sunken(
      `<p class="text-[14px] text-staff-text-sub">다시 등록하려면 다음 출퇴근 등록 때 새로 동의하면 됩니다. 이미 남은 기록은 그대로 보존됩니다.</p>`,
    )}${swapButton("철회합니다", ids.locOff, ids.locOn, { "data-toast": "위치정보 동의를 철회했습니다", "data-close": true })}<!-- 데모용: 철회 뒤의 출퇴근 등록 화면(「위치정보 동의 없음」, 운영 정책 ATT-20) -->${outline(
      "출퇴근 등록 화면 보기",
      { href: page("check-in", "no-consent") },
    )}`,
  ) +
  bottomSheet(
    "bpshare",
    { title: "본사 제공 동의" },
    `${sunken(
      values([
        ["받는 자", "가맹본부 · 웨일카페"],
        ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
        ["목적", "가맹점 운영 지원과 점검"],
        ["보유 기간", "철회 또는 가맹 관계 종료까지"],
      ]),
    )}<p class="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text">선택 동의입니다. 철회해도 가입과 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. <b>항목이나 목적이 넓어지면</b> 새 버전으로 다시 동의를 받습니다.</p><p class="text-[12px] text-staff-placeholder">동의 문구는 법무 검토 중(ATT-8)</p>`,
  ) +
  bottomSheet(
    "bprevoke",
    { title: "본사 제공 동의를 철회할까요", closeLabel: "그대로 두기" },
    `<p class="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">철회하면 가맹본부가 <strong>내 근무 정보를 개인 단위로 보지 않습니다.</strong> 점포별 숫자로만 보입니다.</p>${sunken(
      `<p class="text-[14px] text-staff-text-sub">가입과 근무, 급여명세서 수령은 그대로입니다. 다시 동의하려면 이 화면에서 켜면 됩니다.</p>`,
    )}${swapButton("철회합니다", ids.bpOff, ids.bpOn, { "data-toast": "본사 제공 동의를 철회했습니다", "data-close": true })}`,
  ) +
  bottomSheet(
    "logout",
    {
      title: "로그아웃할까요",
      description: "다시 들어오려면 이메일과 비밀번호가 필요합니다. 출퇴근을 찍어야 할 때 번거로울 수 있습니다.",
      closeLabel: "그대로 두기",
    },
    // 목업 btn--seal(빨강). 여기서는 로그인 화면으로 가는 링크다.
    dangerButton("로그아웃", { href: page("login"), "data-dir": "nav-back" }),
  );

const VIEWS = {
  password: () =>
    body(
      `${textField({ label: "현재 비밀번호", type: "password", autocomplete: "current-password", value: "********" })}${textField({
        label: "새 비밀번호",
        type: "password",
        autocomplete: "new-password",
        value: "••••••••••",
      })}${textField({
        label: "새 비밀번호 확인",
        type: "password",
        autocomplete: "new-password",
        value: "••••••••••",
      })}<!-- 비밀번호 규칙(ME-4). 가입·재설정·관리자 초기화 뒤의 변경에도 같이 적용한다. -->${sunken(
        `${label("비밀번호 조건")}<ul class="flex flex-col pt-[2px]">${rule(true, "영문 대소문자·숫자·기호 중 <b>세 가지</b>를 섞었습니다")}${rule(true, "8자 이상 20자 이하")}${rule(
          false,
          "이메일 아이디와 겹치지 않기",
        )}</ul><p class="pt-[7px] text-[12px] text-staff-text-muted">두 가지만 섞으면 10자 이상이어야 합니다.</p>`,
      )}`,
    ) + dock(button("변경하기", back("view", "비밀번호를 변경했습니다")) + ghost("취소", back("view"))),

  // 이메일이 로그인 아이디라 새 이메일로 인증번호를 받아 확인한 뒤에만 바뀐다(ME-3).
  email: () =>
    body(
      `${lead("이메일을 바꾸면 아이디가 바뀝니다", "새 이메일로 인증번호를 보냅니다. 확인이 끝나면 다음 로그인부터 새 이메일을 씁니다.")}${sunken(
        `<div class="flex items-center gap-[12px]">${label("지금 아이디")}<span class="min-w-0 flex-1 truncate text-right text-[13px]">haeun.lee@gmail.com</span></div>`,
      )}${textField({ label: "새 이메일", type: "email", autocomplete: "email", placeholder: "새로 쓸 이메일" })}${alert(
        "warning",
        "비밀번호를 잊었을 때 인증번호가 이 주소로 갑니다. <strong>받을 수 있는 주소</strong>인지 확인해 주세요.",
      )}`,
    ) + dock(button("인증번호 받기", go("email-pin", "새 이메일로 인증번호를 보냈습니다")) + ghost("그대로 두기", back("view"))),

  "email-pin": () =>
    body(
      `${lead("새 이메일로 보낸 번호를 넣어 주세요", "ha******w@gmail.com 으로 보냈습니다.")}${textField({
        label: "인증번호",
        autocomplete: "one-time-code",
        value: "9T4X1P",
      })}<div class="flex items-center justify-between text-[12px] text-staff-text-sub"><span>남은 시간 <b class="font-bold text-staff-text tabular-nums">09:12</b></span><span>남은 시도 <b class="font-bold text-staff-text tabular-nums">5</b>회</span></div>${notice(
        "확인이 끝날 때까지 아이디는 그대로 이전 이메일입니다.",
      )}`,
    ) + dock(button("확인", back("view", "아이디를 새 이메일로 바꿨습니다")) + ghost("이메일 다시 입력", back("email"))),

  // 주소 검색(ME-2). 고른 도로명은 그대로 저장되고 상세주소만 내 정보에서 적는다. 어느 API 를 붙일지는 개발에서 정한다.
  addr: () =>
    body(
      `<div class="flex flex-col gap-[8px]"><label for="me-addr-q" class="text-[13px] font-semibold text-staff-text-sub">도로명 주소 검색</label><div class="flex items-center gap-[8px]"><input id="me-addr-q" value="양화로 12" aria-describedby="me-addr-help" class="${FIELD}"><div class="w-[88px] shrink-0">${button(
        "검색",
        { "data-toast": "주소를 찾았습니다" },
      )}</div></div><p id="me-addr-help" class="text-[12px] text-staff-text-muted">도로명이나 건물 이름으로 찾습니다.</p></div><ul class="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">${ADDRESSES.map(
        (a) =>
          `<li><button type="button" data-go="view" data-dir="nav-back" data-toast="주소를 골랐습니다. 상세주소를 적어 주세요" class="flex w-full items-center gap-[12px] py-[13px] text-left"><span class="min-w-0 flex-1"><span class="block text-[15px] font-semibold">${a}</span><span class="block text-[12px] text-staff-text-sub">서교동 · 우편번호 04044</span></span>${img(
            "chevron-right-muted.svg",
            12,
            12,
            "-scale-y-100",
          )}</button></li>`,
      ).join("")}</ul>${notice("고른 주소는 <strong>그대로 저장</strong>되고 상세주소만 직접 적습니다. 오타나 형식이 어긋나는 일을 막기 위해서입니다.")}`,
    ),

  sites: () =>
    body(
      `<ul class="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">${[
        ["웨일카페 강남역점", "파트타이머 · 2025년 11월 3일부터"],
        ["웨일카페 홍대점", "파트타이머 · 2026년 3월 16일부터"],
      ]
        .map(
          ([name, sub]) =>
            `<li class="flex items-start gap-[12px] py-[14px]"><span class="flex pt-[3px] text-staff-text-sub">${maskIcon("store-small.svg", 18)}</span><span class="min-w-0 flex-1"><span class="block text-[15px] font-semibold">${name}</span><span class="block text-[12px] text-staff-text-sub">${sub}</span></span>${badge(
              "working",
              "근무 중",
            )}</li>`,
        )
        .join("")}</ul><p class="text-[12px] text-staff-text-muted">소속과 고용 형태는 근로계약이 새로 체결되어야 바뀝니다. 여기서는 고칠 수 없습니다.</p>`,
    ),
};

const ME_MODES = ["view", "history", "revoked", "paused"];

const block = (id) => {
  if (ME_MODES.includes(id)) {
    const ids = { locOn: uid("loc"), locOff: uid("loc"), bpOn: uid("bp"), bpOff: uid("bp") };
    return `<div class="flex flex-1 flex-col leading-[1.5]">${meView(id, ids)}</div>${sheets(id, ids)}`;
  }
  return `<div class="flex flex-1 flex-col leading-[1.5]">${backHeader(TITLE[id], BACK[id] ?? "view")}${VIEWS[id]()}</div>`;
};

export default () => ({
  title: "내 정보",
  states: STATES,
  html: STATES.map((s) => state(s.id, block(s.id))).join(""),
});
