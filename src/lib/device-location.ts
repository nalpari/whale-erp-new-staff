import { isInApp, measureLocation, type AppLocation, type BridgeResult } from "./native-bridge.ts";

/**
 * 출퇴근 화면이 쓰는 기기 위치 한 번. 판정(반경 안 · 밖)은 부른 쪽이 한다 — 좌표는 서버로 보내지 않는다(ATT-05).
 * - 설치형 앱 안이면 앱이 잰 좌표와 모의 위치 여부를 쓴다(계획 결정 8, 위치 조작 감지 ATT-21 이 실제로 쌓인다).
 * - 브라우저이거나, 앱이 이 기능을 모르는 옛 버전이면(unavailable) 브라우저 위치를 쓰고 모의 위치는 판정하지 않는다(false).
 */
export type DeviceLocation =
  | { status: "ok"; latitude: number; longitude: number; mocked: boolean }
  | { status: "denied" }
  | { status: "unavailable" };

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

/** 앱 답을 화면의 위치 상태로. 앱이 이 기능을 모르거나 브리지가 없으면 null(브라우저 위치로 넘어간다). */
export function fromAppLocation(result: BridgeResult<AppLocation>): DeviceLocation | null {
  if (!result.ok) return result.error === "unavailable" ? null : { status: "unavailable" };
  const data = result.data;
  if (data.status === "ok") return { status: "ok", latitude: data.latitude, longitude: data.longitude, mocked: data.mocked };
  return { status: data.status };
}

export async function readDeviceLocation({
  inApp = isInApp(),
  fromApp = () => measureLocation(),
  fromBrowser,
}: {
  inApp?: boolean;
  fromApp?: () => Promise<BridgeResult<AppLocation>>;
  fromBrowser: () => Promise<DeviceLocation>;
}): Promise<DeviceLocation> {
  if (inApp) {
    const reading = fromAppLocation(await fromApp());
    if (reading !== null) return reading;
  }
  return fromBrowser();
}
