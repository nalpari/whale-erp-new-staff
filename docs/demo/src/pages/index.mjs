// 데모 입구(옛 src/app/demo/page.tsx). 화면마다 링크를 건다. 링크가 없으면 「준비 중」으로 보인다.
import { brandLogo, notice, page } from "../ui.mjs";

const CHAPTERS = [
  {
    title: "1 · 로그인·가입",
    screens: [
      { name: "로그인", href: "login", desc: "이메일 찾기 · 비밀번호 재설정 · 잠금 5분" },
      { name: "가입", href: "join", desc: "초대 코드 · 초대 확인 · 계정 등록 · 가입 불가" },
    ],
  },
  {
    title: "2 · 홈·근무·출퇴근",
    screens: [
      { name: "홈", href: "home", desc: "오늘의 근무 · 날인 요청 팝업" },
      { name: "근무", href: "work", desc: "근무스케줄 · TO-DO" },
      { name: "출퇴근 등록", href: "check-in", desc: "GPS 판정 · 확인 필요 · 위치정보 동의 · 일시 중지" },
      { name: "출퇴근 현황", href: "attendance", desc: "이번 주 · 기간별" },
    ],
  },
  {
    title: "3 · 계약·신고 정보",
    screens: [
      { name: "근로계약서", href: "contract", desc: "필기 서명 · 거부" },
      { name: "신고 정보", href: "tax", desc: "4대보험 · 급여 계좌" },
    ],
  },
  {
    title: "4 · 급여·알림·내 정보",
    screens: [
      { name: "급여명세서", href: "pay", desc: "이번 달 · 지난 명세서" },
      { name: "알림", href: "notify", desc: "알림함 · 수신 설정 묶음" },
      { name: "내 정보", href: "me", desc: "위치정보 동의 · 본사 제공 동의" },
    ],
  },
];

export default () => ({
  title: "입구",
  html: `<main class="flex flex-col gap-[24px] px-[16px] pt-[52px] pb-[52px]"><div class="flex flex-col gap-[14px] px-[14px]">${brandLogo()}<div class="flex flex-col gap-[6px] leading-[1.5]"><h1 class="text-[28px] font-bold">직원 근무 앱 데모</h1><p class="text-[14px] text-staff-text-sub">목업(docs/mockup/app)의 화면과 확정된 상태를 실제 부품으로 그렸습니다.</p></div></div>${notice(
    "화면마다 오른쪽 위 <strong>상태</strong> 버튼으로 같은 화면의 다른 상태를 봅니다. 값은 모두 가짜이고 서버를 부르지 않습니다.",
  )}${CHAPTERS.map(
    (c) =>
      `<section class="flex flex-col gap-[8px]"><h2 class="px-[14px] text-[16px] font-bold">${c.title}</h2><ul class="flex flex-col overflow-hidden rounded-[16px] border border-staff-border-light bg-white">${c.screens
        .map(
          (s) =>
            `<li class="border-b border-staff-border-light last:border-b-0">${
              s.href
                ? `<a href="${page(s.href)}" class="flex min-h-[56px] flex-col justify-center px-[16px] py-[10px] active:bg-staff-primary-inactive"><span class="text-[15px] font-semibold">${s.name}</span><span class="text-[12px] text-staff-text-muted">${s.desc}</span></a>`
                : `<div class="flex min-h-[56px] flex-col justify-center px-[16px] py-[10px] text-staff-text-muted"><span class="text-[15px] font-semibold">${s.name} <span class="text-[12px] font-normal">· 준비 중</span></span><span class="text-[12px]">${s.desc}</span></div>`
            }</li>`,
        )
        .join("")}</ul></section>`,
  ).join("")}</main>`,
});
