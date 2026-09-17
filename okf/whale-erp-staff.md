---
type: Application
title: Whale ERP Staff
description: Next.js 16 App Router staff console for Whale ERP.
resource: https://github.com/nalpari/whale-erp-new-staff
tags: [erp, staff, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
generated: { by: claude-code/opus-5, at: 2026-09-17T00:00:00Z }
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

* `src/app/` - App Router entry (`layout.tsx`, `page.tsx`, `globals.css`).
* `src/app/design/` - 디자인 샘플. `/design` 은 기본 유닛, `/design/full` 은 유닛을 조합한 임시 페이지. 2026 Whale ERP 1차수정 Figma(01.프레임_기본) 기준의 밝은 ERP 테마로, 토큰은 `globals.css` 의 `erp-*` 색과 `font-erp`(Pretendard)다. 이 경로 밖의 화면은 기존 다크 테마를 유지한다. 점포 선택·마이페이지 팝업과 필터 접기처럼 클릭 상태가 필요한 유닛은 `interactive.tsx`(클라이언트 컴포넌트)에 있다.
* `public/` - Static assets served at the site root. `public/design/` 은 Figma 에서 내려받은 아이콘이다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
```
