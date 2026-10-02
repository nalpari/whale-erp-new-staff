# Bundle history

## 2026-10-02
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
