// 서명 요청 팝업(WHALEERP-148)의 「다음에 하기」 기억. 닫은 계약 묶음(sign-request.ts 의 key)을 이 탭(sessionStorage)에만 둔다 —
// 서명하기 전까지 앱을 열 때마다 다시 띄운다(HOME-4). 앱을 새로 띄우면 저장소가 비어 다시 뜨고, 백그라운드에서 10분 넘게 있다가 다시
// 보이면(설치한 홈 화면 앱을 다시 띄움) 기억을 지워 다시 뜬다(onVisibilityChange). 로그인할 때 잊는다(forgetSignRequestPopup).
import { createPopupMemory } from "./popup-memory.ts";
import { onVisibilityChange } from "./sign-request.ts";

const memory = createPopupMemory("staff:sign-request-popup-dismissed");

let hiddenAt: number | null = null;
let watching = false;

/** 화면 보임을 지켜본다 — 팝업이 처음 구독할 때 한 번 걸고, 홈을 떠나도 남겨 둔다(다른 화면에서 돌아와도 같은 규칙). */
function watchVisibility() {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", () => {
    const next = onVisibilityChange(hiddenAt, document.visibilityState === "hidden" ? "hidden" : "visible", Date.now());
    hiddenAt = next.hiddenAt;
    if (next.forget) memory.forget();
  });
}

export const readSignRequestSeen = memory.read;
export const rememberSignRequestSeen = memory.remember;
export const forgetSignRequestPopup = memory.forget;
export const subscribeSignRequestSeen = (listener: () => void) => {
  watchVisibility();
  return memory.subscribe(listener);
};
