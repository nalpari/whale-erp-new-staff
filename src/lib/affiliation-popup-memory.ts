// 소속 추가 요청 팝업(WHALEERP-144)의 「다음에 하기」 기억. 본 요청 id 를 이 탭(sessionStorage)에 둔다 — 앱을 새로 열면 잊는다.
// 로그인 화면이 로그인할 때 잊게 하고(forgetAffiliationPopup) 홈 팝업이 읽고 쓴다. 브라우저에서만 부른다(테스트는 sessionStorage 를 꾸며 넣는다).
import { mergeSeenKey } from "./affiliation-requests.ts";

const STORAGE_KEY = "staff:affiliation-popup-dismissed";
const listeners = new Set<() => void>();
/** 저장소 쓰기가 실패했을 때 이 화면에서만 기억하는 값. 쓰기가 다시 성공하면 비운다. */
let memory: string | null = null;

function readStorage(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // 저장소를 막은 브라우저 — 기억하지 못할 뿐 팝업은 뜬다.
    return null;
  }
}

/** 이미 본(닫은) 요청 id 묶음. */
export const readSeen = () => memory ?? readStorage();

/** 「다음에 하기」 — 본 요청에 지금 요청을 더해 기억하고 팝업에 알린다. */
export function rememberSeen(key: string) {
  const seen = mergeSeenKey(key, readSeen());
  let wrote = false;
  try {
    sessionStorage.setItem(STORAGE_KEY, seen);
    // 쓰기가 됐어도 다시 읽혀야 저장소만 믿는다 — 쓰기는 되는데 읽기가 던지는 환경에서 화면 안 값을 비우면 닫은 팝업이 다시 뜬다.
    wrote = sessionStorage.getItem(STORAGE_KEY) === seen;
  } catch {
    // 저장소를 막은 브라우저 — 화면 안에만 둔다.
  }
  // 저장소에 남았으면 화면 안 값을 비운다(남겨 두면 readSeen 이 옛 값을 먼저 읽는다). 아니면 화면 안에만 둔다.
  memory = wrote ? null : seen;
  listeners.forEach((listener) => listener());
}

/**
 * 로그인할 때 본 요청을 잊는다 — 로그아웃 · 접속 만료 · 비밀번호 재설정 어느 길로 끝났든 다시 로그인하면 팝업이 뜬다.
 * 로그인을 보낼 때 부르므로 실패한 시도에도 잊지만, 그 뒤 팝업이 한 번 더 뜰 뿐이다.
 */
export function forgetAffiliationPopup() {
  memory = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 막은 브라우저 — 기억한 것도 없다.
  }
}

export const subscribeSeen = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
