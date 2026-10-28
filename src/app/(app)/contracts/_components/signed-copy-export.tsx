import { PRESS } from "@/components/common/theme";

/** 공통 Button 의 outline 모양(급여명세서 「명세서 내보내기」와 같은 h44 · radius 12 · 테두리 · 14px semibold). */
const OUTLINE = `inline-flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[12px] border border-staff-border bg-white px-[18px] text-[14px] font-semibold whitespace-nowrap text-staff-text active:bg-staff-primary-inactive ${PRESS}`;

/**
 * 처리 완료본 내보내기(WHALEERP-149). 받기 라우트(documents/[contractDocumentId]/route.ts)가 로그인 토큰으로 api 의 300초 서명
 * 주소를 받아 302 로 보내고, 저장소가 attachment 로 내려줘 화면은 그대로 남는다. 실패하면 라우트가 상세로 돌려보내
 * `?download=` 안내를 띄운다(체결 완료 · 종료가 아니면 api 409 → 「지금은 받을 수 없음」).
 *
 * - 공통 Button(href)은 Next Link 라 라우트 핸들러를 화면 이동으로 가로채므로 같은 모양의 <a> 를 쓴다(종이 계약 「받기」와 같다).
 * - `download` 속성은 두지 않는다 — 실패 때 돌려보낸 상세 HTML 을 파일로 저장해 버리고, 성공 때 주소는 다른 출처라 어차피 무시된다.
 * - Plane 의 「공유 시트」는 휴대전화 브라우저가 받은 PDF 에 띄우는 저장 · 공유(iOS 미리보기의 공유 · 안드로이드 다운로드 알림)로
 *   갈음한다. Web Share API(navigator.share 에 파일 싣기)는 쓰지 않는다 — 파일을 화면이 먼저 받아야 하는데 서명 주소는 저장소의
 *   다른 출처라 CORS 로 읽어 올 수 없고, 앱 서버를 거쳐 받으면 사용자 동작(탭)이 끝난 뒤라 공유 시트가 막히며, 데스크톱 ·
 *   일부 브라우저는 파일 공유를 지원하지 않는다.
 */
export function SignedCopyExport({ href }: { href: string }) {
  return (
    <a href={href} className={OUTLINE}>
      계약서 내보내기
    </a>
  );
}
