// 서명 요청 팝업(WHALEERP-148)의 「다음에 하기」 기억. 닫은 계약(sign-request-seen.ts 의 key)을 이 탭(sessionStorage)에만 둔다 —
// 서명하기 전까지 앱을 열 때마다 다시 띄운다(HOME-4). 앱을 새로 띄우면 저장소가 비어 다시 뜨고, 백그라운드에서 10분 넘게 있다가 다시
// 보이면(설치한 홈 화면 앱을 다시 띄움) 홈 팝업이 홈을 다시 받은 뒤 기억을 지운다(onVisibilityChange · takeSignRequestReopen) —
// 지난 서버 데이터로 팝업을 띄우지 않게. 로그인할 때 잊는다(forgetSignRequestPopup).
import { createPopupMemory } from "./popup-memory.ts";
import { mergeSignRequestSeen, onVisibilityChange } from "./sign-request-seen.ts";

const memory = createPopupMemory("staff:sign-request-popup-dismissed");
const reopenListeners = new Set<() => void>();

let hiddenAt: number | null = null;
/** 백그라운드에서 오래 있다 다시 보였다 — 홈 팝업이 가져가(takeSignRequestReopen) 홈을 다시 받은 뒤 기억을 지울 때까지 남는다. */
let reopenPending = false;
let watching = false;

/**
 * 화면 보임을 지켜본다 — 홈 팝업이 처음 구독할 때 한 번 걸고, 홈을 떠나도 남겨 둔다. 여기서는 숨은 시각을 기록하고 「다시 엶」만
 * 표시한다. 기억 지우기와 홈 다시 받기는 홈 팝업이 홈에 있을 때 한다 — 다른 화면에서 돌아오면 홈이 다시 그려질 때(마운트) 판단한다.
 */
function watchVisibility() {
  if (watching || typeof document === "undefined") return;
  watching = true;
  document.addEventListener("visibilitychange", () => {
    const next = onVisibilityChange(hiddenAt, document.visibilityState === "hidden" ? "hidden" : "visible", Date.now());
    hiddenAt = next.hiddenAt;
    if (!next.reopened) return;
    reopenPending = true;
    reopenListeners.forEach((listener) => listener());
  });
}

export const readSignRequestSeen = memory.read;
/** 「다음에 하기」 — 이미 닫은 것에 지금 기다리는 계약을 더해 기억한다. */
export const rememberSignRequestSeen = (key: string) => memory.remember(mergeSignRequestSeen(key, memory.read()));
export const forgetSignRequestPopup = memory.forget;
export const subscribeSignRequestSeen = (listener: () => void) => {
  watchVisibility();
  return memory.subscribe(listener);
};
/** 「앱을 다시 엶」 표시를 가져간다(한 번만 참). */
export function takeSignRequestReopen(): boolean {
  const pending = reopenPending;
  reopenPending = false;
  return pending;
}
/** 홈에 있는 동안 「앱을 다시 엶」을 듣는다. */
export const subscribeSignRequestReopen = (listener: () => void) => {
  watchVisibility();
  reopenListeners.add(listener);
  return () => {
    reopenListeners.delete(listener);
  };
};
