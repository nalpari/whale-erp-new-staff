---
type: Application
title: Whale ERP Staff
description: Next.js 16 App Router 직원 근무 앱(Whale ERP).
resource: https://github.com/nalpari/whale-erp-new-staff
tags: [erp, staff, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
  - { id: common, resource: ../src/components/common, title: Common UI components }
  - { id: design-md, resource: ../DESIGN.md, title: Design system }
generated: { by: claude-code/opus-5.5, at: 2026-10-12T00:48:34Z }
---

# Stack

| Piece      | Version | Notes                                   |
|------------|---------|-----------------------------------------|
| Next.js    | 16.3.3  | App Router, React Compiler enabled.     |
| React      | 19.2.8  | `react-dom` at the same version.        |
| TypeScript | ^5      | Strict config in `tsconfig.json`.       |
| Tailwind   | ^4      | Via `@tailwindcss/postcss`.             |
| pnpm       | 11.18.0 | `packageManager` 로 고정. npm 사용 금지. |

# Layout

* `src/app/` - App Router entry (`layout.tsx`, `page.tsx`, `globals.css`, `fonts.ts`). `/` 는 `/home` 으로 보내고, 로그인하지 않았으면 proxy 가 `/login` 으로 돌린다.
* `src/app/(auth)/` - 로그인 없이 여는 직원 앱 화면. `/login`(로그인 · 5분 잠금 · 요청 제한 · `?expired=1` 만료 안내 · `?reset=1` 비밀번호 바꿈 안내, WHALEERP-165·166)과 비밀번호 재설정 `/password-reset`(핀 요청 · `?timeout=1` 10분 초과 안내) → `/password-reset/pin`(핀 입력 · 1분 뒤 다시 받기 · 남은 시간) → `/password-reset/new-password`(규칙 안내 · 400 사유 · 401 이면 `?timeout=1`, WHALEERP-174·175·176). 단계 사이의 이메일 · 발급 시각 · 확인한 핀은 httpOnly 쿠키 `password_reset`(Path `/password-reset`, 30분)에 두고 URL 에 넣지 않는다. 화면 틀 `_components/auth-screen.tsx` 는 데모 login 의 `Screen` 을 참고해 새로 썼다.
* `src/app/(app)/` - 로그인한 직원 화면. 지금은 임시 홈 `/home`(이름 · 계정 상태 · `LINK_HOLD` 안내 · 로그아웃 시트, WHALEERP-167)뿐이고, 실제 홈은 다른 작업이 이 파일을 채운다.
* `src/proxy.ts` - 접속 유지. 액세스 토큰이 없고 갱신 토큰이 있으면 `/auth/account/refresh` 로 다시 받아 응답·요청 쿠키에 굽고, 갱신이 401 이면 쿠키를 지우고 `/login?expired=1` 로 보낸다. `/login?expired=1`(서버 컴포넌트가 401 을 받거나 세션을 못 읽으면 이리로 보낸다)에서는 갱신을 해 보고 정말 끝났을 때(401)만 쿠키를 지운다 — 살아 있으면 다시 굽고 `/home` 으로 보낸다. 주소만으로 지우면 다시 로그인한 뒤 뒤로 가기 · 새로 고침이나 남이 건 링크로 접속이 끊긴다. 읽히지 않는 `account` 쿠키는 세션으로 치지 않고 지운다. 로그인 필요 경로 판정도 여기서 하되, 화면·액션은 `requireSession()` 을 따로 거친다. `/design` · `/demo` · 정적 파일은 빼고 돈다.
* `src/lib/api.ts` - whale-erp-api 호출 틀(`API_BASE_URL`, `request`, `ApiError`, 요청·응답 타입 `Schemas`). `request` 는 `json`·`accessToken`·`revalidate`(enum 처럼 모두에게 같은 응답만 캐시) 옵션을 받는다.
* `src/lib/api-types.d.ts` - `pnpm openapi:types`(`scripts/openapi-types.mjs`)가 api 의 `openapi/openapi.json` 으로 만든 타입. api 위치는 `WHALE_API_DIR`(기본 `../whale-erp-api`).
* `src/lib/session-cookies.ts` · `session.ts` - httpOnly 쿠키 `access_token`(14분 — 15분짜리 JWT 보다 1분 먼저 끝내 proxy 가 미리 갱신한다) · `refresh_token`(api 가 준 만료까지, 회전 없음) · `account`(로그인 응답의 계정 JSON) · `device_id`(로그인의 `deviceIdentifier`, 로그아웃해도 남김). `saveLogin` · `getSession` · `requireSession` · `clearSession` · `getDeviceId` · `authedRequest`(401 이면 `/login?expired=1`).
* `src/lib/auth.ts` - 직원 계정 인증 API(`login` · `refreshAccessToken` · `logout` · `requestPasswordResetPin` · `verifyPasswordResetPin` · `resetPassword`). `src/lib/enums.ts` - `getEnum(name)`(한 시간 서버 캐시) · `labelOf`.
* `src/lib/password-reset.ts` - 재설정 쿠키(`readPasswordReset` · `savePasswordReset` · `clearPasswordReset`), `PIN_VALID_MS`(10분 한 시계) · `PIN_RESEND_MS`(1분 — api 가 그 안의 재요청을 보내지 않고 204 로 답해 화면이 막는다), `maskEmail`(@ 앞 처음 2글자 + 마지막 1글자, 3글자 이하는 첫 글자만 — 앱 공통 LOGIN-9 규칙). 같은 이메일로 1분 안에 다시 핀을 요청하면 api 를 부르지 않고 앞 핀 화면으로 돌려보낸다. `src/lib/password-rules.ts` - api `validateNewPassword` 와 같은 규칙의 안내용 검사(판정은 api).
* `src/app/design/` - 디자인 가이드 견본 화면(`/design`, 색인 제외). 맨 위 링크 줄에서 화면 목업으로 간다.
* `src/app/design/(mockup)/` - 인증·API 없이 UI 만 보여 주는 화면 목업(`/design/login`, `/design/home`, `/design/check-in`, `/design/attendance`, `/design/work`, `/design/pay`, `/design/notification-settings` …). 모바일 앱에 들어갈 화면이라 폭 100% 로 그린다.
* `docs/demo/` - 직원 근무 앱 클릭 데모. 관리자 웹 데모(whale-erp-front `docs/demo`)와 같은 정적 HTML 생성기다. `node docs/demo/build.mjs` 가 `src/pages/<화면>/index.mjs`(화면 하나 = 목업 한 장)를 `<화면>/index.html` 로 내고, 앱과 같은 Tailwind 로 `docs/demo` 를 훑어 `assets/staff.css` 를 만든다(토큰은 `src/app/globals.css` 를 그대로 읽음, 자원 주소에 내용 해시). 화면은 `src/ui.mjs`(공통 부품 `src/components/common` 을 HTML 문자열로 옮긴 함수, 클래스 문자열이 같아야 한다)로만 그린다. 같은 화면의 상태는 상태마다 블록을 두고 `assets/staff.js` 가 주소 `#상태` 로 보이고 숨긴다. 화면 밖 오른쪽 위 상태 전환 도구, 시트·토스트·탭·스위치·체크칸도 `staff.js` 한 파일이 `data-*` 단서로 붙인다. 화면 둘 이상이 쓰는 조각은 DESIGN.md 「데모 조각」 절. 하단 메뉴는 다섯 칸(홈·근무·출퇴근·급여·내 정보, 2026-10-08 재영 결정 — Figma 는 네 칸), 출퇴근 칸은 출퇴근 등록으로 간다. 가짜 값만 쓰고 API 는 부르지 않는다. 화면은 `login`·`join`·`home`·`work`·`check-in`·`attendance`·`contract`·`tax`·`pay`·`notify`·`me`. 미니 nginx 8081 은 `/demo/` 를 이 폴더로 잇는다. 계획은 `docs/plans/2026-10-08-직원-근무-앱-데모.md`.
* `src/components/common/` - 직원앱 공통 컴포넌트. 화면은 `StaffRoot` 로 감싼다. `Dock` · `Alert` · `DangerButton` 은 데모 조각을 참고해 새로 올린 것이다.
* `public/` - Static assets served at the site root. Figma 아이콘은 `public/icons/`.

# Design

직원앱 Figma 「디자인 스타일 가이드」(node 2001:68)를 옮긴 시스템이 `DESIGN.md` 에 있다.
토큰은 `globals.css` 의 `--color-staff-*`·`--font-staff`(Pretendard 400·500·600·700, `src/app/fonts.ts`)이고,
밝은 테마·글꼴·포커스색은 `StaffRoot` 안에서 걸리고, 루트 `globals.css` 는 토큰과 바탕색·화면 이동 슬라이드만 둔다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
```
