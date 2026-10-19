// 직원 근무 앱 데모 · 로그인. 기준 목업: docs/mockup/app/login.html (상태 17개 + 로그아웃 확인 시트, 쟁점 LOGIN-1~11 모두 확정).
// 목업의 data-when 뷰·dock 버튼(data-go)·화면 문구·가짜 값을 그대로 옮겼다. 남은 시간 같은 숫자는 목업의 고정 값이다.
// 기본 로그인(login)은 Figma 01.Login(node 3:1965)을 따른다. 그 밖 상태는 Figma 없음 — DESIGN.md 기준 초안.
// 목업의 토스트(data-toast)는 옮기지 않았다.
import { alert, bottomSheet, brandLogo, button, card, dangerButton, dock, img, notice, page, state, textField } from "../../ui.mjs";

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
  { id: "expired", label: "세션 만료", note: "30일 지남" },
  { id: "splash", label: "앱 시작", note: "자동 로그인" },
  // 목업에서는 상태가 아니라 시트(data-sheet="logout")다. 데모 도구에서 열 수 있게 상태로 두고, 뒤에는 로그인 화면을 깐다.
  { id: "logout", label: "로그아웃", note: "내 정보 맨 아래에 둔다" },
];

const go = (id) => ({ "data-go": id });
const back = (id) => ({ "data-go": id, "data-dir": "nav-back" });
const ghost = (label, a = {}) => button(label, { variant: "ghost", ...a });
const arrow = () => img("arrow-right.svg", 14, 12);

// 상태 화면 한 장: 제목(28px) · 설명(14px) · 내용, 아래 버튼 줄. 버튼 줄은 Figma 01.Login 의 Btns(흰 바탕, 위 14 · 아래 24 · 좌우 30)를 따른다.
const screen = ({ top, title, desc, children = "", dock: d }) =>
  `<div class="flex flex-col gap-[16px] px-[30px] pt-[52px] pb-[24px] leading-[1.5]">${top ? `<div class="pt-[10px] pb-[60px]">${top}</div>` : ""}<div class="flex flex-col gap-[6px] pb-[8px]"><h1 class="text-[28px] font-bold">${title}</h1>${
    desc ? `<p class="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">${desc}</p>` : ""
  }</div>${children}</div>${dock(d, 30)}`;

// 핀 입력 · 새 비밀번호가 함께 쓰는 남은 시간(LOGIN-11 한 시계).
const remaining = (time) => `<span>남은 시간 <b class="text-staff-text tabular-nums">${time}</b></span>`;

const RULES = [
  { ok: true, text: "영문 대소문자·숫자·기호 중 <b>세 가지</b>를 섞었습니다" },
  { ok: true, text: "8자 이상 20자 이하" },
  { ok: false, text: "이메일 아이디와 겹치지 않기" },
];

// 새 비밀번호 두 칸 + 조건 목록(newpw · temp 공통). 맞은 조건은 초록 체크(#16a34a, 배지 「정상」 글자색), 아직이면 빈 원.
const newPasswordFields = () =>
  `<div class="flex flex-col gap-[16px]">${textField({ label: "새 비밀번호", type: "password", autocomplete: "new-password", value: "Haeun2026!" })}${textField({
    label: "새 비밀번호 확인",
    type: "password",
    autocomplete: "new-password",
    value: "Haeun2026!",
  })}</div>${card(
    `<p class="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p><ul class="flex flex-col pt-[2px]">${RULES.map(
      (r) =>
        `<li class="flex items-center gap-[8px] py-[6px] text-[13px] ${r.ok ? "font-medium" : "text-staff-text-muted"}">${
          r.ok
            ? `<span class="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#16a34a]">${img("check.svg", 10, 10)}</span>`
            : `<span class="size-[16px] shrink-0 rounded-full border border-staff-border"></span>`
        }<span>${r.text}<span class="sr-only">${r.ok ? " · 맞음" : " · 아직"}</span></span></li>`,
    ).join("")}</ul><p class="pt-[6px] text-[12px] text-staff-text-muted">두 가지만 섞으면 10자 이상이어야 합니다.</p>`,
  )}`;

const loginView = (fail) =>
  screen({
    top: brandLogo(),
    title: "다시 오셨네요",
    desc: "근무 정보와 출퇴근을 확인하려면 로그인하세요.",
    // 기본 로그인은 /design/login(Figma 01.Login)과 같게 둔다 — 버튼 둘, 비밀번호 칸 비움(2026-10-12 재영).
    // 이메일 찾기(LOGIN-8)는 이 화면에 버튼이 없어 상태 전환 도구로만 들어간다.
    // 「초대 코드로 가입」은 진입·가입 데모의 초대 코드 입력으로 간다(JOIN-7, 2026-10-19).
    dock: button(`미리보기 로그인${arrow()}`, go("splash")) + ghost("비밀번호를 잊으셨나요", go("forgot")) + ghost("초대 코드로 가입", { href: page("join") }),
    children: `<div class="flex flex-col gap-[16px]">${textField({
      label: "이메일",
      type: "email",
      autocomplete: "username",
      value: "haeun.lee@gmail.com",
      help: fail ? undefined : "가입할 때 정한 아이디입니다",
    })}${textField({
      label: "비밀번호",
      type: "password",
      autocomplete: "current-password",
      ...(fail ? { value: "haeun2026" } : { placeholder: "비밀번호를 입력해 주세요" }),
      error: fail ? "이메일이나 비밀번호가 맞지 않습니다" : undefined,
    })}</div>${
      fail
        ? notice("연속 <strong>5</strong>회 틀리면 5분 동안 잠깁니다. 남은 횟수 <strong>3</strong>회.")
        : notice("한 번 로그인하면 <strong>30일</strong> 동안 다시 묻지 않습니다.", img("shield.svg", 12, 12.5, "-scale-y-100"))
    }`,
  });

const VIEWS = {
  login: () => loginView(false),
  fail: () => loginView(true),

  // LOGIN-5: 연속 5회 · 5분 고정, 잠금 안내와 비밀번호 재설정 버튼.
  locked: () =>
    screen({
      title: "잠시 잠겼습니다",
      desc: "비밀번호를 연속 다섯 번 틀려 계정이 잠겼습니다. <strong>5분 뒤에 다시 시도하거나 비밀번호를 재설정하세요.</strong>",
      dock: button("비밀번호 재설정", go("forgot")) + ghost("5분 뒤 다시 시도", back("login")),
      children:
        alert("warning", `<p class="text-[14px] font-semibold">남은 시간</p><p class="text-[28px] font-bold tabular-nums">04:12</p>`) +
        notice(
          "기다리기 어려우면 <strong>비밀번호를 다시 정해</strong> 로그인 화면에서 새 비밀번호로 들어올 수 있습니다. 새로 정하면 잠금도 함께 풀립니다. 잠긴 동안에는 비밀번호가 맞아도 들어갈 수 없습니다.",
        ),
    }),

  // LOGIN-8: 이름·휴대전화번호·생년월일로 찾는다.
  find: () =>
    screen({
      title: "로그인 이메일을 찾습니다",
      desc: "가입할 때 <strong>본인인증으로 확인된 세 가지</strong>를 넣으면 그 이메일을 찾아 드립니다.",
      dock: button("이메일 찾기", go("found")) + ghost("맞지 않는 경우 보기", go("find-fail")),
      children: `<div class="flex flex-col gap-[16px]">${textField({ label: "이름", type: "text", autocomplete: "name", value: "김민서" })}${textField({
        label: "휴대전화번호",
        type: "tel",
        autocomplete: "tel",
        value: "010-2841-5521",
      })}${textField({ label: "생년월일", type: "text", value: "1999-04-12", help: "가입 때 본인인증으로 확정된 값과 같아야 합니다." })}</div>${notice(
        "세 값이 모두 맞아야 알려 드립니다. 하나라도 다르면 어느 값이 틀렸는지는 알려 주지 않습니다.",
      )}`,
    }),

  // LOGIN-9: @ 앞 처음 2글자 + 마지막 1글자만 보이고(3글자 이하면 첫 글자만) 도메인은 그대로. 늘 목록 모양이고,
  // 맞는 계정이 여럿이면 탈퇴 계정을 빼고 모두 보인다(2026-10-08).
  found: () =>
    screen({
      title: "가입된 이메일입니다",
      dock: button("로그인하러 가기", back("login")) + ghost("비밀번호도 다시 정하기", go("forgot")),
      children:
        card(
          `<p class="text-[13px] font-semibold text-staff-text-sub">로그인 이메일 2개</p><ul class="pt-[4px]">${["ha******e@gmail.com", "ha*****1@naver.com"]
            .map((email) => `<li class="border-b border-staff-border-light py-[10px] text-[16px] font-semibold tabular-nums last:border-b-0">${email}</li>`)
            .join(
              "",
            )}</ul><p class="pt-[6px] text-[12px] text-staff-text-muted">@ 앞은 처음 두 글자와 마지막 한 글자만 보이고 나머지는 글자 수만큼 가립니다. 도메인으로 어느 메일함인지 알아볼 수 있습니다.</p>`,
        ) +
        notice(
          "<strong>다음에 할 일</strong><br>이 이메일로 로그인하세요. 비밀번호가 기억나지 않으면 이 주소로 인증번호를 받아 다시 정할 수 있습니다.",
        ),
    }),

  // LOGIN-10: 어느 값이 틀렸는지 알리지 않고 5회까지.
  "find-fail": () =>
    screen({
      title: "맞는 계정을 찾지 못했습니다",
      desc: "세 값이 가입 때 확인된 값과 다릅니다. 남은 시도는 2번입니다.",
      dock: button("다시 넣기", back("find")) + ghost("다섯 번 넘긴 경우 보기", go("find-lock")),
      children: card(
        `<p class="text-[13px] font-semibold text-staff-text-sub">이럴 때가 많습니다</p><ul class="flex flex-col pt-[2px] text-[13px] font-medium"><li class="border-b border-staff-border-light py-[8px]">휴대전화번호가 가입 뒤에 바뀐 경우</li><li class="py-[8px]">이름의 띄어쓰기나 생년월일 형식이 다른 경우</li></ul><p class="pt-[6px] text-[12px] text-staff-text-muted">다섯 번 틀리면 5분 동안 막습니다. 그때는 근무지 점포에 직접 방문해 물어 주세요.</p>`,
      ),
    }),

  // LOGIN-10: 5회 넘기면 5분 막고 점포 방문 안내.
  "find-lock": () =>
    screen({
      title: "잠시 막았습니다",
      desc: "다섯 번 틀렸습니다. 아래 시간이 지나면 다시 시도할 수 있습니다.",
      dock: button("다시 넣기 · 02:47 뒤", { disabled: true }) + ghost("로그인으로 돌아가기", back("login")),
      children:
        card(
          `<div class="flex flex-col items-center text-center"><p class="text-[13px] font-semibold text-staff-text-sub">다시 시도까지</p><p class="pt-[4px] text-[32px] font-bold tabular-nums">02:47</p><p class="pt-[6px] text-[12px] text-staff-text-muted">막는 시간은 5분입니다. 로그인 잠금과 같은 규칙입니다.</p></div>`,
        ) +
        notice(
          "<strong>근무지 점포에 직접 방문해 물어 주세요.</strong> 본인이 맞는지 얼굴을 보고 확인한 뒤에만 알려 드립니다. 전화나 메시지로는 알려 드릴 수 없습니다. 이메일은 알지만 그 메일함을 쓸 수 없을 때도 같습니다.",
        ),
    }),

  // LOGIN-2·3: 이메일 핀, 보낸 때부터 10분 한 시계.
  forgot: () =>
    screen({
      title: "비밀번호를 다시 정합니다",
      desc: "가입할 때 정한 이메일로 <strong>인증번호</strong>를 보냅니다. 관리자를 거치지 않아도 됩니다.",
      dock: button("인증번호 받기", go("pin")) + ghost("로그인으로 돌아가기", back("login")),
      children:
        textField({ label: "이메일", type: "email", autocomplete: "username", value: "haeun.lee@gmail.com", help: "가입할 때 정한 아이디를 넣어 주세요" }) +
        notice("인증번호는 보낸 때부터 <strong>10분</strong> 동안 쓸 수 있습니다. 새 비밀번호도 이 10분 안에 정해 주세요.") +
        card(
          `<p class="text-[13px] font-semibold text-staff-text-sub">이메일을 쓸 수 없다면</p><p class="pt-[6px] text-[13px] text-staff-text-sub">관리자에게 알리면 관리자가 초기화를 요청합니다. 그때는 재설정 링크가 이메일로 갑니다. <strong class="font-bold text-staff-text">그 메일함 자체를 쓸 수 없으면 근무지 점포에 직접 방문해 물어 주세요</strong> — 관리자가 이메일을 대신 고치지는 못합니다.</p>`,
        ) +
        // LOGIN · WHALEERP-174(2026-10-13 재영): 계정 유무를 드러내지 않게 누구에게나 같은 안내를 둔다.
        card(
          `<p class="text-[13px] font-semibold text-staff-text-sub">아직 가입을 마치지 않았다면</p><p class="pt-[6px] text-[13px] text-staff-text-sub">받은 초대 링크로 가입을 먼저 마쳐 주세요. 링크가 만료됐으면 근무지에 다시 초대해 달라고 요청해 주세요.</p>`,
        ),
    }),

  // LOGIN-3: 10분 · 5회, 발급 1분 간격 · 하루 10회.
  pin: () =>
    screen({
      title: "인증번호를 넣어 주세요",
      desc: `<span class="tabular-nums">ha******e@gmail.com</span> 으로 여섯 자리를 보냈습니다.`,
      dock: button("확인", go("newpw")) + ghost("다시 받기 · 47초 뒤", { disabled: true }),
      children: `<div class="flex flex-col gap-[8px]">${textField({
        label: "인증번호",
        type: "text",
        autocomplete: "one-time-code",
        maxlength: 6,
        value: "4B7K2M",
      })}<div class="flex items-center justify-between text-[12px] text-staff-text-muted">${remaining("09:41")}<span>다섯 번 틀리면 새로 받아야 합니다</span></div></div>${notice(
        "메일이 오지 않으면 스팸함을 확인해 주세요. 1분 뒤 다시 받을 수 있고, 하루 10번까지 받을 수 있습니다. 다시 받으면 <strong>앞서 보낸 인증번호는 바로 무효</strong>가 됩니다.",
      )}`,
    }),

  // LOGIN-3: 5회 틀리면 핀 닫힘, 쿨다운 없음.
  "pin-closed": () =>
    screen({
      title: "이 인증번호는 더 쓸 수 없습니다",
      desc: "다섯 번 틀렸습니다. 새 인증번호를 받아 주세요.",
      dock: button("새 인증번호 받기", back("pin")) + ghost("로그인으로 돌아가기", back("login")),
      children: alert("warning", "기다릴 필요 없이 <strong>바로 다시 받을 수 있습니다.</strong> 새로 받으면 시간도 10분부터 다시 셉니다."),
    }),

  "pin-out": () =>
    screen({
      title: "인증번호가 만료되었습니다",
      desc: "보낸 지 10분이 지났습니다. 다시 받아 주세요.",
      dock: button("인증번호 다시 받기", back("pin")) + ghost("로그인으로 돌아가기", back("login")),
      children: alert("warning", "다섯 번을 다 틀리지 않았어도 <strong>10분이 지나면 만료</strong>됩니다."),
    }),

  // LOGIN-11: 핀 입력과 같은 시계(09:41 → 07:12)를 이어서 보인다.
  newpw: () =>
    screen({
      title: "새 비밀번호를 정해 주세요",
      desc: "현재 비밀번호는 묻지 않습니다. 인증번호로 본인을 확인했습니다. 이 인증번호는 여기서 비밀번호를 정하면 무효가 됩니다.",
      dock: `<p class="pb-[6px] text-center text-[12px] text-staff-text-muted">인증번호를 받은 때부터 10분 안에 마쳐 주세요</p>${button("비밀번호 정하기", back("login"))}`,
      children: `<div class="text-[12px] text-staff-text-muted">${remaining("07:12")}</div>${newPasswordFields()}${notice(
        "새로 정하면 <strong>다른 기기의 로그인이 모두 끊기고</strong> 잠금도 함께 풀립니다.",
      )}`,
    }),

  // LOGIN-11: 저장할 때 핀을 다시 확인, 시간이 지났거나 닫혔으면 다시 받기.
  "newpw-out": () =>
    screen({
      title: "시간이 지났습니다",
      desc: "인증번호를 받은 지 10분이 지나 비밀번호를 바꾸지 않았습니다. 인증번호를 다시 받아 주세요.",
      dock: button("인증번호 다시 받기", back("forgot")) + ghost("로그인으로 돌아가기", back("login")),
      children: alert(
        "warning",
        "저장할 때 인증번호를 한 번 더 확인합니다. 시간이 지났거나 인증번호가 닫혔으면 여기로 옵니다. 앞서 받은 인증번호는 <strong>다시 쓸 수 없습니다.</strong>",
      ),
    }),

  // LOGIN-6: 관리자 재설정 링크 24시간 · 한 번만.
  temp: () =>
    screen({
      title: "새 비밀번호를 정해 주세요",
      desc: "관리자가 보낸 재설정 링크로 들어왔습니다. 지금 쓰던 비밀번호는 묻지 않습니다.",
      // WHALEERP-176(2026-10-13·14 재영): 링크로 정해도 핀과 같이 로그인 화면으로 보내 새 비밀번호로 로그인하게 한다.
      dock: button("비밀번호 정하기", back("login")),
      children:
        alert(
          "warning",
          "이 링크는 보낸 때로부터 <strong>24시간</strong> 동안, <strong>한 번만</strong> 쓸 수 있습니다. 이 링크나 인증번호로 비밀번호를 정하고 나면 바로 무효가 됩니다. 관리자는 새 비밀번호를 정하지 못합니다.",
        ) +
        newPasswordFields() +
        notice("새로 정하면 <strong>다른 기기의 로그인이 모두 끊기고</strong> 잠금도 함께 풀립니다. 로그인 화면에서 새 비밀번호로 로그인해 주세요."),
    }),

  // LOGIN-6: 이미 썼든 기한이 지났든 닫혔든 사유를 구분하지 않고 같은 문구로 막는다(운영 정책 ACC-19 v91).
  // 첫 문장은 앱이 링크 토큰을 30분만 들고 있다가 그 시간이 지난 경우를 위한 것 — 메일의 링크는 아직 쓸 수 있다(2026-10-14 노영주, WHALEERP-173).
  "link-used": () =>
    screen({
      title: "이 링크는 쓸 수 없습니다",
      desc: "메일에서 받은 링크를 다시 눌러 보세요. 그래도 안 되면 관리자에게 재설정 링크를 다시 청하거나, 비밀번호 찾기에서 인증번호를 받아 직접 정해 주세요. 기억나는 비밀번호가 있으면 그대로 로그인하셔도 됩니다.",
      dock: button("인증번호로 직접 정하기", go("forgot")) + ghost("로그인으로 돌아가기", back("login")),
    }),

  // LOGIN-4: 30일 유지, 만료되면 하던 자리로 돌아간다.
  expired: () =>
    screen({
      title: "로그인이 만료되었습니다",
      desc: "마지막 접속으로부터 30일이 지나 다시 로그인해야 합니다.",
      dock: button(`로그인${arrow()}`, go("splash")),
      children:
        alert("warning", `<p class="text-[14px] font-semibold">출근을 찍으려던 중이었습니다</p><p class="text-[12px]">로그인하면 하던 자리로 돌아갑니다</p>`) +
        textField({ label: "비밀번호", type: "password", autocomplete: "current-password", value: "haeun2026" }),
    }),

  splash: () =>
    `<div class="flex flex-1 flex-col"><div class="flex flex-1 flex-col items-center justify-center gap-[14px]">${brandLogo()}<p class="text-[13px] font-semibold text-staff-text-sub">직원 근무 앱</p></div><p class="pb-[14px] text-center text-[12px] text-staff-text-muted">저장된 로그인을 확인하는 중입니다</p>${dock(
      button("홈으로 들어가기", { variant: "ghost", href: page("home") }),
      30,
    )}</div>`,

  // 뒤에 로그인 화면을 깔고 시트를 띄운다. 「그대로 두기」는 들어온 곳인 내 정보로 돌아간다.
  // 목업 btn--seal(빨강). 되돌리기 어려운 동작이라 남보라 대신 오류색을 쓴다.
  logout: () =>
    loginView(false) +
    bottomSheet(
      "logout",
      {
        title: "로그아웃할까요",
        description: "다시 들어오려면 이메일과 비밀번호가 필요합니다. 출퇴근을 찍어야 할 때 번거로울 수 있습니다.",
        closeLabel: "그대로 두기",
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
