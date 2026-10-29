// 사업자 제공 다시 동의 팝업(ATT-30 v252, 2026-10-29 재영)의 「다음에 하기」 기억. 닫은 문구 버전을 이 탭(sessionStorage)에 둔다 —
// 앱을 새로 열면 잊어 다시 뜬다. 백그라운드에서 오래 있다 돌아오면 홈 팝업이 서명 요청 기억과 함께 지운다(화면으로 돌아올 때 다시 묻는다).
// 로그인할 때 잊는다(forgetHqReconsentPopup). 저장소 다루기는 popup-memory.ts.
import { createPopupMemory } from "./popup-memory.ts";

const memory = createPopupMemory("staff:hq-reconsent-popup-dismissed");

export const readHqReconsentSeen = memory.read;
/** 「다음에 하기」 — 본 문구 버전을 기억한다. 이 탭에서는 같은 문구로 다시 묻지 않고, 문구가 바뀌거나 새로 열거나 돌아오거나 로그인하면 다시 묻는다. */
export const rememberHqReconsentSeen = memory.remember;
export const forgetHqReconsentPopup = memory.forget;
export const subscribeHqReconsentSeen = memory.subscribe;
