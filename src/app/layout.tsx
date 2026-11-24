import type { Metadata, Viewport } from "next";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale ERP 직원 근무 앱",
  description: "Whale ERP 직원이 근로계약·출퇴근·근무스케줄·급여명세서를 보는 앱.",
};

/**
 * 노치 · 홈 인디케이터 밑까지 그리고(viewportFit: cover) 그 자리는 각 화면이 env(safe-area-inset-*) 로 비운다(Dock · 아래 탭 · 바텀시트).
 * cover 가 없으면 env() 값이 늘 0 이라 그 여백이 동작하지 않는다. 설치형 앱은 Flutter SafeArea 가 이미 노치를 피하므로 앱 안에서는
 * 값이 0 이고 보이는 차이가 없다. themeColor 는 앱 껍데기 바탕(흰색)과 같게 둔다(mobile-app webview-plan 1절 viewport).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
