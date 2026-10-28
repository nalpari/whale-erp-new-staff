// 홈 팝업의 「다음에 하기」 기억 — 값 하나를 이 탭(sessionStorage)에 둔다. 앱을 새로 열면(새 탭 · 홈 화면 앱을 다시 띄움) 잊는다.
// 소속 추가 요청 팝업(WHALEERP-144)과 서명 요청 팝업(148)이 저장소 키만 달리해 쓴다. 저장소를 막은 브라우저에서는 화면 안에만 두고,
// 기억하지 못해도 팝업은 뜬다. 브라우저에서만 부른다(테스트는 sessionStorage 를 꾸며 넣는다).

const itemsOf = (key: string | null) => new Set((key ?? "").split(",").filter(Boolean));

/**
 * 「다음에 하기」 판정 — 지금 항목(쉼표로 이은 키)이 모두 이미 닫은 항목이면 닫아 둔다. 항목이 줄면 그대로 닫혀 있고, 새 항목이 있을
 * 때만 다시 뜬다. 소속 추가 요청(요청 id) · 서명 요청(계약 id@발송 일시)이 함께 쓴다.
 */
export function isSeenSubset(currentKey: string, seenKey: string | null): boolean {
  const seen = itemsOf(seenKey);
  return [...itemsOf(currentKey)].every((item) => seen.has(item));
}

/** 「다음에 하기」로 닫을 때 기억할 값 — 이미 닫은 항목에 지금 항목을 더한다. compare 는 정렬(없으면 글자 순). */
export function mergeSeen(currentKey: string, seenKey: string | null, compare?: (a: string, b: string) => number): string {
  return [...new Set([...itemsOf(seenKey), ...itemsOf(currentKey)])].sort(compare).join(",");
}

export interface PopupMemory {
  /** 기억한 값(없으면 null). */
  read: () => string | null;
  /** 값을 기억하고 구독자에게 알린다. */
  remember: (value: string) => void;
  /** 기억을 지우고 구독자에게 알린다(로그인할 때 · 서명 요청 팝업은 앱을 다시 열었을 때). */
  forget: () => void;
  /** useSyncExternalStore 의 subscribe. */
  subscribe: (listener: () => void) => () => void;
}

export function createPopupMemory(storageKey: string): PopupMemory {
  const listeners = new Set<() => void>();
  /** 저장소 쓰기가 실패했을 때 이 화면에서만 기억하는 값. 쓰기가 다시 성공하면 비운다. */
  let memory: string | null = null;

  const readStorage = (): string | null => {
    try {
      return sessionStorage.getItem(storageKey);
    } catch {
      // 저장소를 막은 브라우저 — 기억하지 못할 뿐 팝업은 뜬다.
      return null;
    }
  };

  return {
    read: () => memory ?? readStorage(),
    remember(value) {
      let wrote = false;
      try {
        sessionStorage.setItem(storageKey, value);
        // 쓰기가 됐어도 다시 읽혀야 저장소만 믿는다 — 쓰기는 되는데 읽기가 던지는 환경에서 화면 안 값을 비우면 닫은 팝업이 다시 뜬다.
        wrote = sessionStorage.getItem(storageKey) === value;
      } catch {
        // 저장소를 막은 브라우저 — 화면 안에만 둔다.
      }
      // 저장소에 남았으면 화면 안 값을 비운다(남겨 두면 read 가 옛 값을 먼저 읽는다). 아니면 화면 안에만 둔다.
      memory = wrote ? null : value;
      listeners.forEach((listener) => listener());
    },
    forget() {
      memory = null;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // 저장소를 막은 브라우저 — 기억한 것도 없다.
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
