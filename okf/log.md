# Bundle history

## 2026-10-07
* **Update**: 근무정보 목업(`/design/work`)을 더하고 하단 메뉴 지금 칸 아이콘·주간 날짜 셋째 줄·StatusChip 을 화면 디자인에 맞췄다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 출퇴근 현황 목업(`/design/attendance`)과 하루 카드·기간 이동을 더하고, 탭·근무 막대를 화면 디자인에 맞췄다. 목업 화면마다 가이드로 돌아가는 고정 버튼을 붙였다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 목업 화면 사이에 방향 있는 슬라이드(ViewTransition, nav-forward·nav-back)를 붙였다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 출퇴근(GPS) 목업(`/design/check-in`)과 공통 `PageHeader` 를 더했다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 공통 바텀시트(`BottomSheet`·`SheetOption`)를 더하고 홈 목업의 점포 이름에 근무지 고르기 시트를 붙였다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 홈 화면 목업(`/design/home`)을 더하고 하단 메뉴·근무 정보 줄·주간 날짜를 화면 디자인에 맞췄다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 로그인 화면 목업(`/design/login`)과 폭 100% 목업 레이아웃(`design/(mockup)`)을 [Whale ERP Staff](/whale-erp-staff.md) Layout 에 더했다.
* **Update**: 직원앱 Figma 디자인 스타일 가이드를 `src/components/common`·`DESIGN.md`·`/design` 으로 옮겨 [Whale ERP Staff](/whale-erp-staff.md) 에 Design 절과 소스 두 개를 더했다.

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
