// 서버 액션이 api 오류를 화면 문구로 바꿀 때 같이 쓰는 문구와 판정. 순수 계산이라 node --test 가 직접 읽는다(값 import 없음).
// ApiError · NetworkError 를 이 모양으로 바꾸는 것은 src/lib/api.ts 의 failureOf 다.

/** api 호출의 실패. 응답이 왔으면 상태 코드와 메시지, 닿지 못했으면(연결 실패 · 시간 초과) "network". */
export type ApiFailure = { status: number; message: string } | "network";

/** 화면 문구와 붙일 자리. 오류 문구는 늘 자리와 함께 다녀 「문구는 있는데 아무 데도 안 보이는」 상태를 만들지 않는다. */
export interface Problem<Field extends string> {
  field: Field;
  message: string;
}

export const RETRY_LATER = "잠시 뒤 다시 시도해 주세요";
export const CONNECTION_FAILED = `서버에 연결하지 못했습니다. ${RETRY_LATER}`;
export const RATE_LIMITED = `시도가 많아 잠시 막았습니다. ${RETRY_LATER}`;
/** 다시 해도 풀리지 않는 서버 실패(설정 · 템플릿 · DB). 「잠시 뒤 다시」 대신 알리게 한다. */
export const REPORT_IF_REPEATED = "계속되면 근무지 점포에 알려 주세요";

/**
 * 한글이 든 api 메시지인지. 서비스가 직접 던지는 사유는 한글이고, 형식 검증(class-validator) · 요청 한도 가드 · Nest 기본 본문은
 * 영어 원문이다. 한글일 때만 화면에 그대로 보인다.
 */
export const isHangulReason = (message: string) => /[가-힣]/.test(message);
