# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

두 부류가 같은 화면을 쓴다 (사용자 확인).

- 사무실 관리자: 데스크톱, 실내 조명, 오래 본다.
- 현장/창고 직원: 태블릿, 밝은 조명과 서서 쓰는 상황.

## Product Purpose

whale-erp-api 의 품목과 재고를 다루는 직원 전용 콘솔. 고객용 whale-erp-front 와 같은
API 를 쓰되 `staff` 토큰으로만 들어간다. 성공은 직원이 로그인해서 품목의 현재 재고를
바로 확인하는 것.

## Positioning

재고는 별도 컬럼이 아니라 `stock_movements` 합계로 유도된다. 즉 이 콘솔이 보여주는
숫자는 입력값이 아니라 이동 이력의 결과다. (그 밖의 포지셔닝은 미결정.)

## Operating Context

- 로그인(`POST /auth/staff/login`) → 품목 목록(`GET /items`).
- 액세스 토큰 15분, 만료되면 다시 로그인. 리프레시 회전은 아직 미구현.
- API 에 CORS 설정이 없어 브라우저 직접 호출이 막힌다. 모든 호출은 서버 사이드.
- 회원가입 API 가 없다. 직원 계정은 운영자가 스크립트로 만든다.

## Capabilities and Constraints

- 구현됨: staff 로그인, 로그아웃(리프레시 토큰 폐기), 품목 목록(최대 200건).
- API 에 있으나 화면 미구현: 품목 등록·수정·삭제, 재고 이동 기록.
- 목록은 페이지네이션 파라미터(take/skip)만 있고 총 건수 API 가 없다.
- 용어: 품목(item), SKU, 단위(EA/KG/M/BOX), 재고(stock), 재고 이동(stock movement).

## Brand Commitments

없음 (사용자 확인). 고정된 것은 제품명 "Whale ERP" 뿐. 로고·지정색·지정 서체 없음.

## Evidence on Hand

- 실제 품목 데이터 2건: `WIRE-COIL-5T` 강선 코일 5T (재고 99, EA),
  `PLATE-SS400` 열연강판 SS400 (재고 0, EA). 취급 품목은 철강 자재다.
- 실제 직원 계정 1개: `admin@whale.test` / 이름 "관리자".
- 로고, 사진, 고객사, 매출, 인증 자료 없음. 지어내지 말 것.

## Product Principles

1. 재고 숫자가 화면의 주인공이다. 장식이 숫자를 이기면 안 된다.
2. 같은 화면이 데스크톱과 태블릿 양쪽에서 제 몫을 해야 한다.
3. 화면은 API 가 실제로 주는 것만 말한다. 없는 지표를 그리지 않는다.
4. 실패(로그인 실패, 토큰 만료, API 다운)는 숨기지 않고 다음 행동을 알려준다.

## Accessibility & Inclusion

밝은 조명의 현장에서 태블릿으로 읽는 상황이 기준. 본문 대비 4.5:1 이상, 터치 타깃
44px 이상, 키보드만으로 로그인과 목록 이동이 가능해야 한다.
