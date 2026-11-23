import { isInApp, measureLocation, waitForBridge, type AppLocation, type Bridge, type BridgeResult } from "./native-bridge.ts";

/**
 * 출퇴근 화면이 쓰는 기기 위치 한 번. 판정(반경 안 · 밖)은 부른 쪽이 한다 — 좌표는 서버로 보내지 않는다(ATT-05).
 * - 설치형 앱 안이면 앱이 잰 좌표와 모의 위치 여부를 쓴다(계획 결정 8, 위치 조작 감지 ATT-21 이 실제로 쌓인다).
 * - 브라우저이거나, 브리지는 있는데 앱이 이 기능을 모르는 옛 버전이면(unavailable) 브라우저 위치를 쓰고 모의 위치는
 *   판정하지 않는다(false). 앱 안인데 브리지 자체가 없으면 앱 쪽 고장이라 broken — 브라우저로 넘기면 모의 위치 판정이 빠진다.
 * - 앱과의 약속이 어긋났거나(malformed) 앱이 호출을 받지 않았으면(forbidden) broken — 다시 시도해도 풀리지 않는다.
 *   브라우저 위치로 넘기지 않는다(모의 위치 판정이 빠지므로).
 */
/**
 * 출퇴근 판정에 쓸 앱 위치의 최대 나이(초). 정확한 위치는 앱이 2초 안쪽 새 위치만 주므로 걸리지 않는다. 「대략적 위치」는 앱이
 * 운영체제가 준 첫 위치를 그대로 주는데(Android 는 대략적 위치를 최대 10분에 한 번 새로 만든다), 그보다 오래된 위치는
 * 매장을 벗어난 뒤에도 매장 안으로 판정할 수 있어 「읽지 못함」으로 본다(다시 누르면 새로 잰다).
 */
export const MAX_LOCATION_AGE_SECONDS = 600;

export type DeviceLocation =
  | { status: "ok"; latitude: number; longitude: number; mocked: boolean }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "broken" };

/** 브라우저 위치 한 번. 위치는 콜백으로만 받는다 — 브라우저가 위치를 주지 않는 기기도 오류 콜백으로 같은 「읽지 못함」이 된다. */
export function browserLocation(options: PositionOptions): Promise<DeviceLocation> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve({ status: "unavailable" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ status: "ok", latitude: coords.latitude, longitude: coords.longitude, mocked: false }),
      (failure) => resolve({ status: failure.code === failure.PERMISSION_DENIED ? "denied" : "unavailable" }),
      options,
    );
  });
}

/**
 * 앱 답을 화면의 위치 상태로. 앱이 이 기능을 모르거나 브리지가 없으면 null(브라우저 위치로 넘어간다).
 * 앱 기능 실패 · 시간 초과(failed)는 다시 해 볼 수 있어 unavailable, 약속 어긋남(malformed) · 거절(forbidden)은 broken.
 */
export function fromAppLocation(result: BridgeResult<AppLocation>): DeviceLocation | null {
  if (!result.ok) {
    if (result.error === "unavailable") return null;
    if (result.error === "failed") return { status: "unavailable" };
    // malformed 는 callNative 가 이미 남긴다. forbidden 은 남기지 않으므로 여기서 남긴다.
    if (result.error === "forbidden") console.error("[native-bridge] measureLocation 호출을 앱이 받지 않음(forbidden)");
    return { status: "broken" };
  }
  const data = result.data;
  if (data.status === "ok") {
    if (data.ageSeconds > MAX_LOCATION_AGE_SECONDS) return { status: "unavailable" };
    return { status: "ok", latitude: data.latitude, longitude: data.longitude, mocked: data.mocked };
  }
  return { status: data.status };
}

export async function readDeviceLocation({
  inApp = isInApp(),
  bridgeReady = () => waitForBridge(),
  fromApp = (bridge) => measureLocation(bridge),
  fromBrowser,
}: {
  inApp?: boolean;
  bridgeReady?: () => Promise<Bridge | null>;
  fromApp?: (bridge: Bridge) => Promise<BridgeResult<AppLocation>>;
  fromBrowser: () => Promise<DeviceLocation>;
}): Promise<DeviceLocation> {
  if (inApp) {
    // 브리지가 있어야 「옛 앱이라 기능이 없음」과 「브리지 고장」을 가를 수 있다. 브리지가 없으면 고장으로 보고 브라우저로 넘기지 않는다
    // (waitForBridge 가 이미 콘솔에 남긴다).
    const bridge = await bridgeReady();
    if (bridge === null) return { status: "broken" };
    const reading = fromAppLocation(await fromApp(bridge));
    if (reading !== null) return reading;
  }
  return fromBrowser();
}
