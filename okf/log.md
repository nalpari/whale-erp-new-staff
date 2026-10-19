# Bundle history

## 2026-10-19
* **Update**: 근무정보 `/work` 뼈대와 TO-DO 탭 · 상세 시트 · 홈 TO-DO 카드(#119·#120·#121·#316)를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다. api 타입은 api TO-DO 브랜치 기준으로 다시 만들었다.

## 2026-10-14
* **Update**: staff #7 리뷰 반영 — `safeNextPath` 가 정규화한 뒤 `//` 로 시작하는 값(`/.//evil.com`)을 버려 오픈 리다이렉트를 막았다. proxy 의 만료 안내 설명을 `next`(없으면 `/home`)로, `x-staff-path` 를 덮어쓰는 범위를 로그인 필요 화면으로 고쳤다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 로그인 뒤 보던 화면으로 돌려보내기(WHALEERP-166)를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다 — proxy 와 만료 안내가 `next` 를 싣고, `src/lib/login-return.ts` 의 `safeNextPath` 로 거른다. `PUBLIC_PATHS` 를 그 파일로 옮겼다.
* **Update**: PR #6 리뷰 반영 — 주소의 토큰을 남기는 경우를 「연결 실패」에서 「확인하지 못함(429 · 5xx · 연결 실패)」으로 바로잡았다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 링크 화면 2차 리뷰 반영 — 예상 밖 400 로그, 서버 액션 요청이 끊기면 다시 시도 화면, 확인하지 못함의 범위를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 쓸 수 없는 링크 안내에 「메일에서 받은 링크를 다시 눌러 보세요」를 더했다(앱 · 데모 `link-used`, 2026-10-14 노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 링크 화면 리뷰 반영 — 빈 `#token=` 은 쿠키로 넘어가지 않음, 결과 화면마다 제목 초점, 핀 흐름 성공 때 링크 쿠키도 지움을 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 관리자 재설정 링크 화면 `/password-reset/link`(WHALEERP-173)와 링크 토큰 쿠키 `password_reset_link`, 핀 · 링크가 같이 쓰는 새 비밀번호 칸 `new-password-fields.tsx` 를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다. api 타입은 api main(#28) 기준으로 다시 만들었다.
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-14 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 메일 템플릿 표의 「운영 알림 짝」을 걷고 운영 알림 · 메일 분리(운영 정책 NTF-03), 알림 템플릿의 기본 문구 칸(`default_*`, NOTIFY-17 · 18)을 적었다(재영).

## 2026-10-13
* **Update**: [네이밍](/conventions/naming.md) — 기본 템플릿 코드 37건 → 40건. 표에 빠져 있던 `PUSH_PAYSLIP_RESENT` · `EMAIL_PAYSLIP_SENT` · `EMAIL_PAYSLIP_RESENT` 를 더했다(마이그레이션 `20261007000100_team3_initial_data` 와 맞춤).
* **Update**: 핀 요청 화면에 가입 전 직원 안내(WHALEERP-174)를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: staff #3 리뷰 참고 반영 — 이메일 찾기 결과 화면의 「다시 넣기」를 폼 제출로 바꿔 JS 없이도 동작하게 했다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 이메일 찾기 화면 `/email-find`(WHALEERP-179)를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다 — 입력 · 찾음 · 못 찾음 · 막힘, `ApiError.body`, `src/lib/email-find.ts`, 시계를 `(auth)/_components` 로 옮김. api 타입은 api PR #20 기준으로 다시 만들었다.
* **Update**: 머지 블로커 반영 — 운영에서 `TRUSTED_PROXY_HOPS` 가 비었거나 0 이면 기동을 막는 것을 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-13 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 삭제 표시 예외에 노출 대상 연결 표 `post_audiences` 행 삭제를 더했다(재영, api #18).
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-13 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 삭제 표시 예외에 임시저장(`DRAFT`) 근로계약 행 삭제를 더했다(재영).

## 2026-10-12
* **Update**: 3차 리뷰 반영 — `/login?unavailable=1` 재확인(루프 방지), 기동 시 설정 확인(`register`), `ClientIp` 타입 · 고르지 못할 때 경고, 본문 시간 초과를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: api PR #10(BFF 뒤 클라이언트 IP 로 요청 제한)에 맞춰 인증 API 호출에 `X-Forwarded-For` 를 넣는 `client-ip.ts` · `TRUSTED_PROXY_HOPS` 를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 2차 리뷰 반영 — `NetworkError` · 요청 시간 제한 · 서버 오류 로그 · `error.tsx` · `instrumentation.ts`, proxy 의 `?unavailable=1`, `parseAccountCookie` 공용 판정, 로그인 오류 칸 나눔, `getEnumOrEmpty` 를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 리뷰 Minor 반영 — 공개 경로에서 끝난 접속은 쿠키만 지우고 통과, proxy 제외를 `/design` 과 그 아래로 좁힘, 새 비밀번호 400 사유를 첫 칸에 붙임을 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 리뷰 반영 — 핀 시계를 서버 시각에 맞춘 것(`readPinClock`)과 `account` 쿠키가 로그인 시점 값이라는 한계를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 인증 화면을 최신 데모(`docs/demo/src/pages/login`)와 맞춘 것 — 핀 화면의 10분 만료 화면, 새 비밀번호 저장 시간 초과 화면 분리 — 을 [Whale ERP Staff](/whale-erp-staff.md) 의 `(auth)` 줄에 적었다.
* **Update**: main 의 데모 정적 HTML 생성기 전환을 인증 화면 브랜치에 합치며 [Whale ERP Staff](/whale-erp-staff.md) 에서 `src/app/demo` · `scripts/build-demo.mjs` 줄을 지우고 `docs/demo` 줄을 남겼다.

## 2026-10-08
* **Update**: 핀 화면 이메일 가림(LOGIN-9 공통 규칙)과 1분 안 핀 재요청 처리를 [Whale ERP Staff](/whale-erp-staff.md) 의 `password-reset.ts` 줄에 적었다.
* **Update**: 비밀번호 재설정 화면(핀 요청 · 핀 입력 · 새 비밀번호, `password_reset` 쿠키)을 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 에 적었다(WHALEERP-174·175·176).
* **Update**: 만료 안내(`/login?expired=1`)에서 갱신으로 확인한 뒤에만 쿠키를 지우게 바꾼 것을 [Whale ERP Staff](/whale-erp-staff.md) 의 proxy 줄에 적었다.
* **Update**: 리뷰 반영 — 액세스 토큰 쿠키 14분, 세션을 못 읽으면 만료 경로, 데모 빌드의 남은 파일 검사 · Ctrl-C 되돌리기를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 직원 계정 로그인 · 접속 유지(proxy) · 로그아웃과 임시 홈, 세션 쿠키 · openapi 타입 생성 · enum 조회, 공통 부품 `Dock`·`Alert`·`DangerButton`, 데모 빌드에서 실제 앱 치우기를 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 에 적었다(WHALEERP-165·166·167).
* **Update**: 직원 근무 앱 데모를 앱 안 React(`src/app/demo`, `scripts/build-demo.mjs`, Next 정적 내보내기)에서 front 방식 정적 HTML 생성기(`docs/demo/build.mjs`·`src/ui.mjs`·`src/pages`·`assets/staff.js`)로 옮긴 것을 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 절에 적었다(재영).
* **Update**: `2026-09-30-네이밍-규칙.md` 2026-10-08 고침을 [네이밍 규칙](/conventions/naming.md) 에 옮겼다 — 「근무 · 출퇴근」의 근무 유형 4종(`DAY`·`OPEN`·`MIDDLE`·`CLOSE`, enum `work_type`) 줄을 지웠다(재영).
* **Update**: 데모의 핀 화면·새 이메일 인증의 이메일 가림을 이메일 찾기와 같은 규칙으로 맞췄다(2026-10-08) — [Whale ERP Staff](/whale-erp-staff.md) 구조는 그대로.
* **Update**: 데모 로그인의 이메일 찾기 결과(목록·가림 규칙)와 쓸 수 없는 링크 문구를 바꿨다(LOGIN-6·9, 2026-10-08) — [Whale ERP Staff](/whale-erp-staff.md) 구조는 그대로.
* **Update**: `2026-09-30-네이밍-규칙.md` 를 [Naming](/conventions/naming.md) 에 다시 맞췄다. 그동안 들어오지 않았던 10-07 고침(알림 유형·발송 용도 공통코드 폐지 → 템플릿 이름·기본 템플릿 코드 표, 견본 삭제로 바뀐 예시·문장, 근무 유형 4종, 급여 항목 `payslip_item_master`·항목 코드, 수신 설정 묶음 4종, 노출 대상 `service_code`)과 10-08 고침(1팀 `mail_type_code` 비고 → `template_code`, `PUSH_SCHEDULE_CHANGED` 이름 「근무스케줄 변경」)을 넣었다. 본문은 원자료 1~5장을 그대로 옮기고 절 번호만 뺐다(표 줄 차이 0).
* **Update**: 데모 알림 화면의 알림 이름을 「근무스케줄 변경」으로 바꿨다(2026-10-08 재영) — [Whale ERP Staff](/whale-erp-staff.md) 구조는 그대로.
* **Update**: 데모 화면에 복사돼 있던 조각을 `src/app/demo/_components` 로 모으고 DESIGN.md 에 「데모 조각」 절을 더한 것을 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 절에 적었다.
* **Update**: 데모에 2026-10-08 결정(약관 동의·퇴근 기록 없음·계약서 Pretendard·모두 읽음·철회 뒤 카드·PAY-7)을 옮겼다 — [Whale ERP Staff](/whale-erp-staff.md) 구조는 그대로.
* **Update**: 하단 메뉴 다섯 칸(출퇴근 추가, 2026-10-08 재영 결정)과 데모 화면 11개를 [Whale ERP Staff](/whale-erp-staff.md) 에 반영했다.
* **Update**: 데모 화면 목록(2장 home·work·check-in·attendance, 3장 tax)을 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 절에 적었다.
* **Update**: 데모 하단 메뉴(`DEMO_NAV_ITEMS`, 네 칸)를 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 절에 적었다.
* **Update**: 직원 근무 앱 클릭 데모(`src/app/demo`, `scripts/build-demo.mjs`, `docs/demo`)를 [Whale ERP Staff](/whale-erp-staff.md) 의 Layout 절에 더했다.
* **Update**: 견본 콘솔(품목 목록·견본 로그인·계근대 꾸밈)을 걷어 낸 것에 맞춰 [Whale ERP Staff](/whale-erp-staff.md) 의 설명·Layout·Design 절을 고쳤다. `src/lib/api.ts` 는 호출 틀과 세션 쿠키만 남았고 `/` 는 `/design` 으로 보낸다.

## 2026-10-07
* **Update**: `2026-09-30-네이밍-규칙.md` 삭제 표시 절의 예외(`todo_assignees` 는 DELETE, 배정 해제는 `todo_status_histories` 에 기록, 2026-10-07 재영)를 [Naming](/conventions/naming.md) 에 반영했다.
* **Update**: `2026-09-30-네이밍-규칙.md` 「템플릿 사용 여부 · 변수 목록」 줄의 변수 모양에 `isButtonLink`(선택)를 더해 [Naming](/conventions/naming.md) 에 반영했다. 버튼으로 붙는 링크 변수는 이 표시로 「필수 변수는 제목·본문에」 검사에서 뺀다(2026-10-07 재영).
* **Update**: PR 검토를 반영해 누름 칸을 44px 로 넓히고, 근무 탭을 내용과 읽기 연결하고, DESIGN.md 의 그림자·모서리·색·글자 설명을 코드에 맞췄다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 알림 설정 목업(`/design/notification-settings`)과 공통 `Switch`·`SwitchRow` 를 더하고 홈 알림 버튼에서 잇는다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 급여 목업(`/design/pay`)을 더하고 하단 메뉴 급여 칸·홈 급여명세서에서 잇는다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 근무정보 목업에 TO-DO 탭(Figma 07)을 붙이고 TodoList·TodoItem·StatusChip 을 화면 디자인에 맞췄다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 근무정보 목업(`/design/work`)을 더하고 하단 메뉴 지금 칸 아이콘·주간 날짜 셋째 줄·StatusChip 을 화면 디자인에 맞췄다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 출퇴근 현황 목업(`/design/attendance`)과 하루 카드·기간 이동을 더하고, 탭·근무 막대를 화면 디자인에 맞췄다. 목업 화면마다 가이드로 돌아가는 고정 버튼을 붙였다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 목업 화면 사이에 방향 있는 슬라이드(ViewTransition, nav-forward·nav-back)를 붙였다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 출퇴근(GPS) 목업(`/design/check-in`)과 공통 `PageHeader` 를 더했다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 공통 바텀시트(`BottomSheet`·`SheetOption`)를 더하고 홈 목업의 점포 이름에 근무지 고르기 시트를 붙였다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 홈 화면 목업(`/design/home`)을 더하고 하단 메뉴·근무 정보 줄·주간 날짜를 화면 디자인에 맞췄다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 로그인 화면 목업(`/design/login`)과 폭 100% 목업 레이아웃(`design/(mockup)`)을 [Whale ERP Staff](/whale-erp-staff.md) Layout 에 더했다.
* **Update**: 직원앱 Figma 디자인 스타일 가이드를 `src/components/common`·`DESIGN.md`·`/design` 으로 옮겨 [Whale ERP Staff](/whale-erp-staff.md) 에 Design 절과 소스 두 개를 더했다.
* **Update**: `2026-09-30-네이밍-규칙.md` 「고객지원 · 알림」의 알림 템플릿 식별자(알림 템플릿 · 발송 채널 4종 · 템플릿 코드 · 사용 여부 · 변수 목록 · 알림 유형 · 발송 용도)와 `NOTIFICATION_TYPE`·`SEND_PURPOSE` 코드값 표를 [Naming](/conventions/naming.md) 에 옮겼다. 템플릿 코드는 등록 때 기본값을 채우고 플랫폼 운영자가 고칠 수 있다.

## 2026-10-06
* **Update**: `2026-09-30-네이밍-규칙.md` 「화면 문구」 줄의 대상을 「front·staff」로 넓힌 것을 [Naming](/conventions/naming.md) 에 맞췄다.
* **Update**: `2026-09-30-네이밍-규칙.md` FRONT 표의 「화면 문구」 줄을 [Naming](/conventions/naming.md) 에 맞췄다 — enum 한글은 `getEnum(name)` 의 label 을 쓰고 상수 대응표를 두지 않는다.
* **Update**: `2026-09-30-네이밍-규칙.md` 4장 「API 타입·enum 공유」가 새로 쓰여 [Naming](/conventions/naming.md) 의 같은 절을 바꿨다. enum 은 api 가 관리하고 front·staff 는 `GET /enums` 로 조회해 `getEnum(name)` 캐시로 쓴다(생성 파일 `labels.ts` 방식 폐기). 공통코드도 같은 모양(`getCodes`). 요청·응답 타입만 `openapi-typescript` 로 생성.
* **Update**: `2026-09-30-네이밍-규칙.md` 「API 타입·enum 공유」의 원본과 front·staff 생성 기준을 api 가 커밋한 `openapi/openapi.json` 으로 고쳐 [Naming](/conventions/naming.md) 에 반영했다.
* **Update**: `2026-09-30-네이밍-규칙.md` 4장 「API 타입·enum 공유」의 미정 자리가 결정으로 채워져 [Naming](/conventions/naming.md) 에 반영했다. 생성 도구 `openapi-typescript`, api 가 `openapi/openapi.json`·`enum-labels.json` 을 커밋, front·staff 는 `pnpm api:types` 로 생성(`WHALE_API_DIR`, 기본 `../whale-erp-api`), 생성 파일 머리에 api 커밋 해시.
* **Update**: `2026-09-30-네이밍-규칙.md` 4장 끝 「API 타입·enum 공유」(A안, 2026-10-06 재영)를 [Naming](/conventions/naming.md) FRONT 절 끝에 옮겼다. api Swagger 문서에서 타입·enum 을 생성하고, 생성 도구·시점과 한글 대응표 전달 방법은 미정.
* **Update**: `2026-09-30-네이밍-규칙.md` 의 1팀 고침 두 줄을 [Naming](/conventions/naming.md) 에 반영했다. 역할 값을 공통코드 `ROLE_TYPE` 2글자(`PM`·`PA`·`BM`·`BA`·`FM`·`FA`)로, 직원 앱 개인정보 수집 약관 코드를 `STAFF_PRIVACY` 로 바꿨다.
* **Update**: `2026-09-30-네이밍-규칙.md` 머리말에 1팀 변경(커밋 f300ef3·c1a05da)의 「고침」 줄이 더해졌다. 본문 변화가 없어 [Naming](/conventions/naming.md) 은 그대로다.
* **Update**: `2026-09-30-네이밍-규칙.md` 를 front 원자료로 통째 교체한 데 맞춰 [Naming](/conventions/naming.md) 을 다시 맞췄다. 1팀 이름 8곳(`admin` 약어 예외, `bp_code_id`, `role_type_code`/`ROLE_TYPE`, `repeat_end_date`, `effective_start_date`, `public_holiday_synchronization_log`), DB 역할 외래키 `{역할}_by`, 대응표의 직무(`job_title`)·임금계약서(`wage_contract`)·계약서 파일 구분·4대보험 가입 두 칸을 넣었다.

## 2026-10-02
* **Update**: `2026-09-30-네이밍-규칙.md` 의 약관 유형 줄을 1팀 커밋(front c1a05da)대로 고쳐 [Naming](/conventions/naming.md) 「인증 · 계정」 표에 반영했다. `TERMS_TYPE` 6종(BP 회원가입용 둘 · 직원 앱 회원가입용 둘 · 마케팅 · 위치정보).
* **Update**: `2026-09-30-네이밍-규칙.md` 6장이 바뀌어 [Naming](/conventions/naming.md) 범위 절의 원자료 관리 방식을 고쳤다. 날짜 붙인 새 파일이 아니라 한 파일을 제자리에서 고치고, 최신 여부는 「고침」 줄과 이 로그를 비교한다.
* **Update**: `2026-09-30-네이밍-규칙.md` 상태 줄이 바뀌어 [Naming](/conventions/naming.md) 상태 문장에 1팀 영문 식별자·DB 예외는 1팀이 판단하는 영역이라 재영 확인 대상이 아니라고 적었다(2026-10-02 재영).
* **Update**: `2026-09-30-네이밍-규칙.md` 의 1팀 추가분을 [Naming](/conventions/naming.md) 에 반영했다. 약어 예외에 `biz`·`ceo` 를 더하고, DB 절에 「식별자 1팀 예외」 표, 대응표에 「인증 · 계정」「BP · 점포」「설정 · 시스템관리」 세 묶음과 관리자 계정(`admin_account`, 옛 `customers`) 줄을 넣었다. 상태 문장에 1팀 추가분의 근거를 적었다.
* **Update**: [Naming](/conventions/naming.md) 기본키도 `{참조 단수}_id` 로 짓는다(새 테이블부터). 예제·템플릿 테이블 4개의 `id` 는 결함이 아니라 예제라고 적었다(2026-10-02 재영, api 세션에서 정함).
* **Update**: [Naming](/conventions/naming.md) DB 절에 삭제 표시(`is_deleted`) 규칙과 함정 두 가지를 넣고, 시각 예시 `deleted_at` 을 `created_at` 으로 바꿨다(2026-10-02 재영, api 세션에서 정함).

## 2026-10-01

* **Update**: [Naming](/conventions/naming.md) 문서 전체(1~5장)를 2026-10-01 재영 확인으로 확정했다.
* **Update**: [Naming](/conventions/naming.md) 의 영문 식별자 대응표를 2026-10-01 재영 확인으로 표시했다. 1~4장 계층별 규칙은 여전히 제안이다.
* **Update**: `2026-09-30-네이밍-규칙.md` 가 바뀌어 [Naming](/conventions/naming.md) 의 API 절을
  고쳤다. 목록 응답 규칙(`{ items, total }` · `page`·`pageSize` · 빈 결과 · Nest 기본 오류)을
  더하고, `{ code, message }` 오류 규칙과 날짜·시각 형식 줄을 뺐다. 문서 상태는 기획 세션 제안 ·
  재영 검토 전이고 목록 응답만 재영 확인이다.

## 2026-09-30

* **Addition**: `2026-09-30-네이밍-규칙.md` 의 DB·API·FRONT 규칙과 용어집 영문 식별자
  대응표를 [Naming](/conventions/naming.md) concept 으로 옮겼다. 세 저장소가 같은 경로를 쓴다.

## 2026-08-31

* **Update**: 원격 저장소가 붙어 [Whale ERP Staff](/whale-erp-staff.md) 의 resource 를 실제 주소(whale-erp-new-staff)로 정정했다.

## 2026-08-28

* **Initialization**: Created the OKF v0.2 bundle root and the [Whale ERP Staff](/whale-erp-staff.md) concept.
