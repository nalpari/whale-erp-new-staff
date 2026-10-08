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
generated: { by: claude-code/opus-5.5, at: 2026-10-08T02:47:54Z }
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

* `src/app/` - App Router entry (`layout.tsx`, `page.tsx`, `globals.css`, `fonts.ts`). `/` 는 로그인이 생길 때까지 `/design` 으로 보낸다.
* `src/lib/api.ts` - whale-erp-api 호출 틀(`API_BASE_URL`, `request`, `ApiError`)과 세션 쿠키(`setSession`·`getSession`·`clearSession`). 견본 API(`/items`, `/auth/staff/login`)는 2026-10-08 걷어 냈다.
* `src/app/design/` - 디자인 가이드 견본 화면(`/design`, 색인 제외). 맨 위 링크 줄에서 화면 목업으로 간다.
* `src/app/design/(mockup)/` - 인증·API 없이 UI 만 보여 주는 화면 목업(`/design/login`, `/design/home`, `/design/check-in`, `/design/attendance`, `/design/work`, `/design/pay`, `/design/notification-settings` …). 모바일 앱에 들어갈 화면이라 폭 100% 로 그린다.
* `src/app/demo/` - 직원 근무 앱 클릭 데모(`/demo`). 목업 `docs/mockup/app` 한 장을 화면 하나로 옮기고, 같은 화면의 상태는 `_components` 의 `useDemoState`(주소 `#상태`)와 화면 밖 `DemoStates` 도구로 바꾼다. 하단 메뉴는 공통 `BottomNav` 네 칸에 경로만 `/demo` 로 바꾼 `DEMO_NAV_ITEMS` 를 쓴다(목업의 출퇴근 탭은 홈 카드로). 가짜 값만 쓰고 API 는 부르지 않는다. 계획은 `docs/plans/2026-10-08-직원-근무-앱-데모.md`.
* `scripts/build-demo.mjs` - `DEMO_EXPORT=1` 정적 내보내기(`next.config.ts`)를 `docs/demo/` 로 옮긴다. 미니 nginx 8081 이 `/demo/`·`/_next/`·`/icons/` 를 그 아래로 잇는다.
* `src/components/common/` - 직원앱 공통 컴포넌트. 화면은 `StaffRoot` 로 감싼다.
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
