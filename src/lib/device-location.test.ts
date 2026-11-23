// node --test src/lib/device-location.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { fromAppLocation, readDeviceLocation, type DeviceLocation } from "./device-location.ts";
import type { AppLocation, BridgeResult } from "./native-bridge.ts";

const okApp = (mocked: boolean): BridgeResult<AppLocation> => ({
  ok: true,
  data: { status: "ok", latitude: 37.5, longitude: 127, accuracyMeters: 5, ageSeconds: 0, mocked, precise: true },
});
const browser: DeviceLocation = { status: "ok", latitude: 1, longitude: 2, mocked: false };

test("앱이 잰 위치는 좌표와 모의 위치 여부를 그대로 쓴다", () => {
  assert.deepEqual(fromAppLocation(okApp(true)), { status: "ok", latitude: 37.5, longitude: 127, mocked: true });
  assert.deepEqual(fromAppLocation(okApp(false)), { status: "ok", latitude: 37.5, longitude: 127, mocked: false });
});

test("앱이 거부 · 읽지 못함이라 답하면 그대로", () => {
  assert.deepEqual(fromAppLocation({ ok: true, data: { status: "denied" } }), { status: "denied" });
  assert.deepEqual(fromAppLocation({ ok: true, data: { status: "unavailable", reason: "serviceDisabled" } }), { status: "unavailable" });
});

test("브리지 호출이 실패하면 읽지 못함, 앱이 이 기능을 모르면(unavailable) null 로 브라우저에 넘긴다", () => {
  assert.deepEqual(fromAppLocation({ ok: false, error: "failed" }), { status: "unavailable" });
  assert.deepEqual(fromAppLocation({ ok: false, error: "forbidden" }), { status: "unavailable" });
  assert.deepEqual(fromAppLocation({ ok: false, error: "malformed" }), { status: "unavailable" });
  assert.equal(fromAppLocation({ ok: false, error: "unavailable" }), null);
});

test("앱 안이면 앱 위치를 쓰고 브라우저 위치는 읽지 않는다", async () => {
  let browserRead = false;
  const read = await readDeviceLocation({
    inApp: true,
    fromApp: async () => okApp(true),
    fromBrowser: async () => { browserRead = true; return browser; },
  });
  assert.deepEqual(read, { status: "ok", latitude: 37.5, longitude: 127, mocked: true });
  assert.equal(browserRead, false);
});

test("브라우저면 앱을 부르지 않고 브라우저 위치를 쓴다", async () => {
  let appCalled = false;
  const read = await readDeviceLocation({
    inApp: false,
    fromApp: async () => { appCalled = true; return okApp(true); },
    fromBrowser: async () => browser,
  });
  assert.deepEqual(read, browser);
  assert.equal(appCalled, false);
});

test("옛 앱(기능 없음)이면 브라우저 위치로 넘어간다", async () => {
  assert.deepEqual(
    await readDeviceLocation({ inApp: true, fromApp: async () => ({ ok: false, error: "unavailable" }), fromBrowser: async () => browser }),
    browser,
  );
});
