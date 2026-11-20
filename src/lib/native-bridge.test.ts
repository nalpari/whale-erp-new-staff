// node --test src/lib/native-bridge.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BRIDGE_READY_EVENT,
  appVersionOf,
  callNative,
  getAppInfo,
  isAppInfo,
  isInApp,
  readBridgeResult,
  waitForBridge,
  type Bridge,
} from "./native-bridge.ts";

const ANDROID_APP =
  "Mozilla/5.0 (Linux; Android 17; sdk_gphone16k_arm64 Build/CE2A.260420.051.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/145.0.7632.218 Mobile Safari/537.36 WhaleStaffApp/1.0.0";
const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const isString = (data: unknown): data is string => typeof data === "string";
const bridgeAnswering = (answer: unknown): Bridge => ({ callHandler: async () => answer });

test("User-Agent 끝의 WhaleStaffApp/<버전> 으로 앱 버전을 읽는다", () => {
  assert.equal(appVersionOf(ANDROID_APP), "1.0.0");
  assert.equal(appVersionOf("... WhaleStaffApp/2.3.4 Extra/1"), "2.3.4");
  assert.equal(appVersionOf(SAFARI), null);
  assert.equal(appVersionOf("... WhaleStaffApp/"), null);
});

test("앱 안인지는 표식이 있는지로만 본다 — 예전 표식 WhaleERPStaffApp 은 앱이 아니다", () => {
  assert.equal(isInApp(ANDROID_APP), true);
  assert.equal(isInApp(SAFARI), false);
  assert.equal(isInApp("Mozilla/5.0 WhaleERPStaffApp"), false);
  assert.equal(isInApp(""), false);
});

test("약속대로 온 답은 그대로, 없는 기능(null)은 unavailable", () => {
  assert.deepEqual(readBridgeResult({ ok: true, data: "x" }, isString), { ok: true, data: "x" });
  assert.deepEqual(readBridgeResult({ ok: false, error: "forbidden" }, isString), { ok: false, error: "forbidden" });
  assert.deepEqual(readBridgeResult({ ok: false, error: "failed" }, isString), { ok: false, error: "failed" });
  assert.deepEqual(readBridgeResult(null, isString), { ok: false, error: "unavailable" });
  assert.deepEqual(readBridgeResult(undefined, isString), { ok: false, error: "unavailable" });
});

test("약속과 다른 답은 malformed — data 모양이 틀려도, 모르는 오류 코드여도", () => {
  assert.deepEqual(readBridgeResult({ ok: true, data: 1 }, isString), { ok: false, error: "malformed" });
  assert.deepEqual(readBridgeResult({ ok: true }, isString), { ok: false, error: "malformed" });
  assert.deepEqual(readBridgeResult({ ok: false, error: "boom" }, isString), { ok: false, error: "malformed" });
  assert.deepEqual(readBridgeResult("ok", isString), { ok: false, error: "malformed" });
  assert.deepEqual(readBridgeResult({ data: "x" }, isString), { ok: false, error: "malformed" });
});

test("브리지가 없으면 unavailable, 호출이 예외로 끝나면 failed", async (t) => {
  t.mock.method(console, "error", () => {});
  assert.deepEqual(await callNative("x", [], isString, null), { ok: false, error: "unavailable" });
  const throwing: Bridge = { callHandler: async () => { throw new Error("x"); } };
  assert.deepEqual(await callNative("x", [], isString, throwing), { ok: false, error: "failed" });
});

test("부를 때 이름과 인자를 그대로 넘긴다", async () => {
  const calls: unknown[][] = [];
  const bridge: Bridge = { callHandler: async (...args) => { calls.push(args); return { ok: true, data: "y" }; } };
  assert.deepEqual(await callNative("echo", [1, "a"], isString, bridge), { ok: true, data: "y" });
  assert.deepEqual(calls, [["echo", 1, "a"]]);
});

test("appInfo 는 버전과 운영체제를 받는다 — 모르는 운영체제 값은 malformed", async (t) => {
  t.mock.method(console, "error", () => {});
  assert.deepEqual(await getAppInfo(bridgeAnswering({ ok: true, data: { version: "1.0.0", platform: "android" } })), {
    ok: true,
    data: { version: "1.0.0", platform: "android" },
  });
  assert.deepEqual(await getAppInfo(bridgeAnswering({ ok: true, data: { version: "1.0.0", platform: "windows" } })), {
    ok: false,
    error: "malformed",
  });
  assert.equal(isAppInfo({ version: "1.0.0", platform: "ios" }), true);
  assert.equal(isAppInfo({ platform: "ios" }), false);
});

/** 이벤트를 흉내 내는 가짜 window. */
function fakeWindow(bridge?: Bridge) {
  const listeners = new Set<() => void>();
  const win = {
    flutter_inappwebview: bridge,
    addEventListener: (type: string, listener: () => void) => { if (type === BRIDGE_READY_EVENT) listeners.add(listener); },
    removeEventListener: (_type: string, listener: () => void) => { listeners.delete(listener); },
  };
  const ready = (next: Bridge) => { win.flutter_inappwebview = next; for (const listener of [...listeners]) listener(); };
  return { win: win as never, ready, listeners };
}

test("앱 밖이면 기다리지 않고 null", async () => {
  const { win } = fakeWindow(bridgeAnswering(null));
  assert.equal(await waitForBridge(win, { userAgent: SAFARI }), null);
});

test("앱 안이고 이미 준비됐으면 바로 그 브리지", async () => {
  const bridge = bridgeAnswering(null);
  const { win } = fakeWindow(bridge);
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP }), bridge);
});

test("앱 안인데 아직이면 준비 이벤트를 기다리고, 받은 뒤 듣기를 그친다", async () => {
  const bridge = bridgeAnswering(null);
  const { win, ready, listeners } = fakeWindow();
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000 });
  ready(bridge);
  assert.equal(await waiting, bridge);
  assert.equal(listeners.size, 0);
});

test("준비 이벤트가 제때 오지 않으면 null 이고 듣기를 그친다", async () => {
  const { win, listeners } = fakeWindow();
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10 }), null);
  assert.equal(listeners.size, 0);
});
