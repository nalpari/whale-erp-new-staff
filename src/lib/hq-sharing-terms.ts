// 사업자(본사) 제공 동의 내용(ATT-30, 데모 me 의 bpshare 시트). 동의 문구를 내려 주는 api 가 아직 없어 데모 문구를 그대로 둔다(ATT-8
// 법무 검토 중). 받는 자의 가맹본부 이름은 api 가 주지 않아 뺐다. 내 정보 카드의 내용 시트와 홈의 다시 동의 팝업이 같이 쓰고, 가입 ·
// 근무지 추가 · 소속 추가의 체크 칸 아래 요약(hqSharingSummary)도 여기 두어 같은 버전으로 묶는다 — 문구를 바꾸면 함께 고치고 버전을 올린다.
/**
 * 이 앱이 보이는 이 파일 문구의 버전 — api 의 사업자 제공 동의 버전(HQ_SHARING_CONSENT_VERSION)과 같게 둔다. 문구를 바꾸면 함께 올린다.
 * 다시 동의 팝업의 「다음에 하기」가 이 값을 기억한다(본 문구를 닫았다). 동의를 보낼 때 「본 문구 버전」으로 싣는다(ATT-30 v252) — 화면이
 * 그린 번들의 값을 동의 버튼 · 폼의 숨은 칸으로 실어 보낸다(위치정보 termsVersion 과 같다). 서버 액션의 값을 쓰면 배포가 겹칠 때 옛 화면의
 * 동의가 새 버전으로 남는다. 서버 액션은 형식만 거르고 판정은 api 가 한다(다르면 409 · 가입 · 수락은 남기지 않음).
 *
 * 문구 버전은 api 와 앱을 함께 배포한다 — api 만 먼저 올라가면 새로 고쳐도 옛 문구라 동의를 받을 수 없다.
 */
export const HQ_SHARING_TERMS_VERSION = "v1.0";

export const HQ_SHARING_TERMS = [
  ["받는 자", "가맹본부"],
  ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
  ["목적", "가맹점 운영 지원과 점검"],
  ["보유 기간", "철회 또는 가맹 관계 종료까지"],
] as const;

/** 가입 · 근무지 추가 · 소속 추가의 체크 칸 아래 요약. flow 는 그 흐름의 이름(「가입」 · 「소속 추가」) */
export const hqSharingSummary = (flow: string) =>
  `가맹본부가 내 근무 정보(근로계약 · 근무스케줄 · 출퇴근 기록 · 급여명세서)를 개인 단위로 보는 것에 동의합니다. 동의하지 않아도 ${flow}와 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. 내 정보에서 언제든 철회할 수 있습니다.`;

/** 화면이 실어 보낸 문구 버전 — 비지 않은 64자 이하 문자열만(api 와 같은 형식). 아니면 undefined 라 싣지 않는다(api 는 동의를 남기지 않는다) */
export const parseHqSharingVersion = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw !== "" && raw.length <= 64 ? raw : undefined;

/**
 * 가입 · 근무지 추가 · 소속 추가가 동의를 남기지 못했을 때(api 응답 hqSharingConsentRecorded false — 보인 문구 버전이 api 의 지금 버전과
 * 다름, ATT-30 v253) 완료 화면 주소에 싣는 값. 가입 · 수락은 마쳤다 — 사업자 제공 동의는 선택이라 api 가 막지 않는다. 주소로 들어오는
 * 값이라 이 한 값만 받는다(남이 만든 링크로 띄워도 안내 한 줄이다).
 */
export const HQ_NOT_RECORDED = { key: "hq", value: "not-recorded" } as const;

/** 완료 화면 쿼리에서 「동의를 남기지 못함」인가 — 정한 값 하나만 참이다. 여러 번 실린 값은 받지 않는다 */
export const isHqNotRecorded = (value: string | string[] | undefined) => value === HQ_NOT_RECORDED.value;

/** 완료 화면의 안내 — 앱 문구가 번들이라 새로 고쳐야 바뀐 내용이 보인다 */
export const HQ_NOT_RECORDED_NOTICE =
  "사업자 제공 동의 내용이 바뀌어 이번 동의는 남지 않았습니다. 화면을 새로 고친 뒤 내 정보에서 바뀐 내용을 확인하고 다시 동의해 주세요.";
