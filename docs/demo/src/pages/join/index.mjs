// 진입·가입 데모. 기준 목업: docs/mockup/app/join.html — 상태 11개(초대 코드 입력 · 코드 틀림 · 입력 잠금 · 초대 확인 ·
// 계정 등록 · 가입 완료 · 만 19세 미만 · 소속 추가 확인 · 소속 추가 완료 · 초대 만료 · 로그인)와 시트 2개(본사 제공 동의 · 소속 추가 거절),
// 화면 문구·가짜 값·하단 버튼의 이동(data-go)을 그대로 옮겼다. 화면 순서는 docs/plans/2026-10-19-진입-가입-화면-가이드.md.
// 본인인증과 연결 보류는 없다 — 가입하면 계정이 초대의 직원 레코드에 바로 이어진다(운영 정책 JOI-04, 2026-10-19).
// 초대 코드 입력(JOIN-7)은 두 칸을 다 채워야, 계정 등록의 약관 동의(JOIN-6)는 필수 둘을 모두 체크해야 버튼이 켜진다.
// Figma 없음 — DESIGN.md 기준 초안.
import { FIELD, alert, badge, body, bottomSheet, button, card, checkBox, dock, iconRow, img, maskIcon, notice, page, pageHeader, seal, segmentedControl, state, sunken, textField, values } from "../../ui.mjs";

// 목업 오른쪽 상태 목록 순서 그대로. bpshare·reject 는 목업의 「시트 열기」라 소속 추가 확인 위에 시트를 띄운다.
const STATES = [
  { id: "code", label: "초대 코드 입력", note: "휴대전화번호 + 8자리" },
  { id: "code-fail", label: "코드 틀림", note: "어느 칸인지 알리지 않음" },
  { id: "code-locked", label: "입력 잠금", note: "남은 시간 · JOIN-7 미정" },
  { id: "invite", label: "초대 확인", note: "가입 시작 전" },
  { id: "signup", label: "계정 등록", note: "인적사항·로그인 정보·약관" },
  { id: "done", label: "가입 완료", note: "날인 요청 팝업 · 종이 계약은 신고 정보" },
  { id: "bpshare", label: "본사 제공 동의", note: "가맹 점포 · 선택" },
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

const CODE_HELP = "초대 코드는 근무지에서 보낸 알림톡·문자에 있습니다. 받지 못했으면 근무지에 다시 보내 달라고 요청해 주세요.";

// 초대 코드 입력(code · code-fail). 틀려도 어느 칸인지 알리지 않으므로 두 칸을 함께 빨갛게 하고 문구는 코드 칸 아래 한 줄만.
const codeView = (fail) =>
  pageHeader("초대 코드로 가입", { backHref: LOGIN }) +
  body(
    steps("1 / 4 · 초대 코드", 1) +
      lead("초대 코드를 넣어 주세요", "초대를 받은 휴대전화번호와 8자리 초대 코드를 함께 넣습니다.", { align: "left", heading: "h2" }) +
      textField({
        label: "휴대전화번호*",
        type: "tel",
        inputmode: "numeric",
        required: true,
        value: "010-9284-5521",
        "data-need": "code",
        "aria-invalid": fail ? "true" : undefined,
        help: "초대를 받은 번호입니다. 숫자만 넣으면 하이픈은 저절로 들어갑니다.",
      }) +
      textField({
        label: "초대 코드*",
        maxlength: 8,
        autocapitalize: "characters",
        required: true,
        value: fail ? "K7M4Q9TS" : "K7M4Q9TX",
        "data-need": "code",
        help: fail ? undefined : "8자리입니다. 두 칸을 모두 채우면 「다음」이 켜집니다.",
        error: fail ? "휴대전화번호나 초대 코드를 다시 확인해 주세요" : undefined,
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

// 4단계 막대. 지난 단계·지금 단계는 남보라(지금 진행 중), 남은 단계는 탭 판 회색(#EDF0F6).
const steps = (label, step) =>
  `<div class="flex flex-col gap-[8px]"><p class="text-[13px] font-semibold text-staff-text-sub">${label}</p><div class="flex gap-[6px]" aria-hidden="true">${[1, 2, 3, 4]
    .map((n) => `<span class="h-[4px] flex-1 rounded-full ${n <= step ? "bg-staff-primary" : "bg-[#edf0f6]"}"></span>`)
    .join("")}</div></div>`;

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
// 선택 동의가 필수처럼 읽히지 않도록 「동의하지 않아도 가입과 근무는 그대로」를 체크 옆에 같이 둔다.
const bpShareConsent = () =>
  sunken(
    `<div class="flex items-start gap-[10px]">${checkBox({ label: "본사 제공 동의" })}<div class="min-w-0 flex-1"><p class="flex items-center gap-[6px] text-[14px] font-semibold">본사 제공 동의 ${badge(
      "plain",
      "선택",
    )}</p><p class="pt-[3px] text-[12px] text-staff-text-sub">가맹본부(웨일카페)가 내 근무 정보를 개인 단위로 보는 것에 동의합니다.</p><button type="button" data-open="bpshare" class="-ml-[10px] h-[44px] rounded-[12px] px-[10px] ${LINK_BTN}">내용 보기</button></div></div><p class="pt-[4px] text-[12px] text-staff-text-muted">동의하지 않아도 가입과 근무는 그대로 됩니다. 이때 본사에는 점포별 숫자로만 보입니다.</p>`,
  );

const bpShareSheet = (a = {}) =>
  bottomSheet(
    "bpshare",
    { title: "본사 제공 동의", ...a },
    `<p class="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">가맹 점포에서 일하는 직원의 근무 정보를 <b>가맹본부가 개인 단위로</b> 보는 것에 대한 <b>선택 동의</b>입니다.</p>${sunken(
      values([
        ["받는 자", "가맹본부 · 웨일카페"],
        ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
        ["목적", "가맹점 운영 지원과 점검"],
        ["보유 기간", "철회 또는 가맹 관계 종료까지"],
      ]),
    )}<p class="text-[12px] text-staff-text-sub [&_b]:font-bold">동의하지 않아도 가입과 근무는 그대로 됩니다. 이때 본사에는 <b>점포별 숫자로만</b> 보입니다. 동의는 내 정보에서 언제든 철회할 수 있고, <b>항목이나 목적이 넓어지면</b> 새 버전으로 다시 동의를 받습니다. <span class="text-staff-text-muted">본사 제공 동의 v1.0</span></p><p class="text-[12px] text-staff-text-muted">동의 문구는 법무 검토 중(ATT-8)</p>`,
  );

const rejectSheet = (a = {}) =>
  bottomSheet(
    "reject",
    { title: "소속 추가를 거절하시겠어요?", description: "거절해도 기존 소속과 계정에는 영향이 없습니다.", closeLabel: "취소", ...a },
    textField({ label: "거절 사유 (선택)", placeholder: "예: 다른 곳에서 일하고 있어요" }) + button("거절하기", { "data-close": true, "data-toast": "확인을 거절했습니다" }),
  );

const VIEWS = {
  code: () => codeView(false),
  "code-fail": () => codeView(true),

  // JOIN-7 잠금 — 후보(같은 번호 5회 틀리면 30분)로 그렸다. 남은 시간은 고정 값.
  "code-locked": () =>
    pageHeader("초대 코드로 가입", { backHref: LOGIN }) +
    body(
      lead("잠시 뒤 다시 시도해 주세요", "휴대전화번호나 초대 코드를 여러 번 잘못 넣어 입력을 잠갔습니다.", { align: "left", heading: "h2" }) +
        alert("warning", `<p class="text-[14px] font-semibold">남은 시간</p><p class="text-[28px] font-bold tabular-nums">28:41</p>`) +
        notice(CODE_HELP),
    ) +
    dock(button("다음", { disabled: true }) + ghost("로그인 화면으로", { href: LOGIN })),

  // 초대한 근무지와 고용 형태만 보인다. 기존 계정 정보와 직원 레코드 값은 보이지 않는다.
  invite: () =>
    body(
      lead("초대를 확인해 주세요", "웨일카페 강남역점에서 함께 일하자고 초대를 보냈습니다.", { large: true }) +
        card(
          rows(
            iconRow({ icon: "store-small.svg", title: "웨일카페 · 강남역점", sub: "서울 강남구 테헤란로 1길" }) +
              iconRow({ icon: "contract.svg", title: "고용 형태", sub: "파트타이머 · 시급제" }),
          ),
        ) +
        notice("초대는 받은 날부터 <strong>30일</strong> 동안 쓸 수 있습니다. 이 초대는 <strong>11월 18일까지</strong> 쓸 수 있습니다."),
    ) +
    dock(
      button(`가입 시작${img("arrow-right.svg", 14, 12)}`, go("signup")) +
        ghost("이 번호로 계정이 이미 있으면?", go("addsite")) +
        ghost("이미 가입을 마친 초대면?", go("login")) +
        ghost("만료된 초대면?", go("expired")),
    ),

  signup: () =>
    body(
      steps("3 / 4 · 계정 등록", 3) +
        lead("계정을 등록해 주세요", "웨일카페 강남역점 근무를 위한 계정입니다.", { align: "left" }) +
        // 인적사항 다섯 가지(운영 정책 ACC-23). 계약서와 다르면 날인 전 본인 대조에서 수정 요청으로 이어지고(운영 정책 JOI-10), 가입을 막지는 않는다.
        `<p class="text-[15px] font-bold">인적사항</p>` +
        textField({ label: "이름*", autocomplete: "name", required: true, value: "김민서" }) +
        textField({
          label: "휴대전화번호*",
          type: "tel",
          inputmode: "numeric",
          required: true,
          value: "010-9284-5521",
          help: "초대 코드와 함께 넣은 번호를 채워 두었습니다. 근로계약서의 번호와 다르면 날인 전에 근무지에 수정 요청을 보내게 됩니다.",
        }) +
        textField({ label: "생년월일*", inputmode: "numeric", maxlength: 8, placeholder: "YYYYMMDD", required: true, value: "19980412", help: "8자리로 넣어 주세요. 가입한 뒤에는 고칠 수 없습니다." }) +
        pick("성별*", [{ value: "m", label: "남" }, { value: "f", label: "여" }], "f") +
        pick("외국인 여부*", [{ value: "n", label: "내국인" }, { value: "y", label: "외국인" }], "n") +
        `<hr class="border-staff-border-light">` +
        `<p class="text-[15px] font-bold">로그인 정보</p>` +
        textField({
          label: "이메일*",
          type: "email",
          required: true,
          value: "minseo.kim@gmail.com",
          help: "로그인할 때 쓰는 아이디입니다. 비밀번호를 잊으면 이 주소로 인증번호가 갑니다.",
        }) +
        textField({ label: "비밀번호*", type: "password", required: true, value: "Whale#cafe25" }) +
        textField({ label: "비밀번호 확인*", type: "password", required: true, value: "Whale#cafe25", help: "두 번 넣은 값이 같아야 다음으로 넘어갑니다." }) +
        sunken(
          `<p class="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p><ul class="flex flex-col gap-[6px] pt-[8px] text-[13px] [&_b]:font-bold">${met(
            "영문 대소문자·숫자·기호 중 <b>세 가지</b>를 섞었습니다",
          )}${met("8자 이상 20자 이하")}${met("이메일 아이디와 겹치지 않습니다")}</ul><p class="pt-[8px] text-[12px] text-staff-text-muted">두 가지만 섞으면 10자 이상이어야 합니다.</p>`,
        ) +
        `<hr class="border-staff-border-light">` +
        notice(
          "<strong>인적사항은 이제 여기서 직접 입력합니다.</strong> 근로계약서에 들어갈 주소 항목이 관리자 작성 화면에서 빠지고, 가입하는 직원이 적는 것으로 바뀌었습니다. 도로명 주소는 검색해서 고르고 상세주소만 직접 적습니다(ME-2).",
          maskIcon("contract.svg", 14),
        ) +
        // 검색 버튼은 입력칸 높이(52)에 맞춘다. outline 은 44px 라 직접 그린다.
        `<div class="flex flex-col gap-[8px]"><label for="join-address" class="text-[13px] font-semibold text-staff-text-sub">주소*</label><div class="flex gap-[8px]"><input id="join-address" readonly required value="서울 마포구 양화로 12" aria-describedby="join-address-help" class="${FIELD}"><button type="button" data-toast="주소 검색을 엽니다" class="h-[52px] shrink-0 rounded-[12px] border border-staff-border bg-white px-[18px] text-[14px] font-semibold transition-colors duration-150 ease-out active:bg-staff-primary-inactive">검색</button></div><p id="join-address-help" class="text-[12px] text-staff-text-muted">도로명 주소는 검색해서 고릅니다.</p></div>` +
        textField({ label: "상세주소", placeholder: "상세주소", value: "3층 302호", help: "상세주소만 직접 적습니다." }) +
        `<hr class="border-staff-border-light">` +
        // 약관 동의(JOIN-6). 필수 둘은 1팀 TERMS_TYPE 의 직원 앱 회원가입용(STAFF_TERMS_SERVICE · STAFF_PRIVACY),
        // 선택은 MARKETING. 위치정보 동의는 첫 출근 등록 때 따로 받는다. 데모에서 「다음」이 켜지는 것을 보이려고 모두 빈 칸으로 시작한다.
        `<div class="flex flex-col gap-[8px]"><p class="text-[13px] font-semibold text-staff-text-sub">약관 동의</p>${sunken(
          termRow({ title: "직원 앱 서비스 이용약관", required: true, sub: "직원 근무 앱을 쓰는 데 필요한 약관입니다.", viewToast: "서비스 이용약관 전문을 엽니다" }) +
            termRow({ title: "개인정보 수집·이용 동의", required: true, sub: "계정을 만들고 근무를 관리하는 데 쓰는 정보입니다.", viewToast: "개인정보 수집·이용 동의 전문을 엽니다" }) +
            termRow({ title: "마케팅 정보 수신", sub: "새 기능과 이벤트 소식을 받습니다. 동의하지 않아도 가입할 수 있습니다.", viewToast: "마케팅 정보 수신 안내를 엽니다" }),
        )}</div>` +
        `<div class="flex flex-col gap-[8px]"><p class="text-[12px] text-staff-text-muted">가맹 점포로 가입할 때만 보입니다</p>${bpShareConsent()}</div>` +
        `<p class="text-[12px] text-staff-text-muted">필수 약관 두 개에 모두 동의해야 가입할 수 있습니다. 위치정보 동의는 첫 출근 등록 때 따로 받습니다.</p>`,
    ) +
    dock(button("가입하기", { disabled: true, "data-gate": "terms", ...go("done", "가입을 마쳤습니다") }) + ghost("만 19세 미만이면?", go("minor"))),

  minor: () =>
    body(
      lead("가입을 진행할 수 없습니다", "만 19세 미만은 WHALE ERP 로 근로계약과 출퇴근을 관리하지 않습니다. 근무지 관리자에게 알려 주세요.") +
        sunken(
          `<p class="text-[13px] text-staff-text-sub">계정은 만들지 않았습니다. 가입 때 넣은 생년월일은 남기지 않습니다. 근로계약과 출퇴근은 근무지에서 따로 관리합니다.</p>`,
        ),
      { center: true },
    ) + dock(ghost("닫기", { href: page("login") })),

  // 로그인된 상태로 홈에 간다. 전자계약은 홈 위에 날인 요청 팝업(HOME-1), 종이 계약은 신고 정보 입력(CON-8).
  done: () =>
    body(
      seal("가입<br>완료") +
        lead("가입을 마쳤습니다", "웨일카페 강남역점 근무지에 계정이 이어졌습니다.") +
        sunken(
          values([
            ["이름", "김민서"],
            ["생년월일", "1998.04.12"],
            ["근무지", "웨일카페 강남역점"],
          ]),
        ) +
        `<p class="text-[12px] text-staff-text-muted">생년월일은 가입한 뒤 고칠 수 없습니다. 이름·성별·외국인 여부는 내 정보에서 고칩니다.</p>` +
        card(iconRow({ icon: "contract.svg", title: "근로계약서가 자동 발송되었습니다", sub: "서명 대기 · 홈에 들어가면 날인 요청 팝업이 뜹니다" })) +
        `<div class="text-left">${notice(
          "<strong>종이로 계약을 맺었다면</strong> 날인할 것이 없습니다. 관리자가 올린 날인본이 계약서 화면에 체결 완료로 보이고, 여기서 바로 신고 정보 입력으로 넘어갑니다.",
        )}</div>`,
      { center: true },
    ) + dock(button("홈으로", { href: page("home", "sign-req") }) + ghost("종이 계약이면 · 신고 정보 입력", { href: page("tax", "intro") })),

  // 수락 전에는 초대한 사업자·점포와 고용 형태만 보이고 기존 계정 정보는 보이지 않는다.
  addsite: () =>
    pageHeader("소속 추가 확인", { backHref: HOME }) +
    body(
      lead("새 소속 추가 요청", "웨일카페 홍대점에서 함께 일해 달라고 요청했습니다.", { heading: "h2" }) +
        card(
          rows(
            iconRow({ icon: "store-small.svg", title: "웨일카페 · 홍대점", sub: "서울 마포구 양화로" }) +
              iconRow({ icon: "contract.svg", title: "고용 형태", sub: "파트타이머 · 주 20시간" }),
          ),
        ) +
        notice(
          "수락하면 <strong>이름·생년월일·연락처만</strong> 새 소속에 복사됩니다. 다른 소속의 계약·급여·출퇴근 기록은 넘어가지 않습니다.",
          maskIcon("shield.svg", 14, true),
        ) +
        notice(
          "<strong>여기서 수락하는 것은 소속 연결까지입니다.</strong> 시급·근무 시간대를 포함한 근무 조건은 수락한 뒤 도착하는 근로계약서에서 확인하고 날인합니다.",
          maskIcon("contract.svg", 14),
        ) +
        bpShareConsent(),
    ) +
    dock(`<div class="grid grid-cols-2 gap-[8px]">${ghost("거절", { "data-open": "reject" })}${button("수락", go("addsite-done", "소속을 추가했습니다"))}</div>`),

  "addsite-done": () =>
    pageHeader("소속 추가 완료", { backHref: HOME }) +
    body(
      seal("연결<br>완료") +
        lead("웨일카페 홍대점 소속이 추가되었습니다", "기존 계정은 그대로이고, 계정의 이름·생년월일·연락처만 이 근무지의 새 직원 레코드에 이어졌습니다.", { heading: "h2" }) +
        sunken(
          values([
            ["넘어간 것", "이름 · 생년월일 · 연락처"],
            ["넘어가지 않은 것", "계약 · 급여 · 출퇴근"],
          ]),
        ) +
        `<div class="text-left">${notice("이 소속의 <strong>근로계약서가 발송되었습니다.</strong> 날인해야 근무가 시작됩니다.", maskIcon("contract.svg", 14))}</div>`,
      { center: true },
    ) + dock(button(`${maskIcon("contract.svg", 14)}홍대점 계약서 날인하러 가기`, { href: CONTRACT }) + ghost("홈으로", { href: HOME })),

  expired: () =>
    body(
      lead("초대가 만료되었습니다", "30일이 지났거나 새 초대로 바뀌어 이 초대는 더 이상 쓸 수 없습니다.") +
        notice("<strong>초대 링크와 초대 코드가 함께</strong> 무효가 됩니다. 가입 초대와 재초대는 받은 날부터 <strong>30일</strong> 동안 쓸 수 있습니다.") +
        sunken(
          `<p class="text-[13px] font-semibold text-staff-text-sub">이제 할 일</p><p class="pt-[6px] text-[13px] text-staff-text-sub">근무지에 다시 초대해 달라고 요청해 주세요. 근로계약서 초안은 그대로 남아 있어 재초대를 받으면 이어서 진행됩니다.</p>`,
        ),
    ) + dock(`<p class="py-[6px] text-center text-[12px] text-staff-text-muted">근무지에서 다시 초대해야 이어서 진행할 수 있습니다.</p>`),

  login: () =>
    body(
      lead("이미 가입을 마친 초대입니다", "로그인하면 이어서 확인할 수 있습니다.") +
        textField({ label: "이메일", type: "email", value: "minseo.kim@gmail.com" }) +
        textField({ label: "비밀번호", type: "password", value: "Whale#cafe25" }) +
        bpShareConsent(),
    ) +
    dock(button("로그인", { href: HOME })),
};

const main = (id) => `<main class="flex flex-1 flex-col leading-[1.5]">${VIEWS[id]()}</main>`;
const SHEET_BACK = { "data-sheet-auto": true, "data-on-close": "#addsite" };

// 시트는 React 판처럼 main 밖에 둔다. 소속 추가 확인은 두 시트를 모두 열 수 있다.
const BLOCKS = {
  signup: () => main("signup") + bpShareSheet(),
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
