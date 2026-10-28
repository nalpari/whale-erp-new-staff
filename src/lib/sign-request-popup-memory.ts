// 서명 요청 팝업(WHALEERP-148)의 「다음에 하기」 기억. 닫은 계약 묶음(sign-request.ts 의 key)을 이 탭(sessionStorage)에만 둔다 —
// 서명하기 전까지 앱을 열 때마다 다시 띄운다(HOME-4). 로그인할 때 잊는다(forgetSignRequestPopup).
import { createPopupMemory } from "./popup-memory.ts";

const memory = createPopupMemory("staff:sign-request-popup-dismissed");

export const readSignRequestSeen = memory.read;
export const rememberSignRequestSeen = memory.remember;
export const forgetSignRequestPopup = memory.forget;
export const subscribeSignRequestSeen = memory.subscribe;
