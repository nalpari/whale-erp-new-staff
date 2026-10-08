# Product

<!-- impeccable:product-schema 1 -->

## Platform

mobile (직원 휴대전화). 지금 저장소의 화면은 웹으로 그린 목업이다.

## Users

직원 근무 앱 사용자는 **직원**(정직원 · 파트타이머)이다. 자기 휴대전화로 쓴다.
관리자(BP 마스터·BP 관리자·가맹마스터·가맹관리자)는 관리자 웹(`whale-erp-front`)을 쓴다.

## Product Purpose

직원이 초대를 받아 가입하고, 근로계약서에 날인하고, 점포에서 출퇴근을 등록하고,
근무스케줄·TO-DO·급여명세서를 확인하는 앱. 근거: `docs/mockup/index.html`.

## Positioning

(미결정.)

## Operating Context

- 화면 기준은 `docs/mockup/`(목업 12화면, 쟁점 포함)과 `docs/flow/`(유저플로우)다.
  하단 탭은 홈 · 근무 · 출퇴근 · 급여 · 내 정보 다섯 개다.
- 출퇴근은 휴대전화에서 GPS 로 판정하고 좌표는 서버로 보내지 않는다. 첫 출근 등록 때
  위치정보 동의를 필수로 받는다(용어집 「GPS 판정」·「위치정보 동의」).
- API 는 `whale-erp-api`. 주소는 `API_BASE_URL`, 호출은 모두 서버에서 한다(`src/lib/api.ts`).
  enum 은 `GET /enums` 로 받고, 요청·응답 타입은 api 의 `openapi/openapi.json` 에서 생성한다
  (`okf/conventions/naming.md` 「API 타입·enum 공유」).

## Capabilities and Constraints

- 구현됨: 디자인 견본(`/design`)과 화면 목업(`/design/login` · `home` · `check-in` · `attendance`
  · `work` · `pay` · `notification-settings`). 인증·API 를 부르지 않는다.
- 아직 없음: 로그인. 직원 계정(`accounts`)으로 3팀이 새로 만든다. 그 전까지 `/` 는 `/design` 으로 보낸다.
- 견본 콘솔(품목 목록 · `POST /auth/staff/login`)은 2026-10-08 걷어 냈다(`docs/plans/2026-10-08-견본-제거.md`).
- 용어는 `whale-erp-v2/CLAUDE.md` 용어집, 영문 이름은 `okf/conventions/naming.md` 를 따른다.
