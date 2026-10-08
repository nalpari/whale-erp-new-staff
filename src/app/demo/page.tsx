import Link from "next/link";
import { BrandLogo, Notice } from "@/components/common";

// 데모 입구. 화면마다 링크를 건다. 링크가 없으면 「준비 중」으로 보인다(docs/plans/2026-10-08-직원-근무-앱-데모.md).
const CHAPTERS: { title: string; screens: { name: string; href?: string; desc: string }[] }[] = [
  {
    title: "1 · 로그인·가입",
    screens: [
      { name: "로그인", href: "/demo/login", desc: "이메일 찾기 · 비밀번호 재설정 · 잠금 5분" },
      { name: "가입", href: "/demo/join", desc: "가입 초대 · 본인인증 · 연결 보류 · 가입 불가" },
    ],
  },
  {
    title: "2 · 홈·근무·출퇴근",
    screens: [
      { name: "홈", href: "/demo/home", desc: "오늘의 근무 · 날인 요청 팝업" },
      { name: "근무", href: "/demo/work", desc: "근무스케줄 · TO-DO" },
      { name: "출퇴근 등록", href: "/demo/check-in", desc: "GPS 판정 · 확인 필요 · 위치정보 동의 · 일시 중지" },
      { name: "출퇴근 현황", href: "/demo/attendance", desc: "이번 주 · 기간별" },
    ],
  },
  {
    title: "3 · 계약·신고 정보",
    screens: [
      { name: "근로계약서", href: "/demo/contract", desc: "필기 서명 · 거부" },
      { name: "신고 정보", href: "/demo/tax", desc: "4대보험 · 급여 계좌" },
    ],
  },
  {
    title: "4 · 급여·알림·내 정보",
    screens: [
      { name: "급여명세서", href: "/demo/pay", desc: "이번 달 · 지난 명세서" },
      { name: "알림", href: "/demo/notify", desc: "알림함 · 수신 설정 묶음" },
      { name: "내 정보", href: "/demo/me", desc: "위치정보 동의 · 본사 제공 동의" },
    ],
  },
];

export default function DemoIndexPage() {
  return (
    <main className="flex flex-col gap-[24px] px-[16px] pt-[52px] pb-[52px]">
      <div className="flex flex-col gap-[14px] px-[14px]">
        <BrandLogo />
        <div className="flex flex-col gap-[6px] leading-[1.5]">
          <h1 className="text-[28px] font-bold">직원 근무 앱 데모</h1>
          <p className="text-[14px] text-staff-text-sub">목업(docs/mockup/app)의 화면과 확정된 상태를 실제 부품으로 그렸습니다.</p>
        </div>
      </div>

      <Notice>
        화면마다 오른쪽 위 <strong>상태</strong> 버튼으로 같은 화면의 다른 상태를 봅니다. 값은 모두 가짜이고 서버를 부르지 않습니다.
      </Notice>

      {CHAPTERS.map((chapter) => (
        <section key={chapter.title} className="flex flex-col gap-[8px]">
          <h2 className="px-[14px] text-[16px] font-bold">{chapter.title}</h2>
          <ul className="flex flex-col overflow-hidden rounded-[16px] border border-staff-border-light bg-white">
            {chapter.screens.map((s) => (
              <li key={s.name} className="border-b border-staff-border-light last:border-b-0">
                {s.href ? (
                  <Link
                    href={s.href}
                    transitionTypes={["nav-forward"]}
                    className="flex min-h-[56px] flex-col justify-center px-[16px] py-[10px] active:bg-staff-primary-inactive"
                  >
                    <span className="text-[15px] font-semibold">{s.name}</span>
                    <span className="text-[12px] text-staff-text-muted">{s.desc}</span>
                  </Link>
                ) : (
                  <div className="flex min-h-[56px] flex-col justify-center px-[16px] py-[10px] text-staff-text-muted">
                    <span className="text-[15px] font-semibold">
                      {s.name} <span className="text-[12px] font-normal">· 준비 중</span>
                    </span>
                    <span className="text-[12px]">{s.desc}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
