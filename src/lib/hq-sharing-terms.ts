// 사업자(본사) 제공 동의 내용(ATT-30, 데모 me 의 bpshare 시트). 동의 문구를 내려 주는 api 가 아직 없어 데모 문구를 그대로 둔다(ATT-8
// 법무 검토 중). 받는 자의 가맹본부 이름은 api 가 주지 않아 뺐다. 내 정보 카드의 내용 시트와 홈의 다시 동의 팝업이 같이 쓴다.
/**
 * 이 앱이 보이는 위 문구의 버전 — api 의 사업자 제공 동의 버전(HQ_SHARING_CONSENT_VERSION)과 같게 둔다. 문구를 바꾸면 함께 올린다.
 * 다시 동의 팝업의 「다음에 하기」가 이 값을 기억한다(본 문구를 닫았다). 동의를 보낼 때 「본 문구 버전」으로 싣는다(ATT-30 v252) — 문구가
 * 이 번들에 묶여 있어 화면이 보인 버전이 곧 이 값이다. 서버 액션도 화면이 보낸 값이 아니라 이 값을 싣는다.
 */
export const HQ_SHARING_TERMS_VERSION = "v1.0";

export const HQ_SHARING_TERMS = [
  ["받는 자", "가맹본부"],
  ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
  ["목적", "가맹점 운영 지원과 점검"],
  ["보유 기간", "철회 또는 가맹 관계 종료까지"],
] as const;

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
