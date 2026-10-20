// 직원 근무 앱 데모 · 출퇴근 등록. 옛 React 판 src/app/demo/check-in(page.tsx · geo-map.tsx)을 옮겼다.
// 기준 목업: docs/mockup/app/attendance.html — 상태 11개와 시트 8개, 화면 문구·가짜 값·버튼의 이동(data-go)·알림(data-toast).
// 확정 쟁점: GPS 판정 — 휴대전화에서 판정하고 좌표는 보내지 않는다(ATT-1·5) · 근무지 반경 100m(ATT-2) · 위치 권한 꺼짐은 등록 불가(ATT-3) ·
// 위치 오차는 따로 판정하지 않는다(ATT-4, 2026-10-20) · 출퇴근은 앱에서 고른 근무지로만, 이 화면에서 근무지를 고르거나 자동으로 바꾸지 않음(ATT-6, 운영 정책 ATT-07, 2026-10-20) · 퇴근만 확인 시트(ATT-9) ·
// 퇴근 되돌리기 없음(ATT-10) · 반경 밖도 출근·퇴근 모두 확인 필요로(ATT-11, 2026-10-20) · 위치 조작 감지는 출근 막고 퇴근은 확인 필요(운영 정책 ATT-21) ·
// 위치정보 동의는 첫 출근 등록 때 필수, 거부·철회 시 「근무지 관리자에게 문의」(운영 정책 ATT-06·20) · 일시 중지 중엔 대신 등록 안내,
// 「다시 켜기」로 재동의 없이 복귀(운영 정책 ATT-26) · 등록 화면의 「○○점 관리자가 확인합니다」 한 줄(운영 정책 ATT-25).
// 동의 문구는 법무 검토 중이라(ATT-8) 시트에 그대로 적었다.
// 모양: 매장 안(ready)은 Figma 04.출퇴근(node 12:756)을 따른다. 나머지 상태와 시트는 Figma 없음 — DESIGN.md 기준 초안.
// 목업과 다른 점: 퇴근하기는 목업의 테두리 버튼 대신 DESIGN.md 의 주 버튼이다. 하단 메뉴 「출퇴근」 칸 화면이다(2026-10-08 다섯 칸).
import { alert, body, bottomNav, bottomSheet, button, dock, img, maskIcon, page, pageHeader, state, sunken, values, workTimeBar } from "../../ui.mjs";

// 목업 오른쪽 목록 순서 그대로. 뒤 아홉은 목업의 「시트 열기」라 SHEET_BASE 의 화면 위에 시트를 띄운다.
const STATES = [
  { id: "ready", label: "매장 안", note: "출근 가능" },
  { id: "working", label: "근무 중", note: "퇴근 가능" },
  { id: "done", label: "퇴근 완료", note: "기록 확정" },
  { id: "far-out", label: "근무 중 · 범위 밖", note: "퇴근만 가능" },
  { id: "far", label: "매장 범위 밖", note: "확인 필요로 출근" },
  { id: "denied", label: "위치 권한 없음", note: "등록 불가" },
  { id: "spoof", label: "위치 조작 감지 · 출근", note: "막음" },
  { id: "spoof-out", label: "위치 조작 감지 · 퇴근", note: "확인 필요로 받음" },
  { id: "paused", label: "위치 수집 일시 중지", note: "다시 켜기로 복귀" },
  { id: "no-consent", label: "위치정보 동의 없음", note: "관리자에게 문의" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "consent", label: "위치정보 동의", note: "첫 등록 때 · v1.2" },
  { id: "byespoof", label: "위치 조작 퇴근 확인", note: "확인 필요" },
  { id: "bye", label: "퇴근 확인", note: "한 번 더 묻기" },
  { id: "hifar", label: "범위 밖 출근 확인", note: "240m" },
  { id: "byefar", label: "범위 밖 퇴근 확인", note: "240m" },
  { id: "dup", label: "이미 출근함", note: "열린 출근이 있을 때" },
  { id: "nopunch", label: "출근 기록 없음", note: "퇴근만 찍을 때" },
  { id: "nocontract", label: "계약 미체결", note: "서명 대기 계약 있음" },
  { id: "noperiod", label: "계약 기간 아님", note: "시작 전·종료 후·계약 없음" },
];
const SHEET_BASE = {
  consent: "ready",
  byespoof: "spoof-out",
  bye: "working",
  hifar: "far",
  byefar: "far-out",
  dup: "ready",
  nopunch: "ready",
  nocontract: "ready",
  noperiod: "ready",
};
// 화면에서 버튼으로 여는 시트
const VIEW_SHEETS = { far: ["hifar"], ready: ["dup"], working: ["bye"], "far-out": ["byefar"], "spoof-out": ["byespoof"] };

// 운영 정책 ATT-25: 등록 화면마다 받는 사람·목적을 알리는 한 줄.
const ADMIN_NOTE = "출퇴근 기록은 근태 확인을 위해 강남역점 관리자가 확인합니다.";

const go = (id, toast) => ({ "data-go": id, "data-toast": toast });
const ghost = (label, a = {}) => button(label, { variant: "ghost", ...a });
const arrow = () => img("arrow-right.svg", 14, 12);

// ── 지도(geo-map.tsx). Figma 04.출퇴근 지도(node 12:948)와 같은 가짜 그림. out 은 DESIGN.md 기준 초안 ──
const geoMap = (tone, caption) => {
  const label = { in: "매장 반경 안의 내 위치", out: "매장 반경 밖의 내 위치" }[tone];
  return `<div role="img" aria-label="${label}. ${caption}" class="relative h-[205px] w-full shrink-0 overflow-clip rounded-[18px] border border-[#e1ebec] bg-[#eef3f7] bg-[linear-gradient(#e1ebec_1px,transparent_1px),linear-gradient(90deg,#e1ebec_1px,transparent_1px)] bg-[size:44.64px_41.25px] bg-position-[-1px_-1px]">${img(
    "map-road-1.svg",
    164,
    205.5,
    "absolute top-[-0.5px] left-[calc(50%-116px)]",
  )}${img("map-road-2.svg", 364, 136.5, "absolute top-[62.5px] left-[-1px] h-[136.5px] w-[calc(100%+6px)] max-w-none")}<div class="absolute top-[36.5px] left-[calc(50%-27px)] size-[130px] rounded-full border border-dashed ${
    tone === "out" ? "border-[#b6c1d5] bg-[rgba(182,193,213,0.12)]" : "border-[rgba(49,93,245,0.44)] bg-[rgba(49,93,245,0.07)]"
  }"></div><div class="absolute top-[79.5px] left-[calc(50%+16px)] rounded-[14px] bg-white p-[12px] drop-shadow-[0_4px_8px_rgba(25,48,101,0.08)] ${tone === "out" ? "opacity-60" : ""}">${img(
    "store.svg",
    20,
    20,
    "-scale-y-100",
  )}</div>${
    tone === "in"
      ? `<div class="absolute top-[115.84px] left-[calc(50%+55.44px)] size-[15px] rounded-full border-2 border-white bg-staff-primary shadow-[0_0_0_5px_rgba(31,63,122,0.2)]"></div>`
      : ""
  }${
    tone === "out"
      ? `<div class="absolute top-[24px] left-[calc(50%+120px)] size-[15px] rounded-full border-2 border-white bg-[#f59e0b] shadow-[0_0_0_5px_rgba(245,158,11,0.22)]"></div>`
      : ""
  }<p class="absolute bottom-[13px] left-[13px] rounded-[8px] border border-[#e4e8ef] bg-white/93 px-[10px] py-[6px] text-[12px] leading-[1.5] text-staff-text-sub">${caption}</p></div>`;
};
// 위치를 읽지 못하거나 읽지 않는 상태의 빈 지도 자리. 격자를 지우고 가운데에 아이콘과 한 줄만 둔다.
const geoBlank = (iconClass, text) =>
  `<div class="flex h-[205px] w-full shrink-0 flex-col items-center justify-center gap-[8px] rounded-[18px] border border-[#e1ebec] bg-[#eef3f7]"><span class="flex ${iconClass}">${maskIcon(
    "pin.svg",
    30,
    true,
  )}</span><p class="text-[12px] text-staff-text-muted">${text}</p></div>`;

// 근무지 카드(Figma node 12:957): 연한 남보라. 근무 중 카드도 같은 판 — 남보라는 「지금 근무 중」이다.
const siteCard = (title, sub, action = "") =>
  `<section class="flex items-center gap-[8px] rounded-[18px] border border-[#dce4ff] bg-[#eef2ff] p-[20px]">${img(
    "pin.svg",
    14,
    16,
    "-scale-y-100",
  )}<div class="flex min-w-0 flex-1 flex-col gap-[2px]"><p class="truncate text-[16px] font-bold">${title}</p><p class="text-[12px] text-staff-primary">${sub}</p></div>${action}</section>`;

// 시각 블록: 라벨 13px semibold · 42px bold. dim 은 출근할 수 없는 상태라 흐린 글자.
const clock = (label, time, { note, dim = false } = {}) =>
  `<section class="flex flex-col items-center py-[14px] text-center"><h2 class="text-[13px] font-semibold text-staff-text-sub">${label}</h2><p class="text-[42px] leading-[1.1] font-bold ${dim ? "text-staff-placeholder" : ""}">${time}</p>${
    note ? `<p class="pt-[30px] text-[12px] text-staff-text-sub">${note}</p>` : ""
  }</section>`;

// 근무 경과: 단위만 17px.
const elapsed = () =>
  `<section class="flex flex-col items-center py-[14px] text-center"><h2 class="text-[13px] font-semibold text-staff-text-sub">근무 경과</h2><p class="text-[42px] leading-[1.1] font-bold">6<span class="text-[17px]">시간 </span>41<span class="text-[17px]">분</span></p><p class="pt-[4px] text-[12px] text-staff-text-sub">현재 시각 15:43</p></section>`;

// 퇴근 시트의 출근 시각 · 지금까지.
const punchSummary = () =>
  sunken(
    values([
      ["출근", "09:02"],
      ["지금까지", "6시간 41분"],
    ]),
  );

const VIEWS = {
  ready: () =>
    body(
      geoMap("in", "오차 ±12m · 매장까지 18m") +
        siteCard("웨일카페 강남역점", "매장 범위 안에 있습니다") +
        // 오늘 예정 근무(Figma node 12:957 아래 카드)
        `<section class="flex flex-col gap-[7px] rounded-[18px] border border-staff-border-light bg-white p-[20px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">오늘 예정 근무</h2><div class="flex items-center gap-[8px]"><p class="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.42px]">09:00 – 18:00</p><span class="rounded-[8px] bg-staff-info-bg px-[10px] py-[4px] text-[12px] font-semibold text-staff-text-sub">휴게 60분</span></div></section>` +
        clock("현재 시각", "08:52", { note: "기록 시각은 서버가 요청을 받은 때로 정해집니다" }),
      { variant: "detail" },
    ) +
    // 출근은 확인 없이 바로 기록한다(ATT-9 · 운영 정책 ATT-13).
    dock(button(`출근하기${arrow()}`, go("working", "출근을 등록했습니다")) + ghost("이미 출근한 상태로 눌러 보기", { "data-open": "dup" }), 30),

  working: () =>
    body(
      siteCard("근무 중", "09:02에 출근했습니다") +
        `<section class="flex flex-col gap-[9px] rounded-[18px] border border-staff-border-light bg-white p-[20px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">오늘</h2>${workTimeBar({
          schedule: { start: "09:00", end: "18:00" },
          worked: { start: "09:02", end: "15:43" },
          ongoing: true,
        })}<p class="text-[12px] text-staff-text-muted">점선은 예정, 채운 칠은 실제 기록입니다</p></section>` +
        elapsed() +
        `<p class="text-center text-[12px] text-staff-text-muted">${ADMIN_NOTE}</p>`,
      { variant: "detail" },
    ) + dock(button("퇴근하기", { "data-open": "bye" }), 30),

  done: () =>
    body(
      clock("퇴근 기록", "18:04") +
        sunken(
          values([
            ["근무지", "웨일카페 강남역점"],
            ["출근", "09:02"],
            ["근무 시간", "9시간 02분"],
          ]),
        ) +
        `<p class="text-[12px] text-staff-text-muted">기록이 저장되었습니다. ${ADMIN_NOTE}</p>`,
      { variant: "detail", center: true },
    ) + dock(ghost("홈으로", { href: page("home") }), 30),

  far: () =>
    body(
      geoMap("out", "오차 ±14m · 매장까지 240m") +
        alert(
          "warning",
          "<strong>매장에서 240m 떨어져 있습니다.</strong><br>이대로 출근하면 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다. 근무지가 맞는지 한 번 더 확인해 주세요.",
        ) +
        `<section class="flex flex-col rounded-[18px] border border-staff-border-light bg-white p-[20px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">근무지</h2><p class="pt-[6px] text-[16px] font-bold">웨일카페 강남역점</p><p class="pt-[3px] text-[12px] text-staff-text-muted">서울 강남구 테헤란로 1길</p></section>` +
        clock("현재 시각", "08:47", { dim: true }),
      { variant: "detail" },
    ) + dock(button("출근하기", { "data-open": "hifar" }) + ghost("위치 다시 확인", go("ready", "매장 범위 안입니다")), 30),

  "far-out": () =>
    body(
      geoMap("out", "오차 ±14m · 매장까지 240m") +
        siteCard("근무 중", "09:02에 출근했습니다") +
        alert("warning", "<strong>매장 범위 밖입니다.</strong><br>퇴근은 여기서도 등록할 수 있습니다. 다만 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다.") +
        elapsed(),
      { variant: "detail" },
    ) + dock(button("퇴근하기", { "data-open": "byefar" }) + ghost("위치 다시 확인", go("working", "매장 범위 안입니다")), 30),

  denied: () =>
    body(
      geoBlank("text-staff-placeholder", "위치를 확인할 수 없습니다") +
        alert("danger", "<strong>위치 권한이 꺼져 있습니다.</strong><br>출퇴근은 매장에 있는지를 위치로 확인합니다. 설정에서 위치 접근을 허용해 주세요.") +
        sunken("매장에 있는지를 위치로만 확인하기 때문에, 권한이 없으면 출퇴근을 등록할 수 없습니다. 설정에서 위치 접근을 허용한 뒤 다시 시도해 주세요.", {
          prose: true,
          label: "권한이 필요한 이유",
        }),
      { variant: "detail" },
    ) + dock(button("설정 열기", go("ready", "위치 권한을 켰습니다")), 30),

  spoof: () =>
    body(
      geoBlank("text-staff-error", "위치를 믿을 수 없습니다") +
        alert("danger", "<strong>모의 위치가 켜져 있습니다.</strong><br>모의 위치 설정이나 가상 위치 앱을 끄고 다시 시도하세요.") +
        sunken(
          "출근은 매장에 실제로 왔는지를 위치로만 확인합니다. 기기가 꾸며 낸 위치로는 그것을 확인할 수 없어 등록을 받지 않습니다. <b>퇴근은 막지 않습니다</b> — 이미 일한 사실이 있어 기록을 남기는 편이 낫고, 대신 확인 필요가 붙습니다.",
          { prose: true, label: "왜 막나요" },
        ),
      { variant: "detail" },
    ) + dock(button("출근하기", { disabled: true }) + ghost("껐습니다 · 다시 확인", go("ready", "모의 위치를 껐습니다")), 30),

  "spoof-out": () =>
    body(
      geoBlank("text-staff-warning", "위치를 믿을 수 없습니다") +
        siteCard("근무 중", "09:02에 출근했습니다") +
        alert("warning", "<strong>모의 위치가 켜져 있습니다.</strong><br>퇴근은 등록할 수 있습니다. 다만 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다.") +
        elapsed(),
      { variant: "detail" },
    ) + dock(button("퇴근하기", { "data-open": "byespoof" }), 30),

  paused: () =>
    body(
      geoBlank("text-staff-warning", "위치를 읽지 않습니다") +
        alert("warning", "<strong>잠시 멈춘 동안에는 앱으로 출퇴근을 등록할 수 없습니다.</strong><br>출퇴근 기록은 근무지 관리자에게 문의해 주세요.") +
        sunken("동의는 그대로 남아 있어 <b>새로 동의하지 않아도 됩니다.</b> 내 정보에서도 켤 수 있습니다. 2026년 9월 29일 14:20 부터 일시 중지 상태입니다.", {
          prose: true,
          label: "다시 켜면 바로 등록할 수 있습니다",
        }),
      { variant: "detail" },
    ) +
    // 목업 본문의 「내 정보에서도 켤 수 있습니다」를 눌러 가는 길. 위치정보 동의 관리는 내 정보(4장)에 있다.
    dock(button("다시 켜기", go("ready", "위치 수집을 다시 켰습니다")) + ghost("내 정보에서 관리", { href: page("me") }), 30),

  "no-consent": () =>
    body(
      geoBlank("text-staff-placeholder", "위치정보 동의가 없습니다") +
        alert("danger", "<strong>위치정보 이용에 동의하지 않으면 앱으로 출퇴근을 등록할 수 없습니다.</strong><br>출퇴근 기록은 근무지 관리자에게 문의해 주세요.") +
        sunken(
          "휴대전화 위치 권한은 설정에서 켜면 바로 등록할 수 있습니다. 여기는 <b>위치정보 수집 동의 자체를 하지 않았거나 철회한</b> 경우라, 설정을 바꿔도 앱에서는 등록되지 않습니다. 다시 동의하려면 근무지 관리자에게 말씀해 주세요.",
          { prose: true, label: "권한을 끈 것과 다릅니다" },
        ) +
        `<section class="flex flex-col gap-[8px] rounded-[18px] border border-staff-border-light bg-white p-[20px]"><h2 class="text-[13px] font-semibold text-staff-text-sub">기록은 이렇게 남습니다</h2><div class="flex gap-[8px] text-[13px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text"><span class="flex pt-[3px]">${maskIcon(
          "pencil.svg",
          14,
        )}</span><p class="min-w-0 flex-1">문의를 받은 관리자가 <b>대신 등록</b>하면 출퇴근 현황에 연필 표시로 보이고, 누르면 누가 언제 왜 등록했는지 볼 수 있습니다.</p></div></section>`,
      { variant: "detail" },
    ),


  nosite: () =>
    body(
      `<div class="flex flex-1 flex-col items-center justify-center gap-[8px] pt-[76px]"><span class="flex text-staff-placeholder">${maskIcon(
        "store.svg",
        30,
        true,
      )}</span><h2 class="pt-[6px] text-[18px] font-bold">근무지가 없습니다</h2><p class="max-w-[250px] text-[14px] text-staff-text-sub">연결된 근무지가 없어 출퇴근을 등록할 수 없습니다. 받은 급여명세서는 급여 탭에서 볼 수 있습니다.</p></div>`,
      { variant: "detail", center: true },
    ),
};

// ── 시트 ── 퇴근은 확인 시트를 한 번 거친다(ATT-9). 버튼 이름은 「퇴근 확정」과 「아직 아닙니다」.
// 시트 안에서 다른 상태로 옮기는 버튼은 data-close 를 함께 단다(시트를 닫고 그 상태로).
const close = (a = {}) => ({ ...a, "data-close": true });
const SHEETS = {
  bye: (a) =>
    bottomSheet(
      "bye",
      { title: "퇴근할까요", description: "퇴근을 등록하면 오늘 근무가 끝납니다. 뒤에 다시 출근하려면 새로 등록해야 합니다.", closeLabel: "아직 아닙니다", ...a },
      punchSummary() + button("퇴근 확정", close(go("done", "퇴근을 등록했습니다"))),
    ),
  // 범위 밖 출근(ATT-11, 2026-10-20 재영): 확인 필요로 받는다. 근무지 자동 선택이 없어(ATT-07) 출근할 근무지 이름을 크게 보인다.
  hifar: (a) =>
    bottomSheet(
      "hifar",
      {
        title: "매장 범위 밖에서 출근할까요",
        description: "이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다.",
        closeLabel: "아직 아닙니다",
        ...a,
      },
      sunken(
        `<p class="text-[16px] font-bold">웨일카페 강남역점</p><p class="pt-[3px] text-[12px] text-staff-text-muted">근무지가 다르면 닫고 홈이나 근무 정보에서 바꿔 주세요</p>`,
        { label: "출근할 근무지", prose: true },
      ) +
        alert("warning", "매장까지 240m · 범위 100m 밖입니다") +
        button("출근 확정", close(go("working", "확인 필요로 출근을 등록했습니다"))),
    ),
  byefar: (a) =>
    bottomSheet(
      "byefar",
      {
        title: "매장 범위 밖에서 퇴근할까요",
        description: "이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다. 퇴근을 등록하면 오늘 근무가 끝납니다.",
        closeLabel: "아직 아닙니다",
        ...a,
      },
      punchSummary() + alert("warning", "매장까지 240m · 범위 100m 밖입니다") + button("퇴근 확정", close(go("done", "확인 필요로 퇴근을 등록했습니다"))),
    ),
  byespoof: (a) =>
    bottomSheet(
      "byespoof",
      {
        title: "확인 필요로 퇴근할까요",
        description:
          "모의 위치가 켜져 있어 지금 위치를 믿을 수 없습니다. 이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다. 퇴근을 등록하면 오늘 근무가 끝납니다.",
        closeLabel: "아직 아닙니다",
        ...a,
      },
      punchSummary() + alert("warning", "확인 필요 사유 · 위치 조작 감지") + button("퇴근 확정", close(go("done", "확인 필요로 퇴근을 등록했습니다"))),
    ),
  // 위치정보 동의(운영 정책 ATT-06): 서비스 약관과 따로, 첫 출근 등록 때 필수. 닫기는 다음에 정하는 것이고 거부는 「동의하지 않음」이다.
  consent: (a) =>
    bottomSheet(
      "consent",
      { title: "위치정보 수집에 동의해 주세요", ...a },
      `<p class="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">출퇴근을 등록할 때 <b>매장 안인지</b>를 위치로 확인합니다. <b>위치는 휴대전화 안에서만 확인하고 서버로 보내지 않습니다.</b> 기록에는 <b>출퇴근 시각만</b> 남고 위치와 판정 결과는 남지 않습니다.</p>${sunken(
        values([
          ["쓰는 곳", "출퇴근 등록 판정"],
          ["남기는 것", "출퇴근 시각만 · 위치와 판정 결과는 남기지 않음"],
          ["동의 철회", "내 정보에서 언제든"],
        ]),
      )}<p class="text-[12px] font-bold text-staff-text-sub">동의해야 앱으로 출퇴근을 등록할 수 있습니다.</p><p class="text-[12px] text-staff-text-sub">서비스 약관과 따로 받는 동의입니다. 동의하지 않으면 출퇴근 기록을 근무지 관리자에게 문의해야 합니다. <span class="text-staff-text-muted">위치정보 수집·이용 동의 v1.2</span></p><p class="text-[12px] text-staff-text-muted">동의서 항목·문구는 법무 검토 중(ATT-8)</p>${button(
        "동의합니다",
        close({ "data-toast": "위치정보 수집에 동의했습니다" }),
      )}${ghost("동의하지 않음", close({ "data-go": "no-consent" }))}`,
    ),
  dup: (a) =>
    bottomSheet(
      "dup",
      { title: "이미 출근해 있습니다", description: "오늘 09:02에 웨일카페 강남역점으로 출근한 기록이 열려 있습니다. 퇴근을 먼저 등록해 주세요.", ...a },
      sunken(values([["열린 출근", "09:02"]])) + button("퇴근하러 가기", close({ "data-go": "working" })),
    ),
  nopunch: (a) =>
    bottomSheet(
      "nopunch",
      {
        title: "출근 기록이 없습니다",
        description: "퇴근은 열려 있는 출근 기록이 있어야 등록할 수 있습니다. 오늘 출근을 찍지 않았다면 관리자에게 알려 주세요.",
        ...a,
      },
      sunken("관리자는 최근 3개월 안의 기록을 수정할 수 있습니다.", { prose: true }) + button("관리자에게 알리기", close({ "data-toast": "관리자에게 알렸습니다" })),
    ),
  // 경고 판: 상태 칩의 지각·긴급 색(#FFF6E5 · #956013). 카드 전체가 계약서로 가는 링크.
  nocontract: (a) =>
    bottomSheet(
      "nocontract",
      {
        title: "근로계약을 체결해야 출근할 수 있습니다",
        description: "오늘 날짜가 들어간 체결 완료 근로계약이 있어야 출퇴근을 등록할 수 있습니다. 받은 계약서를 날인하면 바로 출근할 수 있습니다.",
        ...a,
      },
      `<a href="${page("contract")}" class="flex min-h-[52px] items-center gap-[12px] rounded-[12px] bg-[#fff6e5] p-[14px] text-[#956013]"><span class="min-w-0 flex-1"><span class="block text-[14px] font-semibold">근로계약서 1건 대기</span><span class="block text-[12px]">남은 기한 26일</span></span>${maskIcon(
        "chevron-right-small.svg",
        12,
      )}</a>${button("계약서 보기", { href: page("contract") })}`,
    ),
  noperiod: (a) =>
    bottomSheet(
      "noperiod",
      { title: "오늘은 근로계약 기간이 아닙니다", description: "오늘 날짜가 들어간 체결 완료 근로계약이 있어야 출퇴근을 등록할 수 있습니다.", ...a },
      sunken("근무지 관리자에게 문의해 주세요.", { prose: true }),
    ),
};

const view = (id) => {
  const base = SHEET_BASE[id];
  const v = base ?? id;
  // 시트 상태는 그 시트를 바로 열고, 어느 시트든 닫으면 바탕 화면 상태로 돌아간다.
  const names = [...new Set([...(VIEW_SHEETS[v] ?? []), ...(base ? [id] : [])])];
  const sheets = names.map((n) => SHEETS[n](base ? { "data-sheet-auto": n === id, "data-on-close": `#${base}` } : {})).join("");
  const header =
    v === "done"
      ? ""
      : pageHeader("출퇴근", {
          backHref: page("home"),
          action: `<a href="${page("attendance")}" aria-label="출퇴근 현황" class="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">${img("history.svg", 21, 21, "-scale-y-100")}</a>`,
        });
  return `<main class="flex flex-1 flex-col leading-[1.5]">${header}${VIEWS[v]()}</main><div class="sticky bottom-0 mt-auto">${bottomNav("check-in")}</div>${sheets}`;
};

export default () => ({
  title: "출퇴근 등록",
  states: STATES,
  html: STATES.map((s) => state(s.id, view(s.id))).join(""),
});
