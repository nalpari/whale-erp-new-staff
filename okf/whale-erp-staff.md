---
type: Application
title: Whale ERP Staff
description: Next.js 16 App Router staff console for Whale ERP.
resource: https://github.com/nalpari/whale-erp-new-staff
tags: [erp, staff, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
  - { id: common-components, resource: ../src/components/common, title: 공통 ERP 컴포넌트 }
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
* `src/components/common/` - 2026 Whale ERP 1차수정 Figma 기준 공통 컴포넌트. `@/components/common` 에서 가져다 쓴다. 버튼·배지·입력칸·체크박스·라디오, 목록(ListToolbar·DataTable·Pagination), 필터(FilterPanel·FilterSection), 헤더(GlobalHeader·StoreSelect·UserPop), 제목 줄(PageBar·ServiceLinks). 메뉴·점포·표 열 같은 값은 props 로 받는다. 밝은 테마와 Pretendard 는 `ErpRoot` 안에서만 적용되고, 색 토큰은 `globals.css` 의 `erp-*` 다. 이 밖의 화면은 기존 다크 테마를 유지한다.
* `src/app/design/` - 공통 컴포넌트 샘플. `/design` 은 컴포넌트를 하나씩, `/design/full` 은 점포정보 관리 목록을 조합해 보여 준다. 더미 데이터는 `sample.tsx` 에 있다.
* `public/` - Static assets served at the site root. `public/icons/` 는 Figma 에서 내려받은 아이콘이다.

# Commands

```bash
pnpm install    # deps
pnpm dev        # dev server
pnpm build      # production build
pnpm lint       # eslint
```
