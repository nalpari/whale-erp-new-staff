// 진입·가입 데모. 기준 목업: docs/mockup/app/join.html — 상태 13개(초대 코드 입력 · 코드 틀림 · 입력 잠금 · 초대 확인 · 계정 있음 ·
// 계정 등록 · 계정 등록(링크) · 가입 완료 · 만 19세 미만 · 소속 추가 확인 · 소속 추가 완료 · 초대 만료 · 로그인)와 시트 2개(본사 제공 동의 · 소속 추가 거절),
// 화면 문구·가짜 값·하단 버튼의 이동(data-go)을 그대로 옮겼다. 화면 순서는 docs/plans/2026-10-19-진입-가입-화면-가이드.md.
// 본인인증과 연결 보류는 없다 — 가입하면 계정이 초대의 직원 레코드에 바로 이어진다(운영 정책 JOI-04, 2026-10-19).
// 계정 등록의 휴대전화번호는 읽기 전용이다 — 코드로 오면 코드 확인으로 확정된 번호, 링크로 오면 그 초대의 번호(JOIN-7, 2026-10-19 재영).
// 초대 코드 입력(JOIN-7)은 두 칸을 다 채워야, 계정 등록의 약관 동의(JOIN-6)는 필수 둘을 모두 체크해야 버튼이 켜진다.
// Figma 없음 — DESIGN.md 기준 초안.
import { FIELD, alert, badge, body, bottomSheet, button, card, checkBox, dock, iconRow, img, maskIcon, notice, page, pageHeader, segmentedControl, state, sunken, textField, uid, values } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. bpshare·reject 는 목업의 「시트 열기」라 소속 추가 확인 위에 시트를 띄운다.
const STATES = [
  { id: "code", label: "초대 코드 입력", note: "휴대전화번호 + 8자리" },
  { id: "code-fail", label: "코드 틀림", note: "어느 칸인지 알리지 않음" },
  { id: "code-locked", label: "입력 잠금", note: "남은 시간 · 재발송 안내" },
  { id: "invite", label: "초대 확인", note: "가입 시작 전" },
  { id: "has-account", label: "계정 있음", note: "로그인 뒤 소속 추가 확인" },
  { id: "signup", label: "계정 등록", note: "초대 코드로 옴 · 번호 읽기 전용" },
  { id: "signup-link", label: "계정 등록 · 링크", note: "초대 링크로 옴 · 초대의 번호" },
  { id: "done", label: "가입 완료", note: "날인 요청 팝업 · 종이 계약은 신고 정보" },
  { id: "bpshare", label: "사업자 제공 동의", note: "가맹 점포 · 선택" },
  { id: "minor", label: "만 19세 미만", note: "가입 중단" },
  { id: "addsite", label: "소속 추가 확인", note: "수락 전" },
  { id: "addsite-done", label: "소속 추가 완료", note: "수락 후" },
  { id: "expired", label: "초대 만료", note: "30일 경과 · 재초대로 무효" },
  { id: "login", label: "로그인", note: "이미 가입을 마친 초대" },
  { id: "reject", label: "소속 추가 거절", note: "사유 입력(선택)" },
];

// 아직 없는 화면(2·3장)은 데모 입구로 건다.
const HOME = page("home");
const CONTRACT = page("contract", "detail");
const LOGIN = page("login");

const CODE_HELP = "초대 코드는 근무지에서 보낸 알림톡·문자에서 확인할 수 있습니다.<br>받지 못했다면 근무지 관리자에게 요청해 주세요.";

// 초대 코드 입력(code · code-fail). 틀려도 어느 칸인지 알리지 않으므로 두 칸을 함께 빨갛게 하고 문구는 코드 칸 아래 한 줄만.
const codeView = (fail) =>
  pageHeader("초대 코드로 가입", { backHref: LOGIN }) +
  body(
    steps("1 / 4 · 초대 코드", 1) +
      lead("초대 코드 입력", "초대받은 휴대전화번호와 초대 코드 8자리를 입력해 주세요.", { align: "left", heading: "h2" }) +
      textField({
        label: "휴대전화번호*",
        type: "tel",
        inputmode: "numeric",
        required: true,
        placeholder: "숫자만 입력해 주세요",
        value: "010-9284-5521",
        "data-need": "code",
        "aria-invalid": fail ? "true" : undefined,
      }) +
      textField({
        label: "초대 코드*",
        maxlength: 8,
        autocapitalize: "characters",
        required: true,
        placeholder: "초대 코드 8자리",
        value: fail ? "K7M4Q9TS" : "K7M4Q9TX",
        "data-need": "code",
        error: fail ? "휴대전화번호 또는 초대 코드를 다시 확인해 주세요" : undefined,
      }) +
      notice(CODE_HELP),
  ) +
  dock(button("다음", { "data-gate": "code", ...go("invite") }) + (fail ? ghost("여러 번 틀리면?", go("code-locked")) : ghost("번호나 코드가 맞지 않으면?", go("code-fail"))));

// 선택 칸 두 개(성별 · 외국인 여부). 라벨은 textField 와 같은 모양.
const pick = (labelText, items, value) =>
  `<div class="flex flex-col gap-[8px]"><p class="text-[13px] font-semibold text-staff-text-sub">${labelText}</p>${segmentedControl({ label: labelText.replace("*", ""), items, value })}</div>`;

const go = (id, toast) => ({ "data-go": id, "data-toast": toast });
const ghost = (label, a = {}) => button(label, { variant: "ghost", ...a });

// 화면 첫 제목 + 설명. large 는 Display(28), 나머지는 Title 1(22). PageHeader 가 h1 을 그린 화면에서는 h2.
const lead = (title, children, { large = false, align = "center", heading = "h1" } = {}) =>
  `<div class="flex flex-col gap-[6px] ${align === "center" ? "items-center text-center" : ""}"><${heading} class="font-bold ${large ? "text-[28px]" : "text-[22px]"}">${title}</${heading}><p class="text-[14px] text-staff-text-sub">${children}</p></div>`;

// 단계 막대(코드로 오면 4단계, 링크로 오면 3단계). 지난 단계·지금 단계는 남보라(지금 진행 중), 남은 단계는 탭 판 회색(#EDF0F6).
const steps = (label, step, total = 4) =>
  `<div class="flex flex-col gap-[8px]"><p class="text-[13px] font-semibold text-staff-text-sub">${label}</p><div class="flex gap-[6px]" aria-hidden="true">${Array.from({ length: total }, (_, i) => i + 1)
    .map((n) => `<span class="h-[4px] flex-1 rounded-full ${n <= step ? "bg-staff-primary" : "bg-[#edf0f6]"}"></span>`)
    .join("")}</div></div>`;

// 읽기 전용 칸(목업 input--ro). me 화면의 readOnlyField 와 같은 모양 — 안내 바탕·옅은 테두리·보조 글자.
const readOnlyField = ({ label, value, help }) => {
  const id = uid("ro");
  return `<div class="flex flex-col gap-[8px]"><label for="${id}" class="text-[13px] font-semibold text-staff-text-sub">${label}</label><input id="${id}" type="tel" readonly value="${value}" aria-describedby="${id}-help" class="h-[52px] w-full min-w-0 rounded-[12px] border border-staff-border-light bg-staff-info-bg px-[14px] text-[16px] text-staff-text-sub outline-none!"><p id="${id}-help" class="text-[12px] text-staff-text-muted">${help}</p></div>`;
};

const rows = (children) => `<div class="flex flex-col divide-y divide-staff-border-light">${children}</div>`;

// 비밀번호 조건 충족 줄: 성공색(#22C55E) 원 안에 흰 체크.
const met = (children) =>
  `<li class="flex items-center gap-[8px]"><span class="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#22c55e]">${img("check.svg", 10, 10)}</span><span>${children}</span></li>`;

const LINK_BTN = "text-[13px] font-semibold text-staff-text-sub underline underline-offset-2 transition-colors duration-150 ease-out active:bg-staff-primary-inactive";

// 약관 한 줄(JOIN-6): 체크칸 · 이름 + 필수/선택 배지 · 설명 · 「보기」. 필수 줄은 data-need 로 「다음」을 켠다.
const termRow = ({ title, required = false, sub, viewToast }) =>
  `<div class="flex items-start gap-[10px] py-[8px] first:pt-0 last:pb-0">${checkBox({ label: title, "data-need": required ? "terms" : undefined })}<div class="min-w-0 flex-1"><p class="flex flex-wrap items-center gap-[6px] text-[14px] font-semibold">${title} ${badge(
    "plain",
    required ? "필수" : "선택",
  )}</p><p class="pt-[3px] text-[12px] text-staff-text-sub">${sub}</p></div><button type="button" data-toast="${viewToast}" aria-label="${title} 보기" class="-my-[8px] h-[44px] shrink-0 rounded-[12px] px-[10px] ${LINK_BTN}">보기</button></div>`;

// 본사 제공 동의(가맹 점포 · 선택).
const bpShareConsent = () =>
  sunken(
    `<div class="flex items-start gap-[10px]">${checkBox({ label: "사업자 제공 동의" })}<div class="min-w-0 flex-1"><p class="flex items-center gap-[6px] text-[14px] font-semibold">사업자 제공 동의 ${badge(
      "plain",
      "선택",
    )}</p><p class="pt-[3px] text-[12px] text-staff-text-sub">가맹본부(웨일카페)가 내 근무 정보를 개인 단위로 보는 것에 동의합니다.</p><button type="button" data-open="bpshare" class="-ml-[10px] h-[44px] rounded-[12px] px-[10px] ${LINK_BTN}">내용 보기</button></div></div>`,
  );

const bpShareSheet = (a = {}) =>
  bottomSheet(
    "bpshare",
    { title: "사업자 제공 동의", ...a },
    `<p class="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">내 근무 정보를 <b>가맹본부에 개인별로 제공</b>하는 데 대한 <b>선택 동의</b>입니다.</p>${sunken(
      values([
        ["받는 자", "가맹본부 · 웨일카페"],
        ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
        ["목적", "가맹점 운영 지원과 점검"],
        ["보유 기간", "철회 또는 가맹 관계 종료까지"],
      ]),
    )}<p class="text-[12px] text-staff-text-sub [&_b]:font-bold">동의하지 않아도 가입과 근무는 그대로 됩니다. 이때 본사에는 <b>점포별 숫자로만</b> 보입니다. 동의는 내 정보에서 언제든 철회할 수 있고, <b>항목이나 목적이 넓어지면</b> 새 버전으로 다시 동의를 받습니다. <span class="text-staff-text-muted">사업자 제공 동의 v1.0</span></p><p class="text-[12px] text-staff-text-muted">동의 문구는 법무 검토 중(ATT-8)</p>`,
  );

const rejectSheet = (a = {}) =>
  bottomSheet(
    "reject",
    { title: "소속 추가를 거절하시겠습니까?", description: "거절해도 기존 근무지와 계정은 유지됩니다.", closeLabel: "취소", ...a },
    textField({ label: "거절 사유 (선택)", placeholder: "예: 다른 곳에서 일하고 있어요" }) + button("거절하기", { "data-close": true, "data-toast": "소속 추가를 거절했습니다" }),
  );

const VIEWS = {
  code: () => codeView(false),
  "code-fail": () => codeView(true),

  // JOIN-7 잠금 — 같은 번호로 5회 틀리면 30분. 「30분 뒤 다시 시도」와 재발송(그 번호의 잠금이 풀린다)을 함께 안내한다. IP 기준 제한은 없다(2026-10-20). 남은 시간은 고정 값.
  "code-locked": () =>
    pageHeader("초대 코드로 가입", { backHref: LOGIN }) +
    body(
      lead("초대 코드 입력이 잠시 잠겼습니다", "30분 뒤 다시 시도하거나,<br><strong>근무지 관리자에게 초대 코드 재발송을 요청해 주세요.</strong>", { align: "left", heading: "h2" }) +
        alert("warning", `<p class="text-[14px] font-semibold">남은 시간</p><p class="text-[28px] font-bold tabular-nums">28:41</p>`),
    ) +
    dock(button("다시 입력하기 · 28:41 뒤", { disabled: true }) + ghost("로그인으로 돌아가기", { href: LOGIN })),

  // 초대한 근무지와 고용 형태만 보인다. 기존 계정 정보와 직원 레코드 값은 보이지 않는다.
  invite: () =>
    body(
      lead("초대가 도착했습니다", "웨일카페 강남역점에서 함께 일하자고 초대했습니다.", { large: true }) +
        card(
          rows(
            iconRow({ icon: "store-small.svg", title: "웨일카페 · 강남역점", sub: "서울 강남구 테헤란로 1길" }) +
              iconRow({ icon: "contract.svg", title: "고용 형태", sub: "파트타이머 · 시급제" }),
          ),
        ) +
        notice("이 초대는 <strong>11월 18일까지</strong> 사용할 수 있습니다."),
    ) +
    dock(
      button(`가입하기${img("arrow-right.svg", 14, 12)}`, go("signup")) +
        ghost("이 번호로 계정이 이미 있으면?", go("has-account")) +
        ghost("이미 가입을 마친 초대면?", go("login")) +
        ghost("만료된 초대면?", go("expired")),
    ),

  // 이 번호로 계정이 이미 있으면 가입하지 않고 로그인한다. 소속 추가 확인·복귀 확인은 로그인 뒤 앱 안의 확인 화면이다(운영 정책 JOI-02).
  // 기존 계정의 이메일은 보이지 않는다.
  "has-account": () =>
    body(
      lead("이미 가입된 계정이 있습니다", "이 휴대전화번호로 가입한 계정이 있습니다.<br>로그인한 뒤 초대를 수락해 주세요."),
    ) + dock(button("로그인하러 가기", { href: LOGIN }) + ghost("로그인한 뒤 · 소속 추가 확인", go("addsite", "로그인했습니다"))),

  // link: 초대 링크로 온 경로 — 코드 입력이 없어 3단계이고 번호는 그 초대(근로계약서)의 번호다.
  signup: (link = false) =>
    body(
      (link ? steps("2 / 3 · 계정 등록", 2, 3) : steps("3 / 4 · 계정 등록", 3)) +
        lead("계정 등록", "웨일카페 강남역점 근무를 위한 계정입니다.", { align: "left" }) +
        // 인적사항 다섯 가지(운영 정책 ACC-23). 이름·생년월일·성별·외국인 여부가 계약서와 다르면 날인 전 본인 대조에서 수정 요청으로 이어지고(운영 정책 JOI-10), 가입을 막지는 않는다.
        // 휴대전화번호는 계정의 매칭 키라 읽기 전용이다 — 고칠 수 있으면 남의 번호로 가입해 그 사람의 다음 초대를 막을 수 있다(JOIN-7).
        `<p class="text-[15px] font-bold">인적사항</p>` +
        textField({ label: "이름*", autocomplete: "name", required: true, placeholder: "이름을 입력해 주세요", value: "김민서" }) +
        readOnlyField({
          label: "휴대전화번호*",
          value: "010-9284-5521",
          help: "번호 변경이 필요하면 근무지 관리자에게 문의해 주세요.",
        }) +
        textField({ label: "생년월일*", inputmode: "numeric", maxlength: 8, placeholder: "YYYYMMDD", required: true, value: "19980412", help: "가입 후에는 변경할 수 없으니 정확히 입력해 주세요." }) +
        pick("성별*", [{ value: "m", label: "남" }, { value: "f", label: "여" }], "f") +
        pick("외국인 여부*", [{ value: "n", label: "내국인" }, { value: "y", label: "외국인" }], "n") +
        `<hr class="border-staff-border-light">` +
        `<p class="text-[15px] font-bold">로그인 정보</p>` +
        textField({
          label: "이메일*",
          type: "email",
          required: true,
          placeholder: "이메일을 입력해 주세요",
          value: "minseo.kim@gmail.com",
          help: "로그인 아이디로 사용됩니다.",
        }) +
        textField({ label: "비밀번호*", type: "password", required: true, placeholder: "비밀번호를 입력해 주세요" }) +
        textField({ label: "비밀번호 확인*", type: "password", required: true, placeholder: "비밀번호를 한 번 더 입력해 주세요" }) +
        sunken(
          `<p class="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p><ul class="flex flex-col gap-[6px] pt-[8px] text-[13px] [&_b]:font-bold">${met(
            "영문 대소문자·숫자·특수문자 중 <b>3가지</b> 이상",
          )}${met("8자 이상 20자 이하")}${met("이메일 아이디와 중복 불가")}</ul><p class="pt-[8px] text-[12px] text-staff-text-muted">2가지만 사용하면 10자 이상 입력해 주세요.</p>`,
        ) +
        `<hr class="border-staff-border-light">` +
        // 검색 버튼은 입력칸 높이(52)에 맞춘다. outline 은 44px 라 직접 그린다.
        `<div class="flex flex-col gap-[8px]"><label for="join-address" class="text-[13px] font-semibold text-staff-text-sub">주소*</label><div class="flex gap-[8px]"><input id="join-address" readonly required placeholder="주소를 검색해 주세요" value="서울 마포구 양화로 12" class="${FIELD}"><button type="button" data-toast="주소 검색을 엽니다" class="h-[52px] shrink-0 rounded-[12px] border border-staff-border bg-white px-[18px] text-[14px] font-semibold transition-colors duration-150 ease-out active:bg-staff-primary-inactive">검색</button></div></div>` +
        textField({ label: "상세주소", placeholder: "상세주소", value: "3층 302호" }) +
        `<hr class="border-staff-border-light">` +
        // 약관 동의(JOIN-6). 필수 둘은 1팀 TERMS_TYPE 의 직원 앱 회원가입용(STAFF_TERMS_SERVICE · STAFF_PRIVACY),
        // 선택은 MARKETING. 위치정보 동의는 첫 출근 등록 때 따로 받는다. 데모에서 「다음」이 켜지는 것을 보이려고 모두 빈 칸으로 시작한다.
        `<div class="flex flex-col gap-[8px]"><p class="text-[13px] font-semibold text-staff-text-sub">약관 동의</p>${sunken(
          termRow({ title: "직원 앱 서비스 이용약관", required: true, sub: "직원 근무 앱 이용에 필요한 약관입니다.", viewToast: "서비스 이용약관 전문을 엽니다" }) +
            termRow({ title: "개인정보 수집·이용 동의", required: true, sub: "계정 생성과 근무 관리에 필요한 정보입니다.", viewToast: "개인정보 수집·이용 동의 전문을 엽니다" }) +
            termRow({ title: "마케팅 정보 수신", sub: "새 기능과 이벤트 소식을 받습니다.", viewToast: "마케팅 정보 수신 안내를 엽니다" }),
        )}</div>` +
        `<div class="flex flex-col gap-[8px]">${bpShareConsent()}</div>` +
        `<p class="text-[12px] text-staff-text-muted">필수 약관에 모두 동의해야 가입할 수 있습니다.</p>`,
    ) +
    dock(
      button("가입하기", { disabled: true, "data-gate": "terms", ...go("done", "가입이 완료되었습니다") }) +
        ghost("만 19세 미만이면?", go("minor")) +
        (link ? "" : ghost("초대 링크로 왔으면?", go("signup-link"))),
    ),
  "signup-link": () => VIEWS.signup(true),

  minor: () =>
    body(
      lead("가입할 수 없습니다", "만 19세 미만은 가입할 수 없습니다.<br><strong>근무지 관리자에게 문의해 주세요.</strong>") +
        sunken(`<p class="text-[13px] text-staff-text-sub">입력한 정보는 저장되지 않았습니다.</p>`),
      { center: true },
    ) + dock(ghost("로그인으로 돌아가기", { href: page("login") })),

  // 로그인된 상태로 홈에 간다. 전자계약은 홈 위에 날인 요청 팝업(HOME-1), 종이 계약은 신고 정보 입력(CON-8).
  done: () =>
    body(
      lead("가입이 완료되었습니다", "웨일카페 강남역점에서 바로 시작할 수 있습니다.") +
        sunken(
          values([
            ["이름", "김민서"],
            ["생년월일", "1998.04.12"],
            ["근무지", "웨일카페 강남역점"],
          ]),
        ) +
        `<p class="text-[12px] text-staff-text-muted">인적사항을 변경하려면 근무지 관리자에게 문의해 주세요.</p>` +
        card(iconRow({ icon: "contract.svg", title: "근로계약서가 도착했습니다", sub: "홈에서 내용을 확인하고 서명해 주세요." })) +
        `<div class="text-left">${notice("<strong>종이로 계약했다면</strong> 서명 없이 신고 정보만 입력하면 됩니다.")}</div>`,
      { center: true },
    ) + dock(button("홈으로", { href: page("home", "sign-req") }) + ghost("종이 계약이면 · 신고 정보 입력", { href: page("tax", "intro") })),

  // 수락 전에는 초대한 사업자·점포와 고용 형태만 보이고 기존 계정 정보는 보이지 않는다.
  addsite: () =>
    pageHeader("소속 추가 확인", { backHref: HOME }) +
    body(
      lead("새 근무지 초대가 도착했습니다", "웨일카페 홍대점에서 함께 일하자고 초대했습니다.", { heading: "h2" }) +
        card(
          rows(
            iconRow({ icon: "store-small.svg", title: "웨일카페 · 홍대점", sub: "서울 마포구 양화로" }) +
              iconRow({ icon: "contract.svg", title: "고용 형태", sub: "파트타이머 · 주 20시간" }),
          ),
        ) +
        notice(
          "수락하면 <strong>이름·휴대전화번호·생년월일·성별·외국인 여부</strong>만 새 근무지에 공유됩니다.<br>기존 근무지의 계약·급여·출퇴근 기록은 공유되지 않습니다.",
          maskIcon("shield.svg", 14, true),
        ) +
        notice(
          "시급·근무 시간 등 근무 조건은 수락한 뒤 받는 근로계약서에서 확인할 수 있습니다.",
          maskIcon("contract.svg", 14),
        ) +
        bpShareConsent(),
    ) +
    dock(`<div class="grid grid-cols-2 gap-[8px]">${ghost("거절", { "data-open": "reject" })}${button("수락", go("addsite-done", "소속을 추가했습니다"))}</div>`),

  "addsite-done": () =>
    pageHeader("소속 추가 완료", { backHref: HOME }) +
    body(
      lead("웨일카페 홍대점이 추가되었습니다", "지금 쓰는 계정으로 홍대점 근무를 시작할 수 있습니다.", { heading: "h2" }) +
        sunken(
          values([
            ["공유된 정보", "이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부"],
            ["공유되지 않은 정보", "계약 · 급여 · 출퇴근 기록"],
          ]),
        ) +
        `<div class="text-left">${notice("<strong>홍대점 근로계약서가 도착했습니다.</strong><br>계약서에 서명하면 근무를 시작할 수 있습니다.", maskIcon("contract.svg", 14))}</div>`,
      { center: true },
    ) + dock(button(`${maskIcon("contract.svg", 14)}계약서 서명하기`, { href: CONTRACT }) + ghost("홈으로", { href: HOME })),

  expired: () =>
    body(
      lead("초대가 만료되었습니다", "초대를 받은 지 30일이 지났거나 새 초대가 발송되었습니다.<br><strong>근무지 관리자에게 다시 초대를 요청해 주세요.</strong>"),
    ) + dock(ghost("로그인으로 돌아가기", { href: LOGIN })),

  login: () =>
    body(
      lead("이미 가입이 완료된 초대입니다", "로그인하면 이어서 진행할 수 있습니다.") +
        textField({ label: "이메일", type: "email", placeholder: "가입한 이메일을 입력해 주세요" }) +
        textField({ label: "비밀번호", type: "password", placeholder: "비밀번호를 입력해 주세요" }) +
        bpShareConsent(),
    ) +
    dock(button("로그인", { href: HOME })),
};

const main = (id) => `<main class="flex flex-1 flex-col leading-[1.5]">${VIEWS[id]()}</main>`;
const SHEET_BACK = { "data-sheet-auto": true, "data-on-close": "#addsite" };

// 시트는 React 판처럼 main 밖에 둔다. 소속 추가 확인은 두 시트를 모두 열 수 있다.
const BLOCKS = {
  signup: () => main("signup") + bpShareSheet(),
  "signup-link": () => main("signup-link") + bpShareSheet(),
  login: () => main("login") + bpShareSheet(),
  addsite: () => main("addsite") + bpShareSheet() + rejectSheet(),
  bpshare: () => main("addsite") + bpShareSheet(SHEET_BACK) + rejectSheet(),
  reject: () => main("addsite") + bpShareSheet() + rejectSheet(SHEET_BACK),
};

export default () => ({
  title: "진입·가입",
  states: STATES,
  html: STATES.map((s) => state(s.id, BLOCKS[s.id] ? BLOCKS[s.id]() : main(s.id))).join(""),
});
