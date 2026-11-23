// node --test src/lib/device-location.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_LOCATION_AGE_SECONDS, fromAppLocation, readDeviceLocation, type DeviceLocation } from "./device-location.ts";
import type { AppLocation, Bridge, BridgeResult } from "./native-bridge.ts";

const okApp = (mocked: boolean): BridgeResult<AppLocation> => ({
  ok: true,
  data: { status: "ok", latitude: 37.5, longitude: 127, accuracyMeters: 5, ageSeconds: 0, mocked, precise: true },
});
const bridge: Bridge = { callHandler: async () => null };
const ready = async () => bridge;
const browser: DeviceLocation = { status: "ok", latitude: 1, longitude: 2, mocked: false };

test("앱이 잰 위치는 좌표와 모의 위치 여부를 그대로 쓴다", () => {
  assert.deepEqual(fromAppLocation(okApp(true)), { status: "ok", latitude: 37.5, longitude: 127, mocked: true });
  assert.deepEqual(fromAppLocation(okApp(false)), { status: "ok", latitude: 37.5, longitude: 127, mocked: false });
});

test("앱 위치가 너무 오래됐으면(대략적 위치의 옛 좌표) 판정에 쓰지 않고 읽지 못함", () => {
  const aged = (ageSeconds: number): BridgeResult<AppLocation> => ({
    ok: true,
    data: { status: "ok", latitude: 37.5, longitude: 127, accuracyMeters: 900, ageSeconds, mocked: false, precise: false },
  });
  assert.deepEqual(fromAppLocation(aged(MAX_LOCATION_AGE_SECONDS)), { status: "ok", latitude: 37.5, longitude: 127, mocked: false });
  assert.deepEqual(fromAppLocation(aged(MAX_LOCATION_AGE_SECONDS + 1)), { status: "unavailable" });
});

test("앱이 거부 · 읽지 못함이라 답하면 그대로", () => {
  assert.deepEqual(fromAppLocation({ ok: true, data: { status: "denied" } }), { status: "denied" });
  assert.deepEqual(fromAppLocation({ ok: true, data: { status: "unavailable", reason: "serviceDisabled" } }), { status: "unavailable" });
});

test("앱 기능 실패는 읽지 못함, 약속 어긋남 · 거절은 broken, 앱이 이 기능을 모르면(unavailable) null 로 브라우저에 넘긴다", (t) => {
  t.mock.method(console, "error", () => {});
  assert.deepEqual(fromAppLocation({ ok: false, error: "failed" }), { status: "unavailable" });
  assert.deepEqual(fromAppLocation({ ok: false, error: "forbidden" }), { status: "broken" });
  assert.deepEqual(fromAppLocation({ ok: false, error: "malformed" }), { status: "broken" });
  assert.equal(fromAppLocation({ ok: false, error: "unavailable" }), null);
});

test("앱 안에서 앱이 실패 · 거부 · 읽지 못함으로 답하면 브라우저 위치로 넘어가지 않는다(모의 위치 판정을 피해 가지 못하게)", async (t) => {
  t.mock.method(console, "error", () => {});
  const cases: [BridgeResult<AppLocation>, DeviceLocation][] = [
    [{ ok: false, error: "failed" }, { status: "unavailable" }],
    [{ ok: false, error: "forbidden" }, { status: "broken" }],
    [{ ok: false, error: "malformed" }, { status: "broken" }],
    [{ ok: true, data: { status: "denied" } }, { status: "denied" }],
    [{ ok: true, data: { status: "unavailable", reason: "timeout" } }, { status: "unavailable" }],
  ];
  for (const [answer, expected] of cases) {
    let browserRead = false;
    const read = await readDeviceLocation({
      inApp: true,
      bridgeReady: ready,
      fromApp: async () => answer,
      fromBrowser: async () => { browserRead = true; return browser; },
    });
    assert.deepEqual(read, expected, JSON.stringify(answer));
    assert.equal(browserRead, false, JSON.stringify(answer));
  }
});

test("앱 안이면 앱 위치를 쓰고 브라우저 위치는 읽지 않는다", async () => {
  let browserRead = false;
  const read = await readDeviceLocation({
    inApp: true,
    bridgeReady: ready,
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

test("브리지는 있는데 옛 앱(기능 없음)이면 브라우저 위치로 넘어간다", async () => {
  assert.deepEqual(
    await readDeviceLocation({
      inApp: true,
      bridgeReady: ready,
      fromApp: async () => ({ ok: false, error: "unavailable" }),
      fromBrowser: async () => browser,
    }),
    browser,
  );
});

test("앱 안인데 브리지가 없으면 고장(broken)이고 브라우저 위치로 넘어가지 않는다(모의 위치 판정을 피하지 못하게)", async () => {
  let appCalled = false;
  let browserRead = false;
  const read = await readDeviceLocation({
    inApp: true,
    bridgeReady: async () => null,
    fromApp: async () => { appCalled = true; return okApp(true); },
    fromBrowser: async () => { browserRead = true; return browser; },
  });
  assert.deepEqual(read, { status: "broken" });
  assert.equal(appCalled, false);
  assert.equal(browserRead, false);
});
