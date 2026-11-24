// node --test src/lib/native-bridge.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BRIDGE_READY_EVENT,
  BRIDGE_READY_FLAG,
  BRIDGE_READY_TRACKER_SCRIPT,
  appVersionOf,
  callNative,
  getAppInfo,
  isAppInfo,
  isInApp,
  readBridgeResult,
  waitForBridge,
  type Bridge,
  MEASURE_LOCATION_TIMEOUT_MS,
  isAppLocation,
  measureLocation,
  appLocationProblems,
} from "./native-bridge.ts";

const ANDROID_APP =
  "Mozilla/5.0 (Linux; Android 17; sdk_gphone16k_arm64 Build/CE2A.260420.051.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/145.0.7632.218 Mobile Safari/537.36 WhaleStaffApp/1.0.0";
const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const isString = (data: unknown): data is string => typeof data === "string";
const bridgeAnswering = (answer: unknown): Bridge => ({ callHandler: async () => answer });

/**
 * console.error 가운데 이 모듈이 남긴 것(`[native-bridge]` 로 시작)만 고른다. 호출 수 전체를 세면
 * Node 가 테스트 도중 console.error 로 내보내는 경고(예: MODULE_TYPELESS_PACKAGE_JSON)까지 섞여 깨진다.
 */
function bridgeErrors(error: { mock: { calls: { arguments: unknown[] }[] } }): string[] {
  return error.mock.calls
    .map((call) => String(call.arguments[0]))
    .filter((message) => message.startsWith("[native-bridge]"));
}

test("User-Agent 끝의 WhaleStaffApp/<버전> 으로 앱 버전을 읽는다", () => {
  assert.equal(appVersionOf(ANDROID_APP), "1.0.0");
  assert.equal(appVersionOf("... WhaleStaffApp/2.3.4 Extra/1"), "2.3.4");
  assert.equal(appVersionOf(SAFARI), null);
  assert.equal(appVersionOf("... WhaleStaffApp/"), null);
  assert.equal(appVersionOf("WhaleStaffApp/3.0.0"), "3.0.0");
});

test("표식이 다른 제품명 안에 들어 있으면 앱이 아니다", () => {
  assert.equal(appVersionOf("Mozilla/5.0 NotWhaleStaffApp/1.0.0"), null);
  assert.equal(isInApp("Mozilla/5.0 NotWhaleStaffApp/1.0.0"), false);
  assert.equal(appVersionOf("Mozilla/5.0 NotWhaleStaffApp/1.0.0 WhaleStaffApp/2.0.0"), "2.0.0");
});

test("앱 안인지는 표식이 있는지로만 본다 — 예전 표식 WhaleERPStaffApp 은 앱이 아니다", () => {
  assert.equal(isInApp(ANDROID_APP), true);
  assert.equal(isInApp(SAFARI), false);
  assert.equal(isInApp("Mozilla/5.0 WhaleERPStaffApp"), false);
  assert.equal(isInApp(""), false);
});

test("약속대로 온 답은 그대로, 없는 기능(null)은 unavailable", () => {
  assert.deepEqual(readBridgeResult({ ok: true, data: "x" }, isString), { ok: true, data: "x" });
  const anyData = (value: unknown): value is unknown => value === value;
  assert.deepEqual(readBridgeResult({ ok: true }, anyData), { ok: false, error: "malformed" });
  assert.deepEqual(readBridgeResult({ ok: true, data: undefined }, anyData), { ok: true, data: undefined });
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

test("브리지가 없으면 unavailable, 호출이 예외로 끝나면 failed 이고 콘솔에 남긴다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  assert.deepEqual(await callNative("x", [], isString, null), { ok: false, error: "unavailable" });
  assert.equal(bridgeErrors(error).length, 0);
  const throwing: Bridge = { callHandler: async () => { throw new Error("x"); } };
  assert.deepEqual(await callNative("x", [], isString, throwing), { ok: false, error: "failed" });
  assert.equal(bridgeErrors(error).length, 1);
  assert.match(bridgeErrors(error)[0] ?? "", /x 호출 실패/);
});

test("앱이 제때 답하지 않으면 failed 이고 콘솔에 남긴다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const silent: Bridge = { callHandler: () => new Promise(() => {}) };
  assert.deepEqual(await callNative("slow", [], isString, silent, { timeoutMs: 10 }), { ok: false, error: "failed" });
  assert.equal(bridgeErrors(error).length, 1);
  assert.match(bridgeErrors(error)[0] ?? "", /slow .*10ms 안에 답하지 않음/);
});

test("약속과 다른 답이면 콘솔에 남긴다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  assert.deepEqual(await callNative("odd", [], isString, bridgeAnswering({ ok: "yes" })), { ok: false, error: "malformed" });
  assert.equal(bridgeErrors(error).length, 1);
  assert.match(bridgeErrors(error)[0] ?? "", /odd 의 답이 약속과 다르다/);
});

test("브리지를 넘기지 않으면 스스로 기다린다 — 서버(window 없음)에서는 unavailable", async () => {
  assert.equal(typeof window, "undefined");
  assert.deepEqual(await callNative("x", [], isString), { ok: false, error: "unavailable" });
  assert.deepEqual(await getAppInfo(), { ok: false, error: "unavailable" });
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
function fakeWindow(bridge?: unknown) {
  const listeners = new Set<() => void>();
  const win = {
    flutter_inappwebview: bridge,
    addEventListener: (type: string, listener: () => void) => { if (type === BRIDGE_READY_EVENT) listeners.add(listener); },
    removeEventListener: (_type: string, listener: () => void) => { listeners.delete(listener); },
  };
  const ready = (next?: unknown) => { win.flutter_inappwebview = next; for (const listener of [...listeners]) listener(); };
  return { win: win as never, ready, listeners };
}

test("앱 밖이면 기다리지 않고 null", async () => {
  const { win } = fakeWindow(bridgeAnswering(null));
  assert.equal(await waitForBridge(win, { userAgent: SAFARI }), null);
});

const IOS_APP = `${SAFARI} WhaleStaffApp/1.0.0`;

test("Android 앱 안이고 준비 표시(_platformReady)까지 있으면 바로 그 브리지", async () => {
  const bridge = { ...bridgeAnswering(null), _platformReady: true };
  const { win } = fakeWindow(bridge);
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP }), bridge);
});

test("Android 에서 callHandler 만 보이고 준비 표시가 없으면 준비 이벤트를 기다린다", async () => {
  const early = bridgeAnswering(null);
  const { win, ready, listeners } = fakeWindow(early);
  let settled = false;
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000 }).then((value) => {
    settled = true;
    return value;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, false);
  assert.equal(listeners.size, 1);
  ready(early);
  assert.equal(await waiting, early);
});

test("Android 에서 준비 이벤트가 끝내 안 와도 callHandler 가 있으면 시간이 다 된 뒤 그것으로 부른다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const early = bridgeAnswering(null);
  const { win } = fakeWindow(early);
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10 }), early);
  assert.equal(bridgeErrors(error).length, 0);
});

test("iOS 앱 안이면 준비 표시 없이도 callHandler 가 보이면 바로 그 브리지", async () => {
  const bridge = bridgeAnswering(null);
  const { win } = fakeWindow(bridge);
  assert.equal(await waitForBridge(win, { userAgent: IOS_APP }), bridge);
});

test("앱 안인데 아직이면 준비 이벤트를 기다리고, 받은 뒤 듣기를 그친다", async () => {
  const bridge = bridgeAnswering(null);
  const { win, ready, listeners } = fakeWindow();
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000 });
  ready(bridge);
  assert.equal(await waiting, bridge);
  assert.equal(listeners.size, 0);
});

test("준비 이벤트가 제때 오지 않으면 null 이고 듣기를 그치며, 앱 안의 고장이라 콘솔에 남긴다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const { win, listeners } = fakeWindow();
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10 }), null);
  assert.equal(listeners.size, 0);
  assert.equal(bridgeErrors(error).length, 1);
  assert.match(bridgeErrors(error)[0] ?? "", /1\.0\.0.*10ms 안에 준비 이벤트가 오지 않음/);
});

test("준비 이벤트가 왔는데 callHandler 가 없으면 null 이고 콘솔에 남긴다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const { win, ready, listeners } = fakeWindow();
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000 });
  ready();
  assert.equal(await waiting, null);
  assert.equal(listeners.size, 0);
  assert.equal(bridgeErrors(error).length, 1);
  assert.match(bridgeErrors(error)[0] ?? "", /callHandler 가 없음/);
});

test("객체만 있고 callHandler 가 아직 없으면 준비로 보지 않고 이벤트를 기다린다", async () => {
  const bridge = bridgeAnswering(null);
  const { win, ready } = fakeWindow({});
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000 });
  ready(bridge);
  assert.equal(await waiting, bridge);
});

test("앱 밖에서 브리지가 없는 것은 고장이 아니라 콘솔에 남기지 않는다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const { win } = fakeWindow();
  assert.equal(await waitForBridge(win, { userAgent: SAFARI, timeoutMs: 10 }), null);
  assert.equal(bridgeErrors(error).length, 0);
});

test("measureLocation 은 앱에 measureLocation 이라는 이름으로 묻는다", async () => {
  const calls: unknown[][] = [];
  await measureLocation({
    callHandler: async (...args: unknown[]) => {
      calls.push(args);
      return { ok: true, data: { status: "denied" } };
    },
  });
  assert.deepEqual(calls, [["measureLocation"]]);
});

test("isAppLocation 은 약속에 맞는 값을 받는다 — 숫자 정확도 · 참거짓 precise · reason 다섯 가지", () => {
  const ok = { status: "ok", latitude: 37.5, longitude: 127, accuracyMeters: 5, ageSeconds: 0, mocked: false, precise: true };
  assert.equal(isAppLocation(ok), true);
  assert.equal(isAppLocation({ ...ok, precise: false }), true);
  assert.equal(isAppLocation({ ...ok, accuracyMeters: null, precise: null }), true);
  for (const reason of ["serviceDisabled", "permissionCheckFailed", "permissionTimeout", "timeout", "error"]) {
    assert.equal(isAppLocation({ status: "unavailable", reason }), true, reason);
  }
  assert.equal(isAppLocation({ status: "unavailable" }), false);
  assert.equal(isAppLocation({ ...ok, accuracyMeters: undefined }), false);
  assert.equal(isAppLocation({ ...ok, precise: undefined }), false);
  assert.equal(isAppLocation({ ...ok, longitude: Number.POSITIVE_INFINITY }), false);
});

test("measureLocation 은 75초를 기다리고 약속에 맞는 답만 받는다", async (t) => {
  t.mock.method(console, "error", () => {});
  const ok = { status: "ok", latitude: 37.5, longitude: 127, accuracyMeters: null, ageSeconds: 3, mocked: true, precise: null };
  assert.equal(MEASURE_LOCATION_TIMEOUT_MS, 75_000);
  assert.deepEqual(await measureLocation({ callHandler: async () => ({ ok: true, data: ok }) }), { ok: true, data: ok });
  assert.deepEqual(await measureLocation({ callHandler: async () => ({ ok: true, data: { status: "denied" } }) }), {
    ok: true,
    data: { status: "denied" },
  });
  assert.deepEqual(
    await measureLocation({ callHandler: async () => ({ ok: true, data: { status: "unavailable", reason: "timeout" } }) }),
    { ok: true, data: { status: "unavailable", reason: "timeout" } },
  );
  assert.equal(isAppLocation({ status: "unavailable", reason: "boom" }), false);
  assert.equal(isAppLocation({ ...ok, mocked: "yes" }), false);
  assert.equal(isAppLocation({ ...ok, latitude: Number.NaN }), false);
  assert.equal(isAppLocation({ ...ok, ageSeconds: undefined }), false);
  // 좌표 범위 · 위치 나이가 말이 안 되면 약속과 다른 답이다.
  assert.equal(isAppLocation({ ...ok, latitude: 127 }), false);
  assert.equal(isAppLocation({ ...ok, latitude: -90.1 }), false);
  assert.equal(isAppLocation({ ...ok, longitude: 180.5 }), false);
  assert.equal(isAppLocation({ ...ok, latitude: 90, longitude: -180 }), true);
  assert.equal(isAppLocation({ ...ok, ageSeconds: -1 }), false);
  assert.equal(isAppLocation({ status: "ok" }), false);
});

test("measureLocation 의 약속과 다른 답은 좌표 없이 어긋난 칸 이름만 콘솔에 남긴다(ATT-05)", async (t) => {
  const logged: unknown[][] = [];
  const everything: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => { logged.push(args); everything.push(args); });
  for (const level of ["warn", "log", "info", "debug"] as const) {
    t.mock.method(console, level, (...args: unknown[]) => { everything.push(args); });
  }
  const raw = { ok: true, data: { status: "ok", latitude: 37.5665, longitude: 126.978, accuracyMeters: 5, ageSeconds: "x", mocked: true, precise: true, "37.5665,126.978": 1 } };
  assert.deepEqual(await measureLocation({ callHandler: async () => raw }), { ok: false, error: "malformed" });
  const ours = logged.filter((args) => String(args[0]).startsWith("[native-bridge]"));
  assert.equal(ours.length, 1);
  assert.deepEqual(ours[0][1], { code: "measureLocation-malformed", fields: ["ageSeconds"] });
  // 접두어와 상관없이, 어떤 수준의 콘솔 출력에도 좌표가 없어야 한다
  const text = JSON.stringify(everything);
  assert.equal(text.includes("37.5665"), false);
  assert.equal(text.includes("126.978"), false);
});

test("약속과 다른 답의 기록을 만들다 예외가 나도 결과는 malformed 로 돌려주고 원본(좌표)은 남기지 않는다", async (t) => {
  const everything: unknown[][] = [];
  for (const level of ["error", "warn", "log", "info", "debug"] as const) {
    t.mock.method(console, level, (...args: unknown[]) => { everything.push(args); });
  }
  const result = await callNative(
    "x",
    [],
    (data: unknown): data is string => typeof data === "string",
    bridgeAnswering({ ok: true, data: { latitude: 37.5665, longitude: 126.978 } }),
    // 예외 메시지에도 좌표가 담길 수 있다.
    { describeMalformed: () => { throw new Error("기록 실패 37.5665,126.978"); } },
  );
  assert.deepEqual(result, { ok: false, error: "malformed" });
  const ours = everything.filter((args) => String(args[0]).startsWith("[native-bridge]"));
  assert.equal(ours.length, 1);
  assert.deepEqual(ours[0][1], { describeFailed: true });
  const text = JSON.stringify(everything);
  assert.equal(text.includes("37.5665"), false);
  assert.equal(text.includes("126.978"), false);
});

test("strict 면 시간이 다 됐을 때 준비 표시 없는 Android 브리지는 null(다시 시도가 연결됨으로 잘못 알리지 않게)", async (t) => {
  t.mock.method(console, "error", () => {});
  const early = bridgeAnswering(null);
  const { win } = fakeWindow(early);
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10, strict: true }), null);
  const readyBridge = { ...bridgeAnswering(null), _platformReady: true };
  assert.equal(await waitForBridge(fakeWindow(readyBridge).win, { userAgent: ANDROID_APP, timeoutMs: 10, strict: true }), readyBridge);
});

test("strict 로 기다리는 사이 준비 표시만 붙고 이벤트가 없으면 시간이 다 된 뒤 그 브리지를 쓴다", async () => {
  const late: { callHandler: Bridge["callHandler"]; _platformReady?: boolean } = { ...bridgeAnswering(null) };
  const { win } = fakeWindow(late);
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 20, strict: true });
  late._platformReady = true;
  assert.equal(await waiting, late);
});

test("strict 로 떨어진 것은 「브리지가 없다」가 아니라 준비 표시 없음으로 남긴다", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const { win } = fakeWindow(bridgeAnswering(null));
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10, strict: true }), null);
  const messages = error.mock.calls.map((call) => String(call.arguments[0]));
  assert.equal(messages.some((m) => m.includes("준비 표시가 없음(strict)")), true);
  assert.equal(messages.some((m) => m.includes("브리지가 없다")), false);
});

test("strict 여도 준비 이벤트가 오면 그 브리지를 쓴다", async () => {
  const early = bridgeAnswering(null);
  const { win, ready } = fakeWindow(early);
  const waiting = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000, strict: true });
  ready(early);
  assert.equal(await waiting, early);
});

test("appLocationProblems 는 약속 문서의 칸만, 모양이 틀린 것만 고른다", () => {
  assert.deepEqual(appLocationProblems("x"), { code: "measureLocation-malformed", fields: ["(답 모양)"] });
  assert.deepEqual(appLocationProblems({ ok: true }), { code: "measureLocation-malformed", fields: ["data"] });
  assert.deepEqual(appLocationProblems({ ok: true, data: { status: "ok", latitude: 200, longitude: 1, accuracyMeters: null, ageSeconds: 0, mocked: false, precise: null } }), {
    code: "measureLocation-malformed",
    fields: ["latitude"],
  });
  assert.deepEqual(appLocationProblems({ ok: true, data: { status: "unavailable", reason: "boom" } }), { code: "measureLocation-malformed", fields: ["reason"] });
  assert.deepEqual(appLocationProblems({ ok: true, data: { status: "weird" } }), { code: "measureLocation-malformed", fields: ["status"] });
});

test("준비 이벤트를 받은 브리지는 준비 표시가 없어도 다음 strict 대기에서 바로 준비된 것으로 본다(다시 시도 뒤 출퇴근)", async () => {
  const bridge = bridgeAnswering(null);
  const { win, ready } = fakeWindow(bridge);
  const first = waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 1000, strict: true });
  ready(bridge);
  assert.equal(await first, bridge);
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10, strict: true }), bridge);
});

test("모듈이 불러와지기 전에 지나간 준비 이벤트도 레이아웃 스크립트가 남긴 표시로 준비된 것으로 본다", async (t) => {
  assert.match(BRIDGE_READY_TRACKER_SCRIPT, new RegExp(BRIDGE_READY_EVENT));
  assert.match(BRIDGE_READY_TRACKER_SCRIPT, new RegExp(BRIDGE_READY_FLAG));
  // 브리지가 바뀌어 준비 이벤트가 다시 와도 기록하도록 한 번만 듣지 않는다.
  assert.equal(BRIDGE_READY_TRACKER_SCRIPT.includes("once"), false);
  const globals = globalThis as unknown as Record<string, unknown>;
  const bridge = bridgeAnswering(null);
  globals.window = { [BRIDGE_READY_FLAG]: bridge };
  t.after(() => { delete globals.window; });
  const { win, listeners } = fakeWindow(bridge);
  assert.equal(await waitForBridge(win, { userAgent: ANDROID_APP, timeoutMs: 10, strict: true }), bridge);
  assert.equal(listeners.size, 0);
  // 이벤트 뒤에 브리지가 바뀌었으면 새 브리지는 준비된 것으로 보지 않는다.
  t.mock.method(console, "error", () => {});
  const replaced = fakeWindow(bridgeAnswering(null));
  assert.equal(await waitForBridge(replaced.win, { userAgent: ANDROID_APP, timeoutMs: 10, strict: true }), null);
});
