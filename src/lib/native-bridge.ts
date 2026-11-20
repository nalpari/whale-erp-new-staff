/**
 * 설치형 직원 근무 앱(웹뷰 껍데기, `whale-erp-staff-mobile-app`)의 기능을 부르는 단 한 곳.
 * 약속 전문은 앱 저장소 `docs/native-bridge.md` 다. 앱 기능을 더하면 그 문서와 여기를 같이 고친다.
 *
 * - 앱 안인지는 User-Agent 끝의 `WhaleStaffApp/<앱 버전>` 으로만 알아본다. 감지용일 뿐 권한 확인에 쓰지 않는다
 *   (누구나 흉내 낼 수 있다). 실제 허락은 앱이 출처(https · 호스트 · 포트)와 맨 위 화면인지로 정한다.
 * - 앱은 언제나 `{ ok: true, data }` 또는 `{ ok: false, error }` 하나로 답한다. 없는 기능 이름이면 앱까지 가지 않고 `null` 이 온다.
 * - `window.flutter_inappwebview.callHandler` 는 이 파일 밖에서 부르지 않는다.
 * - 브라우저 전용이다. 서버 컴포넌트에서 부르지 않는다.
 */

/** User-Agent 에서 앱을 알아보는 표식. 앱이 기본 User-Agent 끝에 `WhaleStaffApp/1.0.0` 처럼 붙인다. */
export const APP_USER_AGENT_MARK = "WhaleStaffApp/";

/** 앱이 준비됐다고 알리는 이벤트(flutter_inappwebview). 이미 준비됐으면 `window.flutter_inappwebview` 가 있다. */
export const BRIDGE_READY_EVENT = "flutterInAppWebViewPlatformReady";

/**
 * 앱 기능 호출의 결과.
 * - forbidden: 앱이 받지 않은 호출(다른 출처 · iframe). 웹 코드 버그라 다시 시도하지 않는다.
 * - failed: 앱 기능이 실패했다. 자세한 내용은 앱 로그에만 남는다.
 * - unavailable: 앱 안이 아니거나, 브리지가 제때 준비되지 않았거나, 앱에 없는 기능이다(앱 버전이 낮을 때 등).
 * - malformed: 앱이 약속과 다른 모양으로 답했다.
 */
export type BridgeError = "forbidden" | "failed" | "unavailable" | "malformed";
export type BridgeResult<T> = { ok: true; data: T } | { ok: false; error: BridgeError };

/** `window.flutter_inappwebview` 가운데 여기서 쓰는 부분. */
export type Bridge = { callHandler: (name: string, ...args: unknown[]) => Promise<unknown> };

/** User-Agent 에서 앱 버전을 읽는다. 앱 밖이면 null. */
export function appVersionOf(userAgent: string): string | null {
  const at = userAgent.lastIndexOf(APP_USER_AGENT_MARK);
  if (at < 0) return null;
  const version = userAgent.slice(at + APP_USER_AGENT_MARK.length).split(/\s/, 1)[0];
  return version === "" ? null : version;
}

/** 설치형 앱 안에서 열렸는지. 화면 분기(감지)에만 쓴다. 인자를 빼면 지금 브라우저의 User-Agent 를 본다. */
export function isInApp(userAgent: string = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  return appVersionOf(userAgent) !== null;
}

/** 앱이 돌려준 값을 약속에 맞는지 보고 결과로 바꾼다. `null`(없는 기능)은 unavailable. */
export function readBridgeResult<T>(raw: unknown, isData: (data: unknown) => data is T): BridgeResult<T> {
  if (raw === null || raw === undefined) return { ok: false, error: "unavailable" };
  if (typeof raw !== "object" || !("ok" in raw)) return { ok: false, error: "malformed" };
  if (raw.ok === true) {
    const data = "data" in raw ? raw.data : undefined;
    return isData(data) ? { ok: true, data } : { ok: false, error: "malformed" };
  }
  if (raw.ok === false && "error" in raw && (raw.error === "forbidden" || raw.error === "failed")) {
    return { ok: false, error: raw.error };
  }
  return { ok: false, error: "malformed" };
}

type BridgeWindow = Pick<Window, "addEventListener" | "removeEventListener"> & { flutter_inappwebview?: Bridge };

/**
 * 브리지를 기다린다. 앱 밖이면 바로 null, 앱 안이면 준비 이벤트를 [timeoutMs] 까지 기다리고 못 받으면 null.
 * 앱은 페이지 스크립트보다 먼저 준비되는 게 보통이지만, 첫 화면에서 바로 부르면 이벤트를 기다려야 할 수 있다.
 */
export function waitForBridge(
  win: BridgeWindow | undefined = typeof window === "undefined" ? undefined : (window as unknown as BridgeWindow),
  { userAgent, timeoutMs = 3000 }: { userAgent?: string; timeoutMs?: number } = {},
): Promise<Bridge | null> {
  if (win === undefined || !isInApp(userAgent)) return Promise.resolve(null);
  if (win.flutter_inappwebview) return Promise.resolve(win.flutter_inappwebview);
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      win.removeEventListener(BRIDGE_READY_EVENT, done);
      resolve(win.flutter_inappwebview ?? null);
    };
    const timer = setTimeout(done, timeoutMs);
    win.addEventListener(BRIDGE_READY_EVENT, done);
  });
}

/**
 * 앱 기능 하나를 부른다. 앱 밖이거나 브리지가 없으면 unavailable, 호출이 예외로 끝나면 failed.
 * [bridge] 를 넘기면 기다리지 않고 그것으로 부른다(테스트 · 이미 받아 둔 브리지).
 */
export async function callNative<T>(
  name: string,
  args: unknown[],
  isData: (data: unknown) => data is T,
  bridge?: Bridge | null,
): Promise<BridgeResult<T>> {
  const target = bridge === undefined ? await waitForBridge() : bridge;
  if (target === null) return { ok: false, error: "unavailable" };
  let raw: unknown;
  try {
    raw = await target.callHandler(name, ...args);
  } catch (thrown) {
    console.error(`[native-bridge] ${name} 호출 실패`, thrown);
    return { ok: false, error: "failed" };
  }
  const result = readBridgeResult(raw, isData);
  if (!result.ok && result.error === "malformed") console.error(`[native-bridge] ${name} 의 답이 약속과 다르다`, raw);
  return result;
}

/** `appInfo` 의 data. */
export type AppInfo = { version: string; platform: "android" | "ios" | "other" };

export function isAppInfo(data: unknown): data is AppInfo {
  return (
    typeof data === "object" &&
    data !== null &&
    "version" in data &&
    typeof data.version === "string" &&
    "platform" in data &&
    (data.platform === "android" || data.platform === "ios" || data.platform === "other")
  );
}

/** 앱 버전과 운영체제. 브리지가 살아 있는지 확인하거나 앱 버전별로 기능을 켜고 끌 때 쓴다. */
export function getAppInfo(bridge?: Bridge | null): Promise<BridgeResult<AppInfo>> {
  return callNative("appInfo", [], isAppInfo, bridge);
}
