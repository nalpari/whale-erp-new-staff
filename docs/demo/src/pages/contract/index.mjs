// 근로계약 데모. 기준 목업: docs/mockup/app/contract.html — 상태 11개(목록 · 상세 · 서명란 · 서명 뒤 · 처리 중 · 날인 완료 · 다시 보기 ·
// 종이 계약 · 거부 완료 · 빈 상태 · 만료)와 시트 1개(거부 사유), 화면 문구·가짜 값·계약서 본문·버튼의 이동(data-go)·알림(data-toast)을 옮겼다.
// 확정 쟁점: 계약서를 앱 글꼴(Pretendard)로 화면에 직접 그리고 체결 완료만 완료본 내보내기(CON-1) · 날인은 필기 서명 — 서명란에 그려야 날인 확정이 살아나고
// 다시 그리기로 지운다(CON-2, 실제로 그리는 캔버스) · 거부 사유는 선택(CON-3) · 남은 기한 7일 이내만 강조색, 임박 알림 없음(CON-4) ·
// 날인 기한 30일 · 근로계약 상태 6종, 발송 대기는 이 화면에 나오지 않는다(CON-5) · 종이 계약은 조항 없이 올라온 날인본 파일만, 임금계약서는 선택(CON-8).
// 노무사 검토 중: 제4조 휴일(CON-6) · 제7조 연차유급휴가(CON-7)는 「문구 확정 전」, 제6조·제8조는 「문구는 노무사 검토 중(PAY-5)」 그대로.
// Figma 없음 — DESIGN.md 기준 초안.
// 목업과 다른 점: 목업 btn--quiet(완료본 내보내기 등)는 홈 데모처럼 outline 버튼이다. 종이 계약에도 목업에 없는 뒤로 가기를 둬 목록으로 간다.
// 목업 seal(인주색 도장)은 데모 조각 Seal 로 그린다. 날인 완료는 정상·완료 색(success), 거부 완료는 거부 배지와 같은 오류 색(danger)이다.
// 서명란 캔버스 그리기·견본 서명·다시 그리기와, 거부 사유가 거부 완료 화면에 들어가는 것은 assets/staff.js 가 맡는다.
import {
  backHeader,
  badge,
  body,
  bottomSheet,
  button,
  dangerButton,
  dock,
  maskIcon,
  notice,
  page,
  pageHeader,
  seal,
  state,
  sunken,
  tiny,
  values,
} from "../../ui.mjs";

// 목업 오른쪽 목록 순서 그대로. 마지막은 목업의 「시트 열기」라 상세 위에 시트를 띄운다.
const STATES = [
  { id: "list", label: "목록", note: "처리할 것과 지난 것" },
  { id: "detail", label: "상세", note: "서명 대기" },
  { id: "sign", label: "서명란", note: "비어 있음" },
  { id: "sign-drawn", label: "서명 뒤", note: "날인 확정 가능" },
  { id: "signing", label: "처리 중", note: "버튼 비활성" },
  { id: "signed", label: "날인 완료", note: "확정" },
  { id: "readonly", label: "다시 보기", note: "읽기 전용" },
  { id: "paper", label: "종이 계약", note: "관리자가 올린 날인본" },
  { id: "rejected", label: "거부 완료", note: "재발송 대기" },
  { id: "empty", label: "빈 상태", note: "계약 없음" },
  { id: "expired", label: "만료", note: "기한 지남" },
  { id: "reject", label: "거부 사유", note: "선택 입력" },
];

// 머리줄 뒤로 가기(목업 data-go-back = 직전 상태). 목록·빈 상태는 홈으로, 날인 완료·거부 완료는 머리줄이 없다.
const BACK = {
  detail: "list",
  sign: "detail",
  "sign-drawn": "detail",
  signing: "detail",
  readonly: "list",
  paper: "list",
  expired: "list",
};

// 목록. 서명 대기를 위로, 그중 기한이 급한 순. 남은 기한 7일 이내만 강조색(CON-4).
const CONTRACTS = [
  { title: "웨일카페 강남역점 · 파트타이머", sub: "날인 기한 2026-09-12 · D-2", status: "서명 대기", to: "detail", urgent: true },
  { title: "웨일카페 홍대점 · 파트타이머", sub: "날인 기한 2026-10-11 · D-30", status: "서명 대기", to: "detail" },
  { title: "웨일카페 홍대점 · 정직원", sub: "날인 2026-08-23", status: "체결 완료", to: "readonly" },
  { title: "웨일카페 홍대점 · 파트타이머", sub: "종이 계약 · 관리자 등록 2026-04-02", status: "체결 완료", to: "paper" },
  { title: "웨일카페 강남역점 · 파트타이머", sub: "거부 2026-06-25", status: "거부", to: "rejected" },
  { title: "웨일카페 홍대점 · 파트타이머", sub: "기한 2026-07-31 지남", status: "만료", to: "expired" },
  { title: "웨일카페 강남역점 · 파트타이머", sub: "2025-03-01 ~ 2026-08-31", status: "종료", to: "readonly" },
];
// 서명 대기만 강조, 거부·만료는 오류 색, 체결 완료는 정상, 종료는 중립(목업 해설 「이 화면이 하는 일」).
const STATUS_TONE = { "서명 대기": "warning", "체결 완료": "success", 거부: "danger", 만료: "danger", 종료: "waiting" };

const REJECT_SAMPLE = "근무 요일이 채용 공고 내용과 달라 다시 확인을 요청합니다.";

const go = (id, toast) => ({ "data-go": id, "data-toast": toast });
const back = (id) => ({ "data-go": id, "data-dir": "nav-back" });

// ── 계약서 본문 ── 조항 열 가지, 정직원용·파트타이머용이 같은 구성이고 값만 다르다(목업 그대로).
const PART_TIME = {
  kind: "근로계약서 · 파트타이머용",
  term: "2026년 9월 15일부터 2027년 3월 14일까지로 한다.",
  place: "웨일카페 강남역점에서 매장 판매 및 음료 제조 업무를 한다.",
  hours: [
    ["수요일", "10:00", "15:30", "30분", "5시간"],
    ["금요일", "10:00", "15:30", "30분", "5시간"],
    ["토요일", "10:00", "15:30", "30분", "5시간"],
  ],
  wage: "시급 10,320원으로 한다. 임금은 매월 10일에 본인 명의 계좌로 지급하고, 지급일이 휴일이면 전날 지급한다. 1주 소정근로시간이 15시간 이상이고 그 주 소정근로일을 개근하면 주휴수당을 지급한다.",
};

const FULL_TIME = {
  kind: "근로계약서 · 정직원용",
  term: "2026년 3월 1일부터 기간의 정함이 없는 것으로 한다.",
  place: "웨일카페 홍대점에서 매장 운영 및 재고관리 업무를 한다.",
  hours: [
    ["월–금", "09:00", "18:00", "60분", "8시간"],
    ["토·일", "—", "—", "—", "휴무"],
  ],
  wage: "월급 2,400,000원으로 한다. 임금은 매월 25일에 본인 명의 계좌로 지급하고, 지급일이 휴일이면 전날 지급한다.",
};

// 노무사 검토 중인 조항(CON-6 · CON-7). 경고색 점선 밑줄로 「문구 확정 전」을 표시한다.
const pending = (article) =>
  `<p class="text-staff-text-muted"><strong>${article}</strong> <span class="border-b border-dashed border-staff-warning">문구 확정 전</span> — 노무사 검토 중입니다.</p>`;

// CON-1: 화면에 직접 그린다. 글꼴은 앱 글꼴(Pretendard) 그대로다(2026-10-08 명조체에서 바꿈). 줄 간격만 읽기용으로 넓힌다.
const contractDocument = ({ kind, term, place, hours, wage }) =>
  `<section class="rounded-[16px] border border-staff-border-light bg-white p-[16px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">${kind}</h2><div class="flex flex-col gap-[6px] pt-[8px] text-[14px] leading-[1.85] [&_strong]:font-bold"><p><strong>제1조(근로계약기간)</strong> ${term}</p><p><strong>제2조(근무장소와 업무)</strong> ${place}</p><p><strong>제3조(소정근로시간)</strong> 요일별 근로시간은 아래와 같다.</p><table class="w-full border-collapse text-[13px]"><thead><tr class="border-b border-staff-border-light text-staff-text-muted">${["요일", "시업", "종업", "휴게"]
    .map((h) => `<th class="py-[4px] text-left font-medium">${h}</th>`)
    .join("")}<th class="py-[4px] text-right font-medium">근로</th></tr></thead><tbody>${hours
    .map((row) => `<tr>${row.map((cell, i) => `<td class="py-[5px] ${i === 4 ? "text-right" : ""}">${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table><p>세부 근무일정은 근무스케줄로 정한다.</p>${pending("제4조(휴일)")}<p><strong>제5조(임금)</strong> ${wage}</p><p><strong>제6조(연장·야간·휴일 가산)</strong> 연장·야간·휴일근로에 대해서는 근로기준법에서 정한 바에 따라 가산하여 지급한다. <span class="text-staff-text-muted">— 문구는 노무사 검토 중(PAY-5)</span></p>${pending(
    "제7조(연차유급휴가)",
  )}<p><strong>제8조(사회보험)</strong> 사회보험 가입은 다음과 같다. 국민연금·건강보험 — 가입 / 고용보험·산재보험 — 가입. <span class="text-staff-text-muted">— 문구는 노무사 검토 중(PAY-5)</span></p><p><strong>제9조(계약서 교부)</strong> 사용자는 계약을 체결하면 곧바로 계약서를 근로자에게 교부한다. 근로자는 직원 근무 앱에서 처리 완료본을 내려받을 수 있다.</p><p><strong>제10조(기타)</strong> 이 계약에 정하지 않은 사항은 근로기준법령에 따른다.</p></div></section>`;

// 종이 계약의 올라온 파일 한 줄. 「받기」는 누르는 칸 44px.
const fileRow = ({ name, tag, meta, toast }) =>
  `<div class="flex items-center gap-[12px]"><span class="flex text-staff-error">${maskIcon("contract.svg", 22)}</span><div class="flex min-w-0 flex-1 flex-col gap-[2px]"><p class="flex items-center gap-[6px] text-[14px] font-semibold">${name}${badge(
    "plain",
    tag,
  )}</p><p class="text-[12px] break-all text-staff-text-muted">${meta}</p></div><button type="button" data-toast="${toast}" class="h-[44px] shrink-0 rounded-[12px] px-[12px] text-[14px] font-semibold text-staff-text-sub transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive">받기</button></div>`;

// 시각 블록: 라벨 13px semibold · Clock 42px bold.
const clock = (label, time) =>
  `<section class="flex flex-col items-center text-center"><h2 class="text-[13px] font-semibold text-staff-text-sub">${label}</h2><p class="text-[42px] leading-[1.1] font-bold">${time}</p></section>`;

// 필기 서명(CON-2)의 서명란(signature-pad.tsx). 비어 있으면 점선 테두리와 안내 글, 그리면 실선 흰 바탕(목업 sign · sign-drawn). 높이 190 · radius 12.
// 그리기·견본 서명·지우기는 assets/staff.js.
const signaturePad = (drawn) =>
  `<div class="relative h-[190px] w-full overflow-hidden rounded-[12px] border-[1.5px] transition-[background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
    drawn ? "border-solid border-staff-border-light bg-white" : "border-dashed border-staff-placeholder bg-staff-info-bg"
  }">${
    drawn
      ? ""
      : `<span aria-hidden="true" class="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-staff-text-muted">여기에 손가락으로 서명</span>`
  }<canvas role="img" aria-label="${drawn ? "서명란 · 서명함" : "서명란 · 비어 있음. 손가락으로 서명합니다"}" class="relative block size-full cursor-crosshair touch-none text-staff-text"></canvas></div>`;

const detailBody = () =>
  `${body(
    // 남은 기한 7일 이내라 머리 카드가 강조색이다(CON-4). 상태 칩 지각·긴급 색(#FFF6E5 · #956013).
    `<section class="flex items-center gap-[12px] rounded-[16px] bg-[#fff6e5] p-[16px]"><span class="flex text-[#956013]">${maskIcon(
      "contract.svg",
      18,
    )}</span><div class="flex min-w-0 flex-1 flex-col gap-[2px]"><p class="text-[15px] font-bold">웨일카페 강남역점 · 파트타이머</p><p class="text-[12px] font-semibold text-[#956013]">날인 기한 2026-09-12 · 남은 기한 2일</p></div>${badge(
      "warning",
      "서명 대기",
    )}</section>${contractDocument(PART_TIME)}${tiny(
      "연장·야간·휴일 가산을 적용할지는 계약서가 아니라 <b>급여명세서마다 관리자가 정합니다.</b> 상시근로자 5인 미만 여부는 직원이 아니라 사업장의 사실이고 달마다 바뀔 수 있기 때문입니다. 계약서에는 법에 따라 가산한다는 일반 문구만 둡니다.",
    )}${sunken(
      values([
        ["성명", "김민서"],
        ["생년월일", "1999-04-12"],
        ["휴대전화", "010-****-5521"],
        ["주소", "서울 강남구 역삼로 12 (가입 시 입력)"],
      ]),
      { prose: true, label: "가입 때 넣은 계정 정보" },
    )}${tiny("날인 또는 거부하면 담당 관리자에게 이메일과 운영 알림함 알림이 함께 생성됩니다.")}`,
    { variant: "detail" },
  )}${dock(button("날인하기", go("sign")) + button("거부하기", { variant: "ghost", "data-open": "reject" }), 30)}`;

const signBody = (drawn) =>
  `${body(
    `<div class="flex flex-col gap-[6px]"><h2 class="text-[22px] font-bold">서명란에 서명해 주세요</h2><p class="text-[14px] text-staff-text-sub">손가락으로 서명하면 날인이 됩니다. 확정한 뒤에는 되돌릴 수 없습니다.</p></div>${signaturePad(
      drawn,
    )}${sunken(
      values([
        ["대상 계약", "웨일카페 강남역점 · 파트타이머"],
        ["서명하는 사람", "김민서"],
      ]),
    )}`,
    { variant: "detail" },
  )}${dock(
    // 그리기와 확정을 두 번에 나눈다(CON-2). 그리기 전에는 날인 확정이 꺼져 있다.
    // 다시 그리기는 같은 화면이라 슬라이드 없이 주소만 바꾼다(data-redraw, contract.js).
    drawn
      ? button("날인 확정", go("signed", "날인을 등록했습니다")) + button("다시 그리기", { variant: "ghost", "data-redraw": true })
      : button("날인 확정", { disabled: true }) + button("계약서로 돌아가기", { variant: "ghost", ...back("detail") }),
    30,
  )}`;

const VIEWS = {
  list: () =>
    body(
      `<ul class="flex flex-col divide-y divide-staff-border-light overflow-hidden rounded-[16px] border border-staff-border-light bg-white">${CONTRACTS.map(
        (c) =>
          // 기한 7일 이내: 상태 칩 지각·긴급 글자색(#956013)
          `<li><button type="button" data-go="${c.to}" class="flex min-h-[44px] w-full items-center gap-[12px] p-[16px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"><span class="flex min-w-0 flex-1 flex-col gap-[2px]"><span class="truncate text-[15px] font-semibold">${c.title}</span><span class="text-[12px] ${
            c.urgent ? "font-semibold text-[#956013]" : "text-staff-text-muted"
          }">${c.sub}</span></span>${badge(STATUS_TONE[c.status], c.status)}<span class="flex text-staff-placeholder">${maskIcon("chevron-right-small.svg", 12)}</span></button></li>`,
      ).join("")}</ul>${tiny(
        "날인 기한은 발송일로부터 30일입니다. 서명 대기를 위로 올리고 그중 기한이 급한 것을 먼저 보여줍니다. 남은 기한이 7일 이내면 강조색으로 표시합니다.",
      )}`,
      { variant: "detail" },
    ),

  detail: detailBody,
  sign: () => signBody(false),
  "sign-drawn": () => signBody(true),

  signing: () =>
    `${body(
      `<div class="flex flex-col gap-[6px]"><h2 class="text-[22px] font-bold">요청을 처리하는 중입니다</h2><p class="text-[14px] text-staff-text-sub">처리가 끝날 때까지 화면을 벗어나지 마세요. 처리하는 동안 날인과 거부 버튼은 눌리지 않습니다.</p></div>${sunken(
        values([["대상 계약", "웨일카페 강남역점 · 파트타이머"]]),
      )}`,
      { variant: "detail", center: true },
    )}${dock(button("날인하기", { disabled: true }) + button("거부하기", { variant: "ghost", disabled: true }), 30)}`,

  signed: () =>
    `${body(
      `${seal("날인<br>완료", "success")}${clock("날인 기록", "14:07")}${sunken(
        values([
          ["근무지", "웨일카페 강남역점"],
          ["고용 형태", "파트타이머"],
          ["계약 기간", "2026-09-15 ~ 2027-03-14"],
        ]),
      )}${notice(
        "이제 <strong>신고 정보</strong>를 넣을 차례입니다. 4대보험·원천징수에 쓸 주민등록번호와 급여가 들어갈 계좌를 받습니다.",
        maskIcon("contract.svg", 14),
      )}${tiny("담당 관리자에게 이메일과 운영 알림함 알림이 함께 생성됩니다. 계약 내용을 바꾸려면 관리자에게 재발송을 요청해야 합니다.")}`,
      { variant: "detail", center: true },
    )}${dock(
      // 목업 tax.html 첫 상태 「안내 · 날인 직후」
      button("신고 정보 넣기", { href: page("tax", "intro") }) +
        button("완료본 내보내기", { variant: "outline", "data-toast": "처리 완료본 PDF 를 공유합니다" }) +
        `<p class="py-[2px] text-center text-[12px] text-staff-text-muted">이 단계를 마쳐야 앱을 쓸 수 있습니다</p>`,
      30,
    )}`,

  readonly: () =>
    `${body(
      `${notice(
        "<strong>이미 처리가 끝난 계약서입니다.</strong><br>다시 날인하거나 거부할 수 없습니다. 계약 내용을 바꾸려면 관리자가 새 계약을 발송해야 합니다.",
      )}<section class="flex items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-white p-[16px]"><div class="flex min-w-0 flex-1 flex-col gap-[2px]"><p class="text-[15px] font-bold">웨일카페 홍대점 · 정직원</p><p class="text-[12px] text-staff-text-muted">날인 2026-08-23 · 발송 2026-08-01</p></div>${badge(
        "success",
        "체결 완료",
      )}</section>${contractDocument(FULL_TIME)}`,
      { variant: "detail" },
    )}${dock(
      button("완료본 내보내기", { variant: "outline", "data-toast": "처리 완료본 PDF 를 공유합니다" }) + button("목록으로", { variant: "ghost", ...back("list") }),
      30,
    )}`,

  paper: () =>
    `${body(
      `${notice("<strong>종이로 맺은 계약입니다.</strong><br>이미 종이에 날인한 계약서를 관리자가 올렸습니다. 앱에서 날인할 것은 없습니다.")}${sunken(
        values([
          ["근무지", "웨일카페 홍대점"],
          ["고용 형태", "파트타이머"],
          ["계약 기간", "2026-04-01 ~ 2027-03-31"],
          ["등록", "2026-04-02 · 관리자"],
        ]),
      )}<section class="flex flex-col gap-[8px] rounded-[16px] border border-staff-border-light bg-white p-[16px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">올라온 파일</h2>${fileRow(
        {
          name: "근로계약서 날인본",
          tag: "필수",
          meta: "근로계약서_홍대점_김하은.pdf · PDF · 2장 · 1.4MB",
          toast: "근로계약서 날인본을 내려받습니다",
        },
      )}${fileRow({
        name: "임금계약서",
        tag: "선택",
        meta: "임금계약서_홍대점_김하은.pdf · PDF · 1장 · 0.6MB",
        toast: "임금계약서를 내려받습니다",
      })}${tiny("임금계약서는 관리자가 따로 날인받아 첨부한 경우에만 보입니다. 파일을 누르면 원본을 봅니다.")}${tiny(
        "조항은 앱에서 그리지 않습니다. 관리자가 올린 파일이 원본입니다.",
      )}</section>`,
      { variant: "detail" },
    )}${dock(
      button("파일 모두 내보내기", { variant: "outline", "data-toast": "올라온 파일 두 개를 함께 공유합니다" }) + button("목록으로", { variant: "ghost", ...back("list") }),
      30,
    )}`,

  // 거부 사유 칸은 처음엔 견본, 거부 확정으로 왔으면 적은 사유(비었으면 「사유를 남기지 않았습니다.」)를 contract.js 가 넣는다.
  rejected: () =>
    `${body(
      `${seal("거부<br>완료", "danger")}${clock("거부 처리", "14:11")}${sunken(REJECT_SAMPLE, { prose: true, label: "거부 사유" })}${tiny(
        "담당 관리자에게 이메일과 운영 알림함 알림이 함께 생성됩니다. 관리자가 계약서를 다시 보내야 새로 처리할 수 있습니다.",
      )}`,
      { variant: "detail", center: true },
    )}${dock(button("홈으로", { variant: "ghost", href: page("home") }), 30)}`,

  empty: () =>
    `${body(
      `<div class="flex flex-col items-center gap-[8px] pt-[52px]"><span class="flex text-staff-placeholder">${maskIcon(
        "contract.svg",
        30,
      )}</span><h2 class="pt-[6px] text-[18px] font-bold">받은 근로계약서가 없습니다</h2><p class="text-[14px] text-staff-text-muted">계약서가 발송되면 이 화면과 알림함에서 확인할 수 있습니다.<br>계약서를 받지 못했다면 담당 관리자에게 문의해 주세요.</p></div>`,
      { variant: "detail", center: true },
    )}${dock(button("관리자에게 문의하기", { variant: "outline", "data-toast": "관리자에게 문의를 보냈습니다" }), 30)}`,

  expired: () =>
    `${body(
      // 목업 note--amber. 상태 칩 지각·긴급 색(#FFF6E5 · #956013).
      `<p class="rounded-[12px] bg-[#fff6e5] p-[14px] text-[13px] text-[#956013] [&_strong]:font-bold"><strong>날인 기한이 지나 계약이 만료되었습니다.</strong><br>발송일로부터 30일 안에 날인해야 합니다.</p><section class="flex items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-white p-[16px]"><span class="flex text-staff-placeholder">${maskIcon(
        "contract.svg",
        18,
      )}</span><div class="flex min-w-0 flex-1 flex-col gap-[2px]"><p class="text-[15px] font-bold">웨일카페 홍대점 · 파트타이머</p><p class="text-[12px] text-staff-text-muted">발송 2026-07-01 · 기한 2026-07-31</p></div>${badge(
        "danger",
        "만료",
      )}</section>${sunken("다시 처리하려면 관리자가 계약서를 재발송해야 합니다. 재발송되면 새 날인 기한을 알림으로 안내받습니다.", { prose: true })}`,
      { variant: "detail" },
    )}${dock(button("목록으로", { variant: "ghost", ...back("list") }), 30)}`,
};

// 거부 사유는 선택이다(CON-3). 사유 없이도 거부 확정을 누를 수 있다.
// 목업 btn--seal(빨강). 되돌릴 수 없는 확정이라 오류색이다.
const rejectSheet = (a = {}) =>
  bottomSheet(
    "reject",
    {
      title: "근로계약서 거부",
      description: "거부하면 이 계약은 거부 상태로 확정됩니다. 다시 처리하려면 관리자가 계약서를 재발송해야 합니다.",
      ...a,
    },
    `<label class="flex flex-col gap-[8px]"><span class="text-[13px] font-semibold text-staff-text-sub">거부 사유 <span class="font-medium text-staff-placeholder">(선택)</span></span><textarea rows="3" placeholder="예: 근무 요일이 안내받은 내용과 다릅니다" class="min-h-[76px] w-full resize-y rounded-[12px] border border-staff-border bg-white px-[14px] py-[12px] text-[16px] text-staff-text outline-none! transition-[border-color] duration-150 ease-out placeholder:text-staff-placeholder focus:border-staff-primary"></textarea><span class="text-[12px] text-staff-text-muted">사유를 남기면 관리자가 재발송 여부를 판단하는 데 참고합니다.</span></label>${dangerButton(
      "거부 확정",
      { ...go("rejected", "거부를 등록했습니다"), "data-close": true },
    )}`,
  );

function screen(id) {
  const view = id === "reject" ? "detail" : id;
  const b = BACK[view];
  const head = view === "list" || view === "empty" ? pageHeader("근로계약", { backHref: page("home") }) : b ? backHeader("근로계약", b) : "";
  // 상세의 거부하기는 같은 시트를 연다. 거부 사유 상태는 상세를 깔고 시트를 바로 띄운다(닫으면 상세로).
  const sheet = id === "reject" ? rejectSheet({ "data-sheet-auto": true, "data-on-close": "#detail" }) : id === "detail" ? rejectSheet() : "";
  return `<main class="flex flex-1 flex-col leading-[1.5]">${head}${VIEWS[view]()}</main>${sheet}`;
}

export default () => ({
  title: "근로계약",
  states: STATES,
  html: STATES.map((s) => state(s.id, screen(s.id))).join(""),
});
