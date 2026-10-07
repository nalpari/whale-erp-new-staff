// 화면 목업(/design/login 등). UI 만 보여 주고 인증·API 없이 버튼으로 화면 사이를 오간다.
// 밝은 테마(StaffRoot)는 위 design/layout 이 건다. 모바일 앱에 들어갈 화면이라 폰 틀 없이 폭 100% 로 그린다.
export default function MockupLayout({ children }: LayoutProps<"/design">) {
  return <div className="flex min-h-[100dvh] w-full flex-col bg-staff-bg">{children}</div>;
}
