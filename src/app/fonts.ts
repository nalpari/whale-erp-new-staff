import localFont from "next/font/local";

// 직원앱 Figma 가 쓰는 Pretendard. 굵기는 Figma 에 나오는 네 가지만 담는다(400·500·600·700).
// CDN 대신 저장소에 넣어 두어 사내망에서 막히거나 CDN 이 죽어도 글꼴이 바뀌지 않는다(pretendard@1.3.9, OFL).
// 변수는 html 에 단다. globals.css 의 --font-staff 가 :root 에서 이 변수를 읽으므로 더 아래에서 달면 값이 비어 버린다.
export const pretendard = localFont({
  src: [
    { path: "./fonts/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Pretendard-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Pretendard-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Pretendard-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
  // 굵기마다 800KB 라 preload 하면 이 글꼴을 쓰지 않는 화면까지 3MB 를 먼저 받는다. 끄면 쓰인 굵기만 받는다.
  preload: false,
});
