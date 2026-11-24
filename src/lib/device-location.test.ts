// node --test src/lib/device-location.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_LOCATION_AGE_SECONDS, checkAppConnection, fromAppLocation, readDeviceLocation, type DeviceLocation } from "./device-location.ts";
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
  assert.deepEqual(fromAppLocation({ ok: false, error: "forbidden" }), { status: "broken", reason: "forbidden" });
  assert.deepEqual(fromAppLocation({ ok: false, error: "malformed" }), { status: "broken", reason: "mismatch" });
  assert.equal(fromAppLocation({ ok: false, error: "unavailable" }), null);
});

test("앱 안에서 앱이 실패 · 거부 · 읽지 못함으로 답하면 브라우저 위치로 넘어가지 않는다(모의 위치 판정을 피해 가지 못하게)", async (t) => {
  t.mock.method(console, "error", () => {});
  const cases: [BridgeResult<AppLocation>, DeviceLocation][] = [
    [{ ok: false, error: "failed" }, { status: "unavailable" }],
    [{ ok: false, error: "forbidden" }, { status: "broken", reason: "forbidden" }],
    [{ ok: false, error: "malformed" }, { status: "broken", reason: "mismatch" }],
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

test("앱 안인데 브리지가 두 번 기다려도 없으면 not-ready 고장이고 브라우저 위치로 넘어가지 않는다(모의 위치 판정을 피하지 못하게)", async () => {
  let appCalled = false;
  let browserRead = false;
  let waits = 0;
  const read = await readDeviceLocation({
    inApp: true,
    bridgeReady: async () => { waits++; return null; },
    fromApp: async () => { appCalled = true; return okApp(true); },
    fromBrowser: async () => { browserRead = true; return browser; },
  });
  assert.deepEqual(read, { status: "broken", reason: "not-ready" });
  assert.equal(waits, 2);
  assert.equal(appCalled, false);
  assert.equal(browserRead, false);
});

test("브리지가 처음에 늦어도 한 번 더 기다려 오면 그 브리지로 앱 위치를 읽는다(자동 재시도)", async () => {
  let waits = 0;
  const bridge = { callHandler: async () => null };
  const read = await readDeviceLocation({
    inApp: true,
    bridgeReady: async () => (++waits === 1 ? null : bridge),
    fromApp: async (b) => { assert.equal(b, bridge); return okApp(false); },
    fromBrowser: async () => browser,
  });
  assert.deepEqual(read, { status: "ok", latitude: 37.5, longitude: 127, mocked: false });
  assert.equal(waits, 2);
});

test("다시 시도는 브리지만 다시 확인하고 위치는 읽지 않는다(앱 기능을 한 번도 부르지 않는다)", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  let calls = 0;
  const counting: Bridge = { callHandler: async () => { calls++; return null; } };
  assert.equal(await checkAppConnection({ bridgeReady: async () => counting }), true);
  assert.equal(calls, 0);
  assert.equal(error.mock.callCount(), 0);
});

test("출퇴근 위치도 반쯤 준비된 브리지로 부르지 않도록 strict 로 두 번 기다리고, 그래도 안 되면 not-ready(다시 시도)", async () => {
  const options: unknown[] = [];
  let appCalled = false;
  const read = await readDeviceLocation({
    inApp: true,
    waitFor: async (_win, opts) => {
      options.push(opts);
      return null;
    },
    fromApp: async () => { appCalled = true; return okApp(false); },
    fromBrowser: async () => browser,
  });
  assert.deepEqual(read, { status: "broken", reason: "not-ready" });
  assert.deepEqual(options, [{ strict: true }, { strict: true }]);
  assert.equal(appCalled, false);
});

test("다시 시도는 반쯤 준비된 브리지를 연결됨으로 보지 않도록 strict 로 기다린다", async () => {
  const options: unknown[] = [];
  await checkAppConnection({
    waitFor: async (_win, opts) => {
      options.push(opts);
      return bridge;
    },
  });
  assert.deepEqual(options, [{ strict: true }]);
});

test("다시 시도도 출근 읽기처럼 두 번까지 기다린다", async () => {
  let waits = 0;
  assert.equal(await checkAppConnection({ bridgeReady: async () => (++waits === 1 ? null : bridge) }), true);
  assert.equal(waits, 2);
  waits = 0;
  assert.equal(await checkAppConnection({ bridgeReady: async () => { waits++; return null; } }), false);
  assert.equal(waits, 2);
  waits = 0;
  assert.equal(await checkAppConnection({ bridgeReady: async () => { waits++; return bridge; } }), true);
  assert.equal(waits, 1);
});
