import Link from "next/link";

// 화면 목업(/design/login 등). UI 만 보여 주고 인증·API 없이 버튼으로 화면 사이를 오간다.
// 밝은 테마(StaffRoot)는 위 design/layout 이 건다. 모바일 앱에 들어갈 화면이라 폰 틀 없이 폭 100% 로 그린다.
export default function MockupLayout({ children }: LayoutProps<"/design">) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-staff-bg">
      {children}
      {/* 목업 전용: 어느 화면에서든 디자인 가이드로 돌아가는 고정 버튼. 앱 화면의 버튼(위 알림 · 아래 메뉴)과
          겹치지 않게 오른쪽 가장자리 가운데에 둔다. 앱 디자인이 아니라 목업을 보는 도구라 짙은 남색으로 구분한다. */}
      <Link
        href="/design"
        transitionTypes={["nav-back"]}
        className="fixed top-1/2 right-[8px] z-50 -translate-y-1/2 rounded-full bg-staff-navy/85 px-[12px] py-[8px] text-[12px] leading-[1.5] font-semibold text-white shadow-[0_4px_12px_rgba(24,34,55,0.18)] transition-colors duration-150 ease-out hover:bg-staff-navy active:bg-staff-navy"
      >
        가이드
      </Link>
    </div>
  );
}
