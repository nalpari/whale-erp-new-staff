// 서명 요청 팝업(WHALEERP-148)의 「다음에 하기」 판정 — 클라이언트(팝업 · 기억)가 쓰는 의존 없는 순수 모듈. 띄울 계약 고르기(서버)는
// sign-request.ts 다. 여기에 값 import 를 두지 않는다 — 클라이언트 번들이 계약 규칙 · 날짜 모듈을 끌어오지 않게. node --test 가 직접 읽는다.

const itemsOf = (key: string | null) => new Set((key ?? "").split(",").filter(Boolean));

/**
 * 팝업을 닫아 둘지 — 지금 기다리는 계약(id@발송 일시)이 모두 「다음에 하기」로 닫은 것이면 닫아 둔다(소속 추가 요청 팝업과 같다).
 * 서명 · 수정 요청으로 기다리는 계약이 줄면 다시 뜨지 않고, 새 계약이 오거나 다시 발송(발송 일시가 바뀜)됐을 때만 뜬다.
 */
export function isSignRequestDismissed(key: string, seen: string | null): boolean {
  const done = itemsOf(seen);
  return [...itemsOf(key)].every((item) => done.has(item));
}

/** 「다음에 하기」로 닫을 때 기억할 값 — 이미 닫은 것에 지금 기다리는 계약을 더한다. */
export const mergeSignRequestSeen = (key: string, seen: string | null) => [...new Set([...itemsOf(seen), ...itemsOf(key)])].sort().join(",");

/**
 * HOME-4 「서명하기 전까지 앱을 열 때마다 띄운다」의 「앱을 열 때」— 새로 띄움(새 탭 · 앱 다시 시작, sessionStorage 가 비어 있음)과,
 * 설치한 홈 화면 앱 · 탭을 백그라운드로 보냈다가(화면 숨김) 이만큼 넘게 지나 다시 보이게 한 것을 모두 연 것으로 본다. 잠깐 다른 앱을
 * 보고 오거나 화면을 껐다 켠 정도로는 다시 띄우지 않는다. 소속 추가 요청 팝업에는 이 규칙을 두지 않았다(새로 띄울 때만).
 */
export const REOPEN_AFTER_MS = 10 * 60 * 1000;

/**
 * 화면 보임이 바뀔 때 — 숨으면 그 시각을 기록하고, 다시 보이면 숨은 지 REOPEN_AFTER_MS 를 넘었는지(reopened — 「다음에 하기」 기억을
 * 지우고 홈을 다시 받을지) 판정하고 기록을 비운다.
 */
export function onVisibilityChange(
  hiddenAt: number | null,
  visibility: "hidden" | "visible",
  now: number,
): { hiddenAt: number | null; reopened: boolean } {
  if (visibility === "hidden") return { hiddenAt: hiddenAt ?? now, reopened: false };
  return { hiddenAt: null, reopened: hiddenAt !== null && now - hiddenAt > REOPEN_AFTER_MS };
}
