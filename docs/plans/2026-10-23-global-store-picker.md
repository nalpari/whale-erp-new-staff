# 앱 전역 근무지 선택기 (WHALEERP-314)

작업 위치: 워크트리 `~/.whale-erp-worktrees/whale-erp-staff/alhambra`, 브랜치 `magmar`(origin/main `64bba22`).
근거: Plane WHALEERP-314 본문(2026-10-23 고침), 목업 `docs/mockup/app/home.html`(HOME-2 · HOME-5), 기획 세션 지시(2026-10-23, 종은 공통 TopBar로 정정).
앞 작업: #205 근무 탭 근무지 카드와 쿠키 `current_staff_member`(`2026-10-22-work-tab-schedules.md`).

## 정한 것

- 근무지는 앱 전역에서 하나다. 고르는 자리는 홈 상단 선택기와 근무 탭 근무지 카드 두 곳이고, 둘 다 같은 「근무지 고르기」 시트를 연다(HOME-2 · WORK-4).
- 급여명세서와 알림함은 모든 근무지 것을 보인다(PAY-8). 알림을 눌러 근무지가 있는 화면으로 가면 앱 전역 근무지를 그 알림의 근무지로 바꾼다(2026-10-23 재영). `openNotificationAction` 이 이미 쿠키를 바꾸므로 확인만 한다.

## 바꿀 것

1. **시트 하나로** — 근무 탭 카드 안의 시트 · 고르기 처리를 `src/app/(app)/store-sheet.tsx`(`useStoreSheet`)로, `pickStoreAction` 을 `src/app/(app)/store-actions.ts` 로 옮긴다. 근무 탭 카드는 동작이 바뀌지 않는다.
2. **현재 근무지 읽기** — `src/lib/current-membership.ts` 의 `getCurrentMembership()` 이 소속 목록과 쿠키를 함께 읽는다(React `cache`, 한 요청에 한 번). 목록을 못 받으면 null. 근무 탭이 이 함수를 쓴다. 판정은 그대로 `pickCurrentMembership`.
3. **홈 머리줄** — 공통 `TopBar`(로고 · 근무지 이름 버튼 · 종)를 그대로 쓴다. 종은 `/notifications`, 새 알림 점은 미확인 건수 > 0(못 받으면 끔). TopBar 와 시트를 묶은 클라이언트 컴포넌트(`home/store-top-bar.tsx`)에 서버가 소속 목록 · 현재 근무지 · 새 알림 여부를 넘긴다.
   - 근무지가 하나면 `onStoreClick` 을 넘기지 않아 시트가 열리지 않는다. 공통 TopBar 는 `onStoreClick` 이 없으면 꺾쇠를 그리지 않는다(#27 뒤 재영 A안, 이름 글자는 그대로).
   - 근무지가 없으면 이름 자리에 「근무지가 없습니다」(HOME-5). 하단 탭은 그대로.
   - 소속 목록을 못 받으면 TopBar 대신 종(`NotificationBell`) 하나만 둔다(#27 뒤 재영 확인), 홈 나머지는 그대로.
4. **홈 TO-DO 카드** — 고른 근무지의 `storeId` 를 받아 `GET /me/todos?status=PENDING&status=IN_PROGRESS&pageSize=3&storeId=<id>`. 받은 3건을 화면에서 거르면 0건이 될 수 있어 api 에서 거른다. 목록을 못 받았으면 지금처럼 모든 근무지.
4-1. **임시 홈 정리(2026-10-23 재영)** — 데모에 없는 계정 카드(이메일 · 계정 상태)와 없앤 연결 보류(`LINK_HOLD`) 경고를 지운다. 홈은 머리줄 · 인사말 · TO-DO 카드만 남고 나머지는 #311 · #313 이 채운다.
5. **목업 HOME-2** — 「근무스케줄·출퇴근 현황·알림 화면이 모두 그 근무지를 따른다」를 알림함은 모든 근무지 알림을 보이고, 알림을 눌러 이동하면 선택기도 그 알림의 근무지로 바뀐다로 고친다(2026-10-23 재영).

범위 밖: 오늘 근무 · 이번 주 근무 카드(#313), 대시보드 api(#312), 출퇴근 화면.

## 확인

- lint · tsc · `pnpm test`, `API_BASE_URL` 을 비운 `pnpm build`(프리렌더 문제 없음).
- 근무지 두 곳 계정으로: 홈에서 바꾸면 근무 탭이 따라 바뀜 · 근무 탭에서 바꾸면 홈이 따라 바뀜 · 알림을 누르면 선택기가 그 근무지로 바뀜.
