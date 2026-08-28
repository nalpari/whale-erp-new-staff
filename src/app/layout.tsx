import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

const plate = IBM_Plex_Sans_KR({
  variable: "--font-plate",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  // 한글 서브셋이 잘게 쪼개져 있어 전부 preload 하면 첫 페인트가 늦어진다.
  preload: false,
});

const gauge = IBM_Plex_Mono({
  variable: "--font-gauge",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Whale ERP 직원 콘솔",
  description: "품목과 재고를 확인하는 Whale ERP 직원용 콘솔.",
};

const DIRECTION_CONTRACT = `<!--
THESIS: 재고는 저울 위에 올라온 값이다. 카드로 나눠 담는 관리자 화면을 거부하고 화면 전체를 하나의 계측 장비 전면으로 짓는다.
OWN-WORLD: 앤트러사이트 패널 #0D0F10 과 함몰면 #191D1F, 헤어라인 이음매, 각인 캡스(모노 대문자 트래킹). 앰버 #FFAA00 는 측정된 수치에만, 초록 #24C46A 는 조작에만, 붉은색 #FF5B4A 는 경보에만. 카드도 배지도 아이콘도 쓰지 않는다.
STORY: 직원은 취급하는 코일 야드를 먼저 보고 그 옆 컬럼에서 기동한다. 들어가면 품목 밴드가 깔리고 재고 숫자가 순서대로 켜진다.
FIRST VIEWPORT: 좌 60% 코일 야드 사진, 우 40% 패널 컬럼. 위에 각인 명판 WHALE ERP, 아래 함몰 입력 두 칸, 그 밑 전폭 초록 기동 버튼.
FORM: 계근대. 정렬된 후보 목록 5번. seed key 6b5f91c5.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${plate.variable} ${gauge.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        {children}
      </body>
    </html>
  );
}
