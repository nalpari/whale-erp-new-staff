// 소속 추가 요청 팝업(WHALEERP-144)의 「다음에 하기」 기억. 본 요청 id 를 이 탭(sessionStorage)에 둔다 — 앱을 새로 열면 잊는다.
// 로그인 화면이 로그인할 때 잊게 하고(forgetAffiliationPopup) 홈 팝업이 읽고 쓴다. 저장소 다루기는 popup-memory.ts.
import { mergeSeenKey } from "./affiliation-requests.ts";
import { createPopupMemory } from "./popup-memory.ts";

const memory = createPopupMemory("staff:affiliation-popup-dismissed");

/** 이미 본(닫은) 요청 id 묶음. */
export const readSeen = memory.read;

/** 「다음에 하기」 — 본 요청에 지금 요청을 더해 기억하고 팝업에 알린다. */
export const rememberSeen = (key: string) => memory.remember(mergeSeenKey(key, memory.read()));

/**
 * 로그인할 때 본 요청을 잊는다 — 로그아웃 · 접속 만료 · 비밀번호 재설정 어느 길로 끝났든 다시 로그인하면 팝업이 뜬다.
 * 로그인을 보낼 때 부르므로 실패한 시도에도 잊지만, 그 뒤 팝업이 한 번 더 뜰 뿐이다.
 */
export const forgetAffiliationPopup = memory.forget;

export const subscribeSeen = memory.subscribe;
