# 근무 탭 뼈대와 TO-DO 계획

**목표:** 직원 근무 앱 하단 메뉴 「근무」(`/work`) 화면 뼈대를 만들고, 그 안의 TO-DO 탭을 실제 api 에 붙인다. 홈에 TO-DO 카드를 둔다.

**Plane 일감:** #119 근무 화면 TO-DO 탭 · #120 TO-DO 상세와 상태 변경 · #121 공유 TO-DO 표시 · #316 홈 TO-DO 완료 처리 (부모 #109)

**짝 문서:** api `docs/plans/2026-10-19-todos.md` · front `docs/plans/2026-10-19-todos-screen.md`

**작업 위치:** worktree `~/.whale-erp-worktrees/whale-erp-staff/work-tab`, 브랜치 `feature/work-tab-todos` (origin/main `f47dc63`)

## 근거

| 근거 | 쓰는 곳 |
|---|---|
| 목업 `src/app/design/(mockup)/work/` (Figma 06·07 근무 정보) | 화면 머리 「근무정보」, 탭(근무스케줄 · TO-DO), 근무지 카드, TO-DO 상태별 개수와 목록 |
| 쟁점 WORK-2 | TO-DO 는 하단 탭이 아니라 근무 화면 안의 탭 |
| 쟁점 WORK-3 | 공유 TO-DO 는 먼저 완료한 사람 이름과 완료 시각을 보인다 |
| 쟁점 HOME-1 | 홈 TO-DO 카드의 바로가기는 근무 화면 TO-DO 탭(`/work?tab=todo`)으로 간다 |
| `src/components/common/todo-list.tsx`, `bottom-nav.tsx` | 이미 있는 부품을 그대로 쓴다 |

## 범위

**뼈대 (`/work`)**
- `src/app/(app)/work/page.tsx`: 머리 · 탭 · 하단 메뉴. 탭은 `?tab=schedule|todo` 로 URL 에 둔다(홈 바로가기 · 새로 고침이 같은 탭을 연다). 탭 이동은 `router.replace` 라 뒤로 가기에 남지 않는다.
- 근무스케줄 탭: 근무스케줄 api 가 아직 없어 빈 상태 안내(「근무스케줄은 준비 중입니다」)만 둔다. 근무지 카드도 같은 이유로 이번에는 두지 않는다.
- 근무지: `GET /me/todos` 는 근무지를 섞은 평평한 목록이라 앱이 `storeId` 로 묶고, 근무지가 둘 이상이면 TO-DO 탭 위에 근무지 칩을 둔다. 홈 상단 근무지 선택기(WORK-4, #311·#313)가 생기면 그 값을 따르도록 바꾼다.

**TO-DO**
- 탭: 상태별 개수 줄 + 목록(api 순서 그대로: 미완료 긴급 → 미완료 나머지 → 완료). 긴급 강조.
- 상세(바텀시트): 제목·내용·수행 예정 일시·근무지, 상태 바꾸기(대기 · 진행 중 · 완료). 등록·삭제 없음.
- 상세 시트의 근무지 줄은 근무지가 둘 이상일 때만 보인다.
- 공유 건: 완료면 「○○님이 완료 · 시각」. 늦게 완료하려다 409 `TODO_ALREADY_DONE` 면 「이미 완료된 TO-DO 입니다」로 알리고 목록을 다시 받는다.
- 홈 TO-DO 카드(#316): 미완료 건 위 몇 개와 체크로 완료 처리, 「전체 보기」는 `/work?tab=todo`. 홈 파일은 다른 작업(#311·#313)이 채울 자리라 카드는 따로 컴포넌트로 만들고 홈에는 한 줄로만 끼운다.

## 순서와 확인

1. api 브랜치 openapi 로 `src/lib/api-types.d.ts` 다시 만들기
2. 상태 바꾸기·개수 세기 같은 순수 함수 테스트 먼저
3. 화면 → `pnpm lint` · `tsc` · `pnpm build`
4. 로컬 api(브랜치)와 직원 계정으로 목록 → 상세 → 상태 변경 → 공유 건 경합 한 번
5. 커밋·PR 은 재영 확인
