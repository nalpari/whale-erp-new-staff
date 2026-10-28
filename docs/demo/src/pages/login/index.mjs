// 직원 근무 앱 데모 · 로그인. 기준 목업: docs/mockup/app/login.html (상태 17개 + 로그아웃 확인 시트, 쟁점 LOGIN-1~11 모두 확정).
// 목업의 data-when 뷰·dock 버튼(data-go)·화면 문구·가짜 값을 그대로 옮겼다. 남은 시간 같은 숫자는 목업의 고정 값이다.
// 기본 로그인(login)은 Figma 01.Login(node 3:1965)을 따른다. 그 밖 상태는 Figma 없음 — DESIGN.md 기준 초안.
// 목업의 토스트(data-toast)는 옮기지 않았다.
import { alert, bottomSheet, brandLogo, button, card, checkBox, dangerButton, dock, img, notice, page, state, textField } from "../../ui.mjs";

const STATES = [
  { id: "login", label: "로그인", note: "평상시" },
  { id: "fail", label: "로그인 실패", note: "남은 횟수" },
  { id: "locked", label: "계정 잠김", note: "5회 실패" },
  { id: "find", label: "이메일 찾기", note: "이름·번호·생년월일" },
  { id: "found", label: "이메일 찾음", note: "목록 · 가려서 표시" },
  { id: "find-fail", label: "이메일 못 찾음", note: "남은 시도 2번" },
  { id: "find-lock", label: "이메일 찾기 막힘", note: "5분 · 점포 문의" },
  { id: "forgot", label: "비밀번호 찾기", note: "이메일 입력" },
  { id: "pin", label: "인증번호 입력", note: "10분 · 5회" },
  { id: "pin-closed", label: "인증번호 닫힘", note: "5회 틀림" },
  { id: "pin-out", label: "인증번호 만료", note: "10분 지남" },
  { id: "newpw", label: "새 비밀번호 설정", note: "본인 재설정" },
  { id: "newpw-out", label: "새 비밀번호 저장 실패", note: "10분 지남·핀 닫힘" },
  { id: "temp", label: "관리자 초기화 링크", note: "24시간" },
  { id: "link-used", label: "쓸 수 없는 링크", note: "사유 구분 없음" },
  // 목업에서는 상태가 아니라 시트(data-sheet="logout")다. 데모 도구에서 열 수 있게 상태로 두고, 뒤에는 로그인 화면을 깐다.
  { id: "logout", label: "로그아웃", note: "내 정보 맨 아래에 둔다" },
];

const go = (id) => ({ "data-go": id });
const back = (id) => ({ "data-go": id, "data-dir": "nav-back" });
const ghost = (label, a = {}) => button(label, { variant: "ghost", ...a });
const arrow = () => img("arrow-right.svg", 14, 12);

// 상태 화면 한 장: 제목(28px) · 설명(14px) · 내용, 아래 버튼 줄. 버튼 줄은 Figma 01.Login 의 Btns(흰 바탕, 위 14 · 아래 24 · 좌우 30)를 따른다.
const screen = ({ top, title, desc, children = "", dock: d }) =>
  `<div class="flex flex-col gap-[16px] px-[30px] pt-[52px] pb-[24px] leading-[1.5]">${top ? `<div class="pt-[10px] pb-[60px]">${top}</div>` : ""}${
    title
      ? `<div class="flex flex-col gap-[6px] pb-[8px]"><h1 class="text-[28px] font-bold">${title}</h1>${
          desc ? `<p class="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">${desc}</p>` : ""
        }</div>`
      : ""
  }${children}</div>${dock(d, 30)}`;

// 핀 입력 · 새 비밀번호가 함께 쓰는 남은 시간(LOGIN-11 한 시계).
const remaining = (time) => `<span>남은 시간 <b class="text-staff-text tabular-nums">${time}</b></span>`;

const RULES = [
  { ok: true, text: "영문 대소문자·숫자·특수문자 중 <b>3가지</b> 이상" },
  { ok: true, text: "8자 이상 20자 이하" },
  { ok: false, text: "이메일 아이디와 중복 불가" },
];

// 새 비밀번호 두 칸 + 조건 목록(newpw · temp 공통). 맞은 조건은 초록 체크(#16a34a, 배지 「정상」 글자색), 아직이면 빈 원.
const newPasswordFields = () =>
  `<div class="flex flex-col gap-[16px]">${textField({
    label: "새 비밀번호",
    type: "password",
    autocomplete: "new-password",
    placeholder: "새 비밀번호를 입력해 주세요",
  })}${textField({
    label: "새 비밀번호 확인",
    type: "password",
    autocomplete: "new-password",
    placeholder: "새 비밀번호를 한 번 더 입력해 주세요",
  })}</div>${card(
    `<p class="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p><ul class="flex flex-col pt-[2px]">${RULES.map(
      (r) =>
        `<li class="flex items-center gap-[8px] py-[6px] text-[13px] ${r.ok ? "font-medium" : "text-staff-text-muted"}">${
          r.ok
            ? `<span class="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#16a34a]">${img("check.svg", 10, 10)}</span>`
            : `<span class="size-[16px] shrink-0 rounded-full border border-staff-border"></span>`
        }<span>${r.text}<span class="sr-only">${r.ok ? " · 맞음" : " · 아직"}</span></span></li>`,
    ).join("")}</ul><p class="pt-[6px] text-[12px] text-staff-text-muted">2가지만 사용하면 10자 이상 입력해 주세요.</p>`,
  )}`;

const loginView = (fail) =>
  screen({
    top: brandLogo(),
    // 기본 로그인은 /design/login(Figma 01.Login)과 같게 둔다 — 버튼 둘, 이메일·비밀번호 칸 비움(2026-10-12 재영).
    // 이메일 찾기(LOGIN-8)는 이 화면에 버튼이 없고 비밀번호 찾기 화면의 이메일 칸 아래에서 들어간다(2026-10-20 재영).
    // 「초대 코드로 가입」은 진입·가입 데모의 초대 코드 입력으로 간다(JOIN-7, 2026-10-19).
    dock: button(`로그인${arrow()}`, { href: page("home") }) + ghost("비밀번호를 잊으셨나요", go("forgot")) + ghost("초대 코드로 가입", { href: page("join") }),
    children: `<div class="flex flex-col gap-[16px]">${textField({
      label: "이메일",
      type: "email",
      autocomplete: "username",
      placeholder: "가입한 이메일을 입력해 주세요",
      ...(fail ? { value: "haeun.lee@gmail.com" } : {}),
    })}${textField({
      label: "비밀번호",
      type: "password",
      autocomplete: "current-password",
      placeholder: "비밀번호를 입력해 주세요",
      ...(fail ? { value: "haeun2026" } : {}),
      error: fail ? "이메일 또는 비밀번호를 다시 확인해 주세요" : undefined,
    })}</div><div class="flex items-center gap-[20px]">${[
      ["아이디 저장하기", true],
      // 자동로그인을 켜고 로그인하면 30일, 끄고 로그인하면 7일 유지. 처음은 꺼짐(LOGIN-4, 운영 정책 ACC-05 v170, 2026-10-20 재영).
      ["자동로그인", false],
    ]
      .map(([label, checked]) => `<div class="flex items-center gap-[8px]">${checkBox({ label, checked })}<span class="text-[14px]">${label}</span></div>`)
      .join("")}</div>${fail ? notice("로그인 시도가 <strong>3회</strong> 남았습니다.<br>5회 틀리면 5분 동안 로그인할 수 없습니다.") : ""}`,
  });

const VIEWS = {
  login: () => loginView(false),
  fail: () => loginView(true),

  // LOGIN-5: 연속 5회 · 5분 고정, 잠금 안내와 비밀번호 재설정 버튼.
  locked: () =>
    screen({
      title: "로그인이 잠시 잠겼습니다",
      desc: "비밀번호를 5회 틀려 5분 동안 로그인할 수 없습니다.<br><strong>비밀번호를 재설정하면 바로 로그인할 수 있습니다.</strong>",
      dock: button("비밀번호 재설정", go("forgot")) + ghost("5분 뒤 다시 시도", back("login")),
      children: alert("warning", `<p class="text-[14px] font-semibold">남은 시간</p><p class="text-[28px] font-bold tabular-nums">04:12</p>`),
    }),

  // LOGIN-8: 이름·휴대전화번호·생년월일로 찾는다.
  find: () =>
    screen({
      title: "이메일 찾기",
      desc: "가입할 때 입력한 <strong>이름·휴대전화번호·생년월일</strong>을 입력해 주세요.",
      dock: button("이메일 찾기", go("found")) + ghost("맞지 않는 경우 보기", go("find-fail")),
      children: `<div class="flex flex-col gap-[16px]">${textField({ label: "이름", type: "text", autocomplete: "name", placeholder: "이름을 입력해 주세요", value: "김민서" })}${textField({
        label: "휴대전화번호",
        type: "tel",
        autocomplete: "tel",
        placeholder: "숫자만 입력해 주세요",
        value: "010-2841-5521",
      })}${textField({ label: "생년월일", type: "text", placeholder: "YYYYMMDD", value: "1999-04-12" })}</div>`,
    }),

  // LOGIN-9: @ 앞 처음 2글자 + 마지막 1글자만 보이고(3글자 이하면 첫 글자만) 도메인은 그대로. 늘 목록 모양이고,
  // 맞는 계정이 여럿이면 탈퇴 계정을 빼고 모두 보인다(2026-10-08).
  found: () =>
    screen({
      title: "가입된 이메일입니다",
      dock: button("로그인하러 가기", back("login")) + ghost("비밀번호 재설정", go("forgot")),
      children: card(
        `<p class="text-[13px] font-semibold text-staff-text-sub">로그인 이메일 2개</p><ul class="pt-[4px]">${["ha******e@gmail.com", "ha*****1@naver.com"]
          .map((email) => `<li class="border-b border-staff-border-light py-[10px] text-[16px] font-semibold tabular-nums last:border-b-0">${email}</li>`)
          .join("")}</ul>`,
      ),
    }),

  // LOGIN-10: 어느 값이 틀렸는지 알리지 않고 5회까지.
  "find-fail": () =>
    screen({
      title: "일치하는 계정이 없습니다",
      desc: "입력한 정보를 다시 확인해 주세요.<br>남은 시도는 <strong>2회</strong>이며, 모두 틀리면 5분 동안 이용할 수 없습니다.<br>계속 찾을 수 없다면 근무지 관리자에게 문의해 주세요.",
      dock: button("다시 입력하기", back("find")) + ghost("다섯 번 넘긴 경우 보기", go("find-lock")),
      children: card(
        `<p class="text-[13px] font-semibold text-staff-text-sub">이런 경우가 많아요</p><ul class="flex flex-col pt-[2px] text-[13px] font-medium"><li class="border-b border-staff-border-light py-[8px]">가입 후 휴대전화번호가 바뀐 경우</li><li class="py-[8px]">이름 띄어쓰기나 생년월일 형식이 다른 경우</li></ul>`,
      ),
    }),

  // LOGIN-10: 5회 넘기면 5분 막고 점포 방문 안내.
  "find-lock": () =>
    screen({
      title: "이메일 찾기가 잠시 잠겼습니다",
      desc: "5분 뒤 다시 시도하거나,<br><strong>근무지 관리자에게 문의해 주세요.</strong>",
      dock: button("다시 입력하기 · 02:47 뒤", { disabled: true }) + ghost("로그인으로 돌아가기", back("login")),
      children: card(
        `<div class="flex flex-col items-center text-center"><p class="text-[13px] font-semibold text-staff-text-sub">남은 시간</p><p class="pt-[4px] text-[32px] font-bold tabular-nums">02:47</p></div>`,
      ),
    }),

  // LOGIN-2·3: 이메일 핀, 보낸 때부터 10분 한 시계.
  forgot: () =>
    screen({
      title: "비밀번호 재설정",
      desc: "가입한 이메일로 <strong>인증번호</strong>를 보내 드립니다.",
      dock: button("인증번호 받기", go("pin")) + ghost("로그인으로 돌아가기", back("login")),
      children:
        textField({
          label: "이메일",
          type: "email",
          autocomplete: "username",
          placeholder: "가입한 이메일을 입력해 주세요",
          help: "이메일을 사용할 수 없다면 근무지 관리자에게 문의해 주세요.",
        }) +
        `<button type="button" data-go="find" class="-mt-[8px] flex min-h-[44px] items-center self-start text-[14px] font-semibold text-staff-text-sub underline underline-offset-2">이메일이 기억나지 않나요?</button>`,
    }),

  // LOGIN-3: 10분 · 5회, 발급 1분 간격 · 하루 10회.
  pin: () =>
    screen({
      title: "인증번호 입력",
      desc: `<span class="tabular-nums">ha******e@gmail.com</span> 으로 보낸<br>인증번호 6자리를 입력해 주세요.`,
      dock: button("확인", go("newpw")) + ghost("인증번호 다시 받기 · 47초 뒤", { disabled: true }),
      children: `<div class="flex flex-col gap-[8px]">${textField({
        label: "인증번호",
        type: "text",
        autocomplete: "one-time-code",
        maxlength: 6,
        placeholder: "인증번호 6자리",
      })}<div class="flex items-center justify-between text-[12px] text-staff-text-muted">${remaining("09:41")}<span>5회 틀리면 다시 받아야 합니다</span></div></div>${notice(
        "메일이 오지 않았다면 스팸함을 확인해 주세요.<br>다시 받으면 <strong>이전 인증번호는 사용할 수 없습니다.</strong>",
      )}`,
    }),

  // LOGIN-3: 5회 틀리면 핀 닫힘, 쿨다운 없음.
  "pin-closed": () =>
    screen({
      title: "인증번호를 사용할 수 없습니다",
      desc: "인증번호를 5회 잘못 입력했습니다.<br><strong>새 인증번호를 받아 다시 시도해 주세요.</strong>",
      dock: button("인증번호 다시 받기", back("pin")) + ghost("로그인으로 돌아가기", back("login")),
    }),

  "pin-out": () =>
    screen({
      title: "인증번호가 만료되었습니다",
      desc: "인증번호 유효 시간 10분이 지났습니다.<br><strong>새 인증번호를 받아 다시 시도해 주세요.</strong>",
      dock: button("인증번호 다시 받기", back("pin")) + ghost("로그인으로 돌아가기", back("login")),
    }),

  // LOGIN-11: 핀 입력과 같은 시계(09:41 → 07:12)를 이어서 보인다.
  newpw: () =>
    screen({
      title: "새 비밀번호 설정",
      desc: "새로 사용할 비밀번호를 입력해 주세요.",
      dock: button("비밀번호 변경", back("login")),
      children: `<div class="text-[12px] text-staff-text-muted">${remaining("07:12")}</div>${newPasswordFields()}${notice(
        "변경하면 <strong>다른 기기에서는 모두 로그아웃</strong>됩니다.<br>계정 잠금도 함께 해제됩니다.",
      )}`,
    }),

  // LOGIN-11: 저장할 때 핀을 다시 확인, 시간이 지났거나 닫혔으면 다시 받기.
  "newpw-out": () =>
    screen({
      title: "비밀번호를 변경하지 못했습니다",
      desc: "인증번호 유효 시간 10분이 지났습니다.<br><strong>새 인증번호를 받아 다시 시도해 주세요.</strong>",
      dock: button("인증번호 다시 받기", back("forgot")) + ghost("로그인으로 돌아가기", back("login")),
    }),

  // LOGIN-6: 관리자 재설정 링크 24시간 · 한 번만.
  temp: () =>
    screen({
      title: "새 비밀번호 설정",
      desc: "새로 사용할 비밀번호를 입력해 주세요.",
      // WHALEERP-176(2026-10-13·14 재영): 링크로 정해도 핀과 같이 로그인 화면으로 보내 새 비밀번호로 로그인하게 한다.
      dock: button("비밀번호 변경", back("login")),
      children:
        alert("warning", "이 링크는 <strong>24시간</strong> 동안 <strong>한 번만</strong> 사용할 수 있습니다.") +
        newPasswordFields() +
        notice("변경하면 <strong>다른 기기에서는 모두 로그아웃</strong>됩니다.<br>계정 잠금도 함께 해제됩니다."),
    }),

  // LOGIN-6: 이미 썼든 기한이 지났든 닫혔든 사유를 구분하지 않고 같은 문구로 막는다(운영 정책 ACC-19 v91).
  // 앱이 링크 토큰을 30분만 들고 있다가 그 시간이 지난 경우도 여기로 온다 — 메일의 링크는 아직 쓸 수 있다(2026-10-14 노영주, WHALEERP-173).
  "link-used": () =>
    screen({
      title: "사용할 수 없는 링크입니다",
      desc: "링크가 만료되었거나 이미 사용되었습니다.<br><strong>관리자에게 링크를 다시 요청하거나,<br>비밀번호를 직접 재설정해 주세요.</strong>",
      dock: button("비밀번호 재설정", go("forgot")) + ghost("로그인으로 돌아가기", back("login")),
    }),

  // 뒤에 로그인 화면을 깔고 시트를 띄운다. 「취소」는 들어온 곳인 내 정보로 돌아간다.
  // 목업 btn--seal(빨강). 되돌리기 어려운 동작이라 남보라 대신 오류색을 쓴다.
  logout: () =>
    loginView(false) +
    bottomSheet(
      "logout",
      {
        title: "로그아웃하시겠습니까?",
        description: "다시 로그인하려면 이메일과 비밀번호가 필요합니다.",
        closeLabel: "취소",
        "data-sheet-auto": true,
        "data-on-close": page("me"),
      },
      dangerButton("로그아웃", { ...back("login"), "data-close": true }),
    ),
};

export default () => ({
  title: "로그인",
  states: STATES,
  html: `<main class="flex flex-1 flex-col">${STATES.map((s) => state(s.id, `<div class="flex flex-1 flex-col">${VIEWS[s.id]()}</div>`)).join("")}</main>`,
});
