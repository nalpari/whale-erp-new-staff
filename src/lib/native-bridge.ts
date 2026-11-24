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

/** 앱이 준비됐다고 알리는 이벤트(flutter_inappwebview). 이미 준비됐으면 `window.flutter_inappwebview.callHandler` 가 있다. */
export const BRIDGE_READY_EVENT = "flutterInAppWebViewPlatformReady";

/**
 * 앱 기능 호출의 결과.
 * - forbidden: 앱이 받지 않은 호출(다른 출처 · iframe). 웹 코드 버그라 다시 시도하지 않는다.
 * - failed: 앱 기능이 실패했거나, 호출이 예외로 끝났거나, 앱이 제때 답하지 않았다. 앱 기능 실패는 앱 로그에,
 *   예외 · 시간 초과는 웹 콘솔에 남는다.
 * - unavailable: 앱 안이 아니거나, 기다려도 `callHandler` 가 없거나, 앱에 없는 기능이다(앱 버전이 낮을 때 등).
 *   기본 대기(waitForBridge)는 Android 에서 준비 이벤트가 제때 안 와도 `callHandler` 가 보이면 그것으로 불러 본다. 엄격 대기(strict —
 *   출퇴근 위치 · 「다시 시도」)는 준비 표시까지 있어야 부르고, 없으면 부르지 않는다(device-location.ts).
 * - malformed: 앱이 약속과 다른 모양으로 답했다.
 */
export type BridgeError = "forbidden" | "failed" | "unavailable" | "malformed";
export type BridgeResult<T> = { ok: true; data: T } | { ok: false; error: BridgeError };

/** `window.flutter_inappwebview` 가운데 여기서 쓰는 부분. */
export type Bridge = { callHandler: (name: string, ...args: unknown[]) => Promise<unknown> };

/** 표식은 User-Agent 맨 앞이나 공백 바로 뒤에 온 것만 센다(`NotWhaleStaffApp/1.0` 같은 다른 제품명은 앱이 아니다). */
const APP_USER_AGENT_TOKEN = new RegExp(`(?:^|\\s)${APP_USER_AGENT_MARK}(\\S+)`, "g");

/** User-Agent 에서 앱 버전을 읽는다. 앱 밖이면 null. 표식이 여럿이면 마지막(앱이 붙인 것)을 쓴다. */
export function appVersionOf(userAgent: string): string | null {
  const matches = [...userAgent.matchAll(APP_USER_AGENT_TOKEN)];
  return matches.at(-1)?.[1] ?? null;
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
    // data 는 약속상 꼭 있어야 한다. 빠진 { ok: true } 를 isData 가 undefined 를 허락해 성공으로 넘기지 않게 먼저 본다.
    if (!("data" in raw)) return { ok: false, error: "malformed" };
    return isData(raw.data) ? { ok: true, data: raw.data } : { ok: false, error: "malformed" };
  }
  if (raw.ok === false && "error" in raw && (raw.error === "forbidden" || raw.error === "failed")) {
    return { ok: false, error: raw.error };
  }
  return { ok: false, error: "malformed" };
}

type BridgeWindow = Pick<Window, "addEventListener" | "removeEventListener"> & { flutter_inappwebview?: unknown };

/** 부를 수 있는 브리지인지. Android 는 `callHandler` 를 심기 전에도 객체가 먼저 있을 수 있어 함수까지 본다. */
function isBridge(value: unknown): value is Bridge {
  return typeof value === "object" && value !== null && "callHandler" in value && typeof value.callHandler === "function";
}

/**
 * 기다리지 않고 바로 불러도 되는 브리지인지.
 * Android 는 웹뷰가 문서 시작 스크립트(DOCUMENT_START_SCRIPT)를 지원하지 않으면 `callHandler` 가 보여도
 * 준비 이벤트 전에는 부를 수 없다. 플러그인(flutter_inappwebview_android)은 준비 이벤트를 보낼 때
 * `_platformReady = true` 를 남기므로 그것까지 본다. iOS 는 이 표시를 남기지 않지만 `callHandler` 가 보이면 부를 수 있다.
 */
/** 준비 이벤트를 받은 브리지. 이벤트는 한 번만 오므로 기억해 두고, 다음 대기에서도 준비된 것으로 본다. */
const readyByEvent = new WeakSet<object>();

/** 루트 레이아웃 `<head>` 의 인라인 스크립트(`BRIDGE_READY_TRACKER_SCRIPT`)가 준비 이벤트를 받을 때마다 그때의 브리지 객체를 담는 곳(브리지가 바뀌면 새 이벤트로 덮는다). */
export const BRIDGE_READY_FLAG = "__whaleBridgeReady";

/**
 * 페이지 맨 앞에서 준비 이벤트를 받아 두는 스크립트. 이 모듈은 출퇴근 화면을 열 때에야 불러와져, 그 전에 이미 지나간 준비 이벤트를
 * 받지 못한다(이벤트는 한 번만 온다). 레이아웃 `<head>` 에 넣어 문서를 읽는 즉시 듣게 한다.
 */
export const BRIDGE_READY_TRACKER_SCRIPT = `window.addEventListener(${JSON.stringify(BRIDGE_READY_EVENT)},function(){window.${BRIDGE_READY_FLAG}=window.flutter_inappwebview});`;

function isReadyBridge(value: unknown, userAgent: string): value is Bridge {
  if (!isBridge(value)) return false;
  if (!/\bAndroid\b/.test(userAgent)) return true;
  if (readyByEvent.has(value)) return true;
  // 이벤트를 받았을 때의 그 브리지일 때만(브리지가 바뀌었으면 새 것은 다시 준비를 확인한다).
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>)[BRIDGE_READY_FLAG] === value) return true;
  return "_platformReady" in value && value._platformReady === true;
}

/**
 * 브리지를 기다린다. 앱 밖이면 바로 null, 앱 안이면 준비 이벤트를 [timeoutMs] 까지 기다리고 못 받으면 null.
 * 앱은 페이지 스크립트보다 먼저 준비되는 게 보통이지만, 첫 화면에서 바로 부르면 이벤트를 기다려야 할 수 있다.
 * [strict] 면 시간이 다 됐을 때 `callHandler` 만 보이는 반쯤 준비된 브리지(Android 준비 표시 없음)는 null 로 본다 —
 * 「다시 시도」가 아직 부를 수 없는 브리지를 「연결됨」으로 잘못 알리지 않게.
 */
export function waitForBridge(
  win: BridgeWindow | undefined = typeof window === "undefined" ? undefined : (window as unknown as BridgeWindow),
  { userAgent, timeoutMs = 3000, strict = false }: { userAgent?: string; timeoutMs?: number; strict?: boolean } = {},
): Promise<Bridge | null> {
  const ua = userAgent ?? (typeof navigator === "undefined" ? "" : navigator.userAgent);
  if (win === undefined || !isInApp(ua)) return Promise.resolve(null);
  if (isReadyBridge(win.flutter_inappwebview, ua)) return Promise.resolve(win.flutter_inappwebview);
  return new Promise((resolve) => {
    const finish = (reason: string, byEvent: boolean) => {
      clearTimeout(timer);
      win.removeEventListener(BRIDGE_READY_EVENT, onReady);
      const bridge = win.flutter_inappwebview;
      if (byEvent && isBridge(bridge)) readyByEvent.add(bridge);
      // 이벤트가 왔거나 시간이 다 됐으면 callHandler 가 있는 것만으로 부른다(준비 표시를 못 받아도 시도는 해 본다).
      // strict 면 시간이 다 됐을 때는 준비 표시까지 있어야 한다.
      if (strict && !byEvent ? isReadyBridge(bridge, ua) : isBridge(bridge)) return resolve(bridge as Bridge);
      // 앱 안인데 브리지가 없다 = 앱 쪽 고장. 앱 밖(조용한 null)과 구분되게 남긴다.
      // strict 로 떨어진 것(브리지는 있지만 준비 표시가 없음)은 고장이 아니라 아직 준비 중이라 따로 적는다.
      const version = appVersionOf(ua);
      const state = isBridge(bridge) ? "브리지는 있지만 준비 표시가 없음(strict)" : "브리지가 없다";
      console.error(`[native-bridge] 앱(${version}) 안인데 ${state}: ${reason}`);
      resolve(null);
    };
    const onReady = () => finish("준비 이벤트는 왔지만 callHandler 가 없음", true);
    const timer = setTimeout(() => finish(`${timeoutMs}ms 안에 준비 이벤트가 오지 않음`, false), timeoutMs);
    win.addEventListener(BRIDGE_READY_EVENT, onReady);
  });
}

/**
 * 앱 기능 하나를 부른다. 앱 밖이거나 브리지가 없으면 unavailable, 호출이 예외로 끝나거나
 * [timeoutMs] 안에 답이 없으면 failed(답이 버려지거나 앱 기능이 끝나지 않으면 영원히 기다리게 되므로).
 * 시간 초과는 웹이 기다리기를 그만둔 것일 뿐 앱 쪽 기능은 계속 돌 수 있다. 부작용이 있는 기능(파일 받기 등)을
 * 시간 초과 뒤 다시 부르면 두 번 실행될 수 있으니, 그런 기능을 더할 때는 다시 부르기 전에 결과를 따로 확인한다.
 * [bridge] 를 넘기면 기다리지 않고 그것으로 부른다(테스트 · 이미 받아 둔 브리지).
 */
export async function callNative<T>(
  name: string,
  args: unknown[],
  isData: (data: unknown) => data is T,
  bridge?: Bridge | null,
  {
    timeoutMs = 10_000,
    describeMalformed = (raw) => raw,
  }: {
    timeoutMs?: number;
    /** 약속과 다른 답을 콘솔에 남길 모양. 기본은 답 원본. 개인정보(좌표 등)가 담기는 기능은 원본 대신 어긋난 칸 이름만 넘긴다. */
    describeMalformed?: (raw: unknown) => unknown;
  } = {},
): Promise<BridgeResult<T>> {
  const target = bridge === undefined ? await waitForBridge() : bridge;
  if (target === null) return { ok: false, error: "unavailable" };
  const TIMED_OUT = Symbol("timed out");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let raw: unknown;
  try {
    raw = await Promise.race([
      target.callHandler(name, ...args),
      new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
      }),
    ]);
  } catch (thrown) {
    console.error(`[native-bridge] ${name} 호출 실패`, thrown);
    return { ok: false, error: "failed" };
  } finally {
    clearTimeout(timer);
  }
  if (raw === TIMED_OUT) {
    console.error(`[native-bridge] ${name} 이(가) ${timeoutMs}ms 안에 답하지 않음`);
    return { ok: false, error: "failed" };
  }
  const result = readBridgeResult(raw, isData);
  if (!result.ok && result.error === "malformed") {
    // 기록을 만들다 예외가 나도 결과(malformed)는 그대로 돌려준다 — 위치 읽기 전체가 실패로 번지지 않게.
    let described: unknown;
    try {
      described = describeMalformed(raw);
    } catch {
      // 원본은 좌표가 담길 수 있어 남기지 않는다. 예외 메시지에도 좌표가 담길 수 있어 고정 표식만 남긴다.
      described = { describeFailed: true };
    }
    console.error(`[native-bridge] ${name} 의 답이 약속과 다르다`, described);
  }
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

/** 기기 식별자 형식 — 앱이 기기 고유값을 SHA-256 으로 바꾼 64자 소문자 16진수(앱 `docs/native-bridge.md` 의 deviceId). */
export const APP_DEVICE_ID_PATTERN = /^[0-9a-f]{64}$/;

export type AppDeviceId = { deviceId: string };

export function isAppDeviceId(data: unknown): data is AppDeviceId {
  return typeof data === "object" && data !== null && "deviceId" in data && typeof data.deviceId === "string" && APP_DEVICE_ID_PATTERN.test(data.deviceId);
}

/**
 * 앱이 주는 기기 식별자(계획 결정 9). 로그인의 deviceIdentifier 로 쿠키 UUID 대신 쓴다 — 쿠키는 앱을 지우면 바뀌지만 이 값은
 * 대체로 그대로다. 기기 고유값은 앱이 해시해 넘겨 원래 값은 모른다. 옛 앱(기능 없음)이나 앱 밖이면 unavailable.
 */
export function getAppDeviceId(bridge?: Bridge | null): Promise<BridgeResult<AppDeviceId>> {
  return callNative("deviceId", [], isAppDeviceId, bridge);
}

/**
 * `measureLocation` 을 기다리는 시간. 권한 창이 뜨면 사용자가 고르는 동안 앱이 기다리고(앱 안 상한 60초), 측정 · 재확인까지
 * 최악 약 73초가 걸린다(앱 `docs/native-bridge.md`). 기본 10초로 부르면 권한 창을 보는 사이 실패로 끝난다.
 */
export const MEASURE_LOCATION_TIMEOUT_MS = 75_000;

/** `measureLocation` 의 data. 이름은 출퇴근 화면의 위치 상태(ok · denied · unavailable)에 맞췄다. */
export type AppLocation =
  | {
      status: "ok";
      latitude: number;
      longitude: number;
      /** 운영체제가 알려 주지 않으면 null. */
      accuracyMeters: number | null;
      /** 그 위치를 잰 뒤 지난 초. 대략적 위치는 운영체제가 준 첫 위치를 그대로 써서 클 수 있다. */
      ageSeconds: number;
      /** 운영체제가 알려 준 모의 위치 여부(Android isMock · iOS isSimulatedBySoftware). */
      mocked: boolean;
      /** false 면 「대략적 위치」, null 이면 정확도 설정을 읽지 못함. */
      precise: boolean | null;
    }
  | { status: "denied" }
  | {
      status: "unavailable";
      reason: "serviceDisabled" | "permissionCheckFailed" | "permissionTimeout" | "timeout" | "error";
    };

const LOCATION_UNAVAILABLE_REASONS = ["serviceDisabled", "permissionCheckFailed", "permissionTimeout", "timeout", "error"];
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function isAppLocation(data: unknown): data is AppLocation {
  if (typeof data !== "object" || data === null || !("status" in data)) return false;
  if (data.status === "denied") return true;
  if (data.status === "unavailable") return "reason" in data && LOCATION_UNAVAILABLE_REASONS.includes(data.reason as string);
  if (data.status !== "ok") return false;
  const d = data as Record<string, unknown>;
  return (
    isFiniteNumber(d.latitude) &&
    d.latitude >= -90 &&
    d.latitude <= 90 &&
    isFiniteNumber(d.longitude) &&
    d.longitude >= -180 &&
    d.longitude <= 180 &&
    (d.accuracyMeters === null || isFiniteNumber(d.accuracyMeters)) &&
    isFiniteNumber(d.ageSeconds) &&
    d.ageSeconds >= 0 &&
    typeof d.mocked === "boolean" &&
    (d.precise === null || typeof d.precise === "boolean")
  );
}

const APP_LOCATION_FIELDS = ["status", "latitude", "longitude", "accuracyMeters", "ageSeconds", "mocked", "precise", "reason"] as const;

/**
 * `measureLocation` 답이 약속과 다를 때 콘솔에 남길 것. 답에는 위도 · 경도가 있어 원본도 값도 남기지 않는다 — 오류 수집 서비스를
 * 붙이면 좌표가 서버로 가기 때문이다(ATT-05, 2026-11-23 재영 #90 리뷰). 고정 오류 코드와, 약속 문서에 있는 칸 가운데 모양이
 * 틀린 칸 이름만 남긴다. 약속에 없는 칸은 이름도 남기지 않는다(이름에 값이 들어 있을 수 있다).
 */
export function appLocationProblems(raw: unknown): { code: "measureLocation-malformed"; fields: string[] } {
  const code = "measureLocation-malformed" as const;
  if (typeof raw !== "object" || raw === null || !("ok" in raw)) return { code, fields: ["(답 모양)"] };
  if (raw.ok !== true) return { code, fields: ["ok", "error"] };
  if (!("data" in raw) || typeof raw.data !== "object" || raw.data === null) return { code, fields: ["data"] };
  const d = raw.data as Record<string, unknown>;
  const checks: Record<(typeof APP_LOCATION_FIELDS)[number], boolean> = {
    status: d.status === "ok" || d.status === "denied" || d.status === "unavailable",
    latitude: d.status !== "ok" || (isFiniteNumber(d.latitude) && d.latitude >= -90 && d.latitude <= 90),
    longitude: d.status !== "ok" || (isFiniteNumber(d.longitude) && d.longitude >= -180 && d.longitude <= 180),
    accuracyMeters: d.status !== "ok" || d.accuracyMeters === null || isFiniteNumber(d.accuracyMeters),
    ageSeconds: d.status !== "ok" || (isFiniteNumber(d.ageSeconds) && d.ageSeconds >= 0),
    mocked: d.status !== "ok" || typeof d.mocked === "boolean",
    precise: d.status !== "ok" || d.precise === null || typeof d.precise === "boolean",
    reason: d.status !== "unavailable" || LOCATION_UNAVAILABLE_REASONS.includes(d.reason as string),
  };
  return { code, fields: APP_LOCATION_FIELDS.filter((field) => !checks[field]) };
}

/**
 * 앱이 위치를 새로 한 번 재어 좌표와 모의 위치 여부를 같은 측정값에서 함께 돌려준다(계획 결정 8). 권한 창 · 안내는 앱이 띄운다.
 * 부작용이 없어 다시 불러도 된다(위치를 한 번 더 잴 뿐). 약속과 다른 답은 좌표 없이 어긋난 칸 이름만 남긴다(appLocationProblems).
 */
export function measureLocation(bridge?: Bridge | null): Promise<BridgeResult<AppLocation>> {
  return callNative("measureLocation", [], isAppLocation, bridge, {
    timeoutMs: MEASURE_LOCATION_TIMEOUT_MS,
    describeMalformed: appLocationProblems,
  });
}
