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
generated: { by: claude-code/opus-5.5, at: 2026-10-08T09:30:00Z }
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
* `docs/demo/` - 직원 근무 앱 클릭 데모. 관리자 웹 데모(whale-erp-front `docs/demo`)와 같은 정적 HTML 생성기다. `node docs/demo/build.mjs` 가 `src/pages/<화면>/index.mjs`(화면 하나 = 목업 한 장)를 `<화면>/index.html` 로 내고, 앱과 같은 Tailwind 로 `docs/demo` 를 훑어 `assets/staff.css` 를 만든다(토큰은 `src/app/globals.css` 를 그대로 읽음, 자원 주소에 내용 해시). 화면은 `src/ui.mjs`(공통 부품 `src/components/common` 을 HTML 문자열로 옮긴 함수, 클래스 문자열이 같아야 한다)로만 그린다. 같은 화면의 상태는 상태마다 블록을 두고 `assets/staff.js` 가 주소 `#상태` 로 보이고 숨긴다. 화면 밖 오른쪽 위 상태 전환 도구, 시트·토스트·탭·스위치·체크칸도 `staff.js` 한 파일이 `data-*` 단서로 붙인다. 화면 둘 이상이 쓰는 조각은 DESIGN.md 「데모 조각」 절. 하단 메뉴는 다섯 칸(홈·근무·출퇴근·급여·내 정보, 2026-10-08 재영 결정 — Figma 는 네 칸), 출퇴근 칸은 출퇴근 등록으로 간다. 가짜 값만 쓰고 API 는 부르지 않는다. 화면은 `login`·`join`·`home`·`work`·`check-in`·`attendance`·`contract`·`tax`·`pay`·`notify`·`me`. 미니 nginx 8081 은 `/demo/` 를 이 폴더로 잇는다. 계획은 `docs/plans/2026-10-08-직원-근무-앱-데모.md`.
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
