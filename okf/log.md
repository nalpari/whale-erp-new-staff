# Bundle history

## 2026-10-23
* **Update**: 1 · 2차 · PR #26 리뷰 반영 — 신고 정보 고치기 서버 액션이 먼저 조회해 신고 정보가 없으면 저장하지 않고(첫 입력은 150), 값을 고치거나 다시 보내는 동안 지난 서버 오류를 가린다. 주민등록번호 뒷자리 칸을 비밀번호 칸이 아닌 CSS 가림 칸으로 바꿔 브라우저 「비밀번호 저장」을 막고, 503 은 고정 문구, 로그에 api code 를 남긴다. 고치기 폼에 서버 액션 action 을 두어 하이드레이션 전 제출이 GET(원문이 주소에)이 아니라 POST 가 된다(소속 id bind 는 서버 화면으로 옮김 — 클라이언트 bind 는 그 POST 에 서버가 멈췄다). 고치기에 「지금 비밀번호」 확인을 더하고(api 334 후속 `currentPassword` · `CURRENT_PASSWORD_MISMATCH`, 노영주 10-23) api 타입을 api tentacool(machu) 기준으로 다시 만들었다. 주민등록번호 뒷자리 칸의 복사 · 잘라내기 · 끌어 옮기기를 막고, 저장 뒤 보기 조회가 실패해도 `?changed=1` 을 지우고 저장됐다고 알린다(#26 참고) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 신고 정보 「새로 넣기」를 열었다(WHALEERP-333, api 334 `PUT /me/memberships/:staffMemberId/tax-profile`) — `/me/memberships/[staffMemberId]/tax-profile/edit` 에서 주민등록번호만 · 급여 계좌만 · 둘 다 고치고, 신고 정보가 없으면 버튼이 없다(첫 입력은 150). 입력 칸 · 보기 조각을 `src/app/_components/tax-profile-*` 로 나누고 `ApiFailure` 에 본문 `code` 를 더했다 — [Whale ERP Staff](/whale-erp-staff.md).

## 2026-10-22
* **Update**: `getEnum` · `getCodes` 맨 앞에 `connection()` 을 두어 enum · 공통코드를 쓰는 화면(`/me/memberships` 등)을 요청 때 그린다 — 이 조회는 요청 API(쿠키 등)를 쓰지 않아, 같은 화면이 쿠키를 읽어도 그보다 먼저 프리렌더에서 api 를 불러 `API_BASE_URL` 없이 빌드하는 Jenkins 의 `pnpm build` 가 멈췄다(재영 2026-10-22). 캐시(enum 한 시간 · 공통코드 10분)는 그대로 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: #22 재리뷰 후속 — 가입 액션의 로그인 판정을 proxy 와 같은 로그인 흔적(account 쿠키)으로 맞췄다. 갱신을 확인하지 못한 로그인으로 가입해 쿠키를 덮지 않는다. 끝난 접속은 proxy 가 요청 쿠키에서도 지워 가입이 막히지 않는다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: #22 리뷰 반영 — 로그인 상태 가입 화면 돌려보내기를 화면 요청(GET)만으로 좁히고 가입 액션이 스스로 세션을 보게 했다. 초대 링크는 토큰이 홈 주소에 남지 않게 액션이 보내고, 갱신을 확인하지 못한 로그인도 막는다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 로그인돼 있으면 가입 화면(`/join` · `/invite`, 가입 완료 빼고)을 홈으로 보낸다 — 로그인한 채로 가입하면 앞 계정 접속을 끊지 않고 쿠키만 덮어서다(#18 리뷰 참고 6, 2026-10-22 김민식) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: #18 리뷰 반영 — 계정 등록에서 만 19세 미만으로 보이는 생년월일은 보내기 전에 한 번 더 확인받고(ACC-22, 재영 2026-10-22), 가입 완료 화면에 넘기는 근무지 이름을 글자 단위로 잘라 이모지 경계 쿠키 오류를 막았다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 진입 · 가입 화면(WHALEERP-141 · 142)을 더했다 — 로그인 화면의 「초대 코드로 가입」 → `/join`(초대 코드 · 30분 잠금) · 초대 링크 `/invite#token=…` → `/join/invitation`(초대 확인) → `/join/signup`(계정 등록) → `/join/done`(가입 완료). 확인한 초대는 쿠키 `invitation`(Path `/join`)로 들고 다니고, 공개 경로에 `/join` · `/invite` 를 더했다. 약관 동의 칸은 api 가 받지 않아 뺐다. 주소 검색 시트와 읽기 전용 칸을 `src/app/_components/` 로 옮겨 내 정보와 같이 쓰고, api 타입을 api main(3e5a224) 기준으로 다시 만들었다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 급여 탭 명세서 목록 순서가 급여 기간 최신순(같은 달이면 받은 날 최신순)으로 바뀌었다(api, PAY-8, 2026-10-22 재영) — 앱 코드는 api 순서를 그대로 써 주석 · 문서만 고쳤다 — [Whale ERP Staff](/whale-erp-staff.md).

## 2026-10-21
* **Update**: 확정 취소된 명세서의 배지 · 안내 이름을 「정정 중」에서 「검토 중」으로 바꿨다(2026-10-21 사용자 결정) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 보낸 뒤 확정을 취소한 명세서를 목록 · 상세에 「정정 중」(연필 아이콘)으로 남기고 금액 · 항목 · 내보내기를 숨긴다(api `correcting`, 2026-10-21 사용자 결정) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: PR 리뷰 반영 — 안내 시트의 「시스템이 계산」 문단은 출퇴근 연결(WHALEERP-227) 전이라 완성 기준 문구임을 적고, 명세서 번호 검사 테스트를 더했다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 급여 화면을 바뀐 데모(PAY-8 · 9 · 10 · 20)에 맞췄다 — 맨 위 이번 달에 받은 실지급액 합계 카드, 점포 · 연도 필터 칩, 줄마다 점포 · 발송일(api `sentAt`), 처리 이력은 가장 최근 발송 한 줄과 확정 취소만, 다시 발송 안내 삭제, 「발송 완료」 칩은 늘 보인다(사용자 결정). 안내 시트에 맨 위 금액의 기준을 더했다. 기본급 · 주휴수당 · 연장수당의 출퇴근 데이터 연결은 아직 없다(추후 작업). 알려진 한계: 「명세서 내보내기」가 `download` 링크라 세션 만료 · 오류 응답이 화면에 보이지 않는다(후속). [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 165 리뷰 반영 — 429 판정 · 남은 시간 판정을 `attempt-lock.ts`(`lockOf` · `lockCountdown` · `AttemptLock`)로 모으고 해제 시각을 읽지 못하면 남김, `formatLeft` 를 `time-left.ts` 로 옮겨 테스트, 잠금 화면 제목 초점, 재설정 화면의 이메일 찾기 링크를 본문에 적음 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 로그인 잠금 화면에 api 429 의 `lockExpiresAt` 까지 남은 시간을 보이고 잠금 판정을 메시지 대신 그 값으로, 이메일 찾기 진입을 비밀번호 재설정 화면의 이메일 칸 아래에 붙였다(WHALEERP-165) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 이메일 아이디 변경 첫 단계에 지금 비밀번호를 받는다(WHALEERP-607, api 계약 kyoto-61) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: PR #11 리뷰 반영 — api main(115ad5f) 기준으로 타입 재생성, 우편번호 스크립트는 「검색」을 누른 뒤에만, 이메일 변경 뒤 저장된 아이디는 먼저 지우고 다시 읽기 실패는 삼킴 — [Whale ERP Staff](/whale-erp-staff.md).

## 2026-10-20
* **Update**: 이메일 변경 뒤 저장된 아이디는 내 정보에서 다시 읽은 값으로 바꾼다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: api 2차 리뷰(kyoto-61)에 맞춰 이메일 인증번호 받기 500 의 한글 사유(메일 설정 문제)를 그대로 보인다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: PR 리뷰(review-pr) 반영 — 위치정보 약관 없음(404)과 일시 장애를 나누고 약관 캐시를 끔, 동의 버튼의 서버 오류는 오류 번호와 함께, 이메일 확인 500 문구, 오류 문구를 자리와 묶은 상태 타입(`Problem`)과 실패 처리 순수 함수 · 테스트(`action-errors` · `email-change` · `password-change` · `login-input` · `session-cookies`), 약관 파서 경계(날짜 줄 · 빈 제목 · 표 칸 수 · 목록 시작 번호), 홈 이메일을 내 정보에서, 견본 · 목업의 30일 안내 정리, 낡은 주석 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: api 리뷰 반영(kyoto-61)에 맞춰 이메일 핀 요청 500(다시 해도 안 풀림) · 위치정보 동의 500(약관 없음, 한글 사유) 문구를 나눴다 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 위치정보 · 본사 제공 동의를 약관(내용) 시트 안의 「동의합니다」로만 받게 바꿨다(고지 후 동의, 노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 로그인한 화면의 오류 화면에 로그아웃을 두고, 내 정보 · 신고 정보의 날짜를 「2025년 11월 3일」로 통일했다(노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 코드 리뷰 반영 — 약관 Markdown 파서 무한 루프(깨진 표) 수정과 `src/lib/terms-markdown.ts` 분리 · 테스트, 내 정보 수정 호출에 클라이언트 IP, 이메일 변경 뒤 저장된 아이디 갱신, 주소는 바뀌었을 때만 저장 — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 공통 `TextField` 의 비밀번호 칸에 보이기 · 감추기 눈 버튼을 더했다(로그인 · 재설정 · 비밀번호 변경 모두, 노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 신고 정보 화면을 데모 `docs/demo/tax` 의 view 대로 다시 만들었다(받은 근거 · 사업주 위탁 안내 · 새로 넣기 준비 중, 노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 로그인에 아이디 저장(`saved_email`) · 자동 로그인(`rememberMe`, 켜면 30일 · 끄면 7일, 쿠키도 api 만료 시각 그대로, api dragonite) 체크 박스와 공통 `CheckBox` 를 더했다(노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 로그인 화면(기본 · `?expired=1` 만료 안내)에서 「30일 동안 다시 묻지 않습니다」 안내 판을 모두 뺐다(노영주) — [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 비밀번호 변경 `/me/password`(WHALEERP-194, 6개월 권유)와 이메일 변경 `/me/email`(WHALEERP-195)을 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다. 새 비밀번호 칸 · 남은 시간 시계를 `src/app/_components/` 로 옮겼다.
* **Update**: 내 정보 `/me`(WHALEERP-193, 데모 me 의 view 순서)와 소속 근무지 `/me/memberships` · 소속별 신고 정보 `/me/memberships/[staffMemberId]/tax-profile`, 주소 검색 · 저장, 위치정보 · 본사 제공 동의 바꾸기, 로그아웃 이동(WHALEERP-167), 공통 `Toast`, `getCodes` 를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다. api 타입은 api dragonite 브랜치(확정된 내 정보 수정 · 동의 경로) 기준으로 다시 만들었다.

## 2026-10-19
* **Update**: PAY-2 「명세서 내보내기」가 실제 PDF 를 받는다 — 버튼을 `download` 링크로 바꾸고(가짜 알림 삭제), 라우트 핸들러 `src/app/(app)/pay/[payslipId]/pdf/route.ts` 가 api `GET /me/payslips/:id/pdf` 를 직원 토큰으로 불러 그대로 내려준다(401 → 만료 로그인, 404 → 404). [Whale ERP Staff](/whale-erp-staff.md).
* **Update**: 급여 화면을 실제 api(`GET /me/payslips` · `/me/payslips/:id`, WHALEERP-330)로 바꿨다 — `payslips.mock.ts` · `isViewable` · `splitLatest` · 화면용 `display` 값(계산 근거 · 해당 없음 · 정정됨)을 지우고, 원천징수 줄은 관리자 화면과 같은 `isItemShown` 으로 고른다. `api-types.d.ts` 를 다시 만들었다([Whale ERP Staff](/whale-erp-staff.md)).
* **Update**: 직원 앱 급여 화면 `/pay` · `/pay/[payslipId]`(데모 pay 이식, 가짜 값 `src/lib/payslips.mock.ts`), 순수 함수 `src/lib/payslip-rules.ts` 를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다.
* **Update**: 근무정보 `/work` 뼈대와 TO-DO 탭 · 상세 시트 · 홈 TO-DO 카드(#119·#120·#121·#316)를 [Whale ERP Staff](/whale-erp-staff.md) 에 적었다. api 타입은 api TO-DO 브랜치 기준으로 다시 만들었다.
* **Update**: staff #8 리뷰 반영 — 하단 메뉴의 화면 없는 칸을 「준비 중」으로 막았다(`ready: false`), [Whale ERP Staff](/whale-erp-staff.md).

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
