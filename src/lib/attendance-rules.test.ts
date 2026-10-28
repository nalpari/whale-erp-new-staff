// node --test src/lib/attendance-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  distanceMeters,
  elapsedLabel,
  elapsedOf,
  kstMonthDayTime,
  kstTime,
  recordedReasonLabel,
  registerProblemOf,
  reviewReasonOf,
  termsCoverMap,
} from "./attendance-rules.ts";

test("거리는 하버사인 — 위도 0.001도는 약 111m", () => {
  const d = distanceMeters({ latitude: 37.498, longitude: 127.0276 }, { latitude: 37.499, longitude: 127.0276 });
  assert.ok(Math.abs(d - 111.2) < 0.5, String(d));
  assert.equal(distanceMeters({ latitude: 37.5, longitude: 127 }, { latitude: 37.5, longitude: 127 }), 0);
});

test("반경 밖이면 출근 · 퇴근 모두 사유를 붙이고, 위치 조작 감지는 출근만 막는다 (ATT-11 · ATT-21)", () => {
  assert.equal(reviewReasonOf("CHECK_IN", { inRange: true, mocked: false }), null);
  assert.equal(reviewReasonOf("CHECK_IN", { inRange: false, mocked: false }), "OUT_OF_RADIUS_CHECKIN");
  assert.equal(reviewReasonOf("CHECK_OUT", { inRange: false, mocked: false }), "OUT_OF_RADIUS_CHECKOUT");
  assert.equal(reviewReasonOf("CHECK_IN", { inRange: true, mocked: true }), "blocked");
  assert.equal(reviewReasonOf("CHECK_OUT", { inRange: true, mocked: true }), "MOCK_LOCATION");
});

test("api 실패는 code 로 갈래를 나눈다", () => {
  const f = (status: number) => ({ status, message: "원문" });
  assert.equal(registerProblemOf(f(409), { code: "ALREADY_CHECKED_IN" }).kind, "already-checked-in");
  assert.equal(registerProblemOf(f(409), { code: "NO_OPEN_CHECK_IN" }).kind, "no-open-check-in");
  assert.deepEqual(registerProblemOf(f(409), { code: "CHECK_OUT_EXPIRED" }), { kind: "error", message: "원문", log: false });
  assert.deepEqual(registerProblemOf(f(422), { code: "STORE_LOCATION_MISSING" }), { kind: "stale", message: "원문" });
  assert.deepEqual(registerProblemOf(f(400), { code: "LOCATION_READ_REQUIRED" }), { kind: "stale", message: "원문" });
  assert.deepEqual(registerProblemOf(f(422), { code: "CONTRACT_PENDING_SIGNATURE", contractId: 44 }), {
    kind: "contract-pending",
    message: "원문",
    contractId: 44,
  });
  assert.equal(registerProblemOf(f(422), { code: "NO_CONTRACT" }).kind, "no-contract");
  assert.equal(registerProblemOf(f(403), { code: "LOCATION_CONSENT_REQUIRED" }).kind, "consent-required");
  assert.equal(registerProblemOf(f(403), { code: "LOCATION_PAUSED" }).kind, "paused");
  assert.equal(registerProblemOf(f(404), null).kind, "stale");
  assert.deepEqual(registerProblemOf("network", null), { kind: "error", message: "등록하지 못했습니다. 잠시 뒤 다시 시도해 주세요", log: false });
  assert.equal((registerProblemOf(f(400), null) as { log: boolean }).log, true);
  assert.equal((registerProblemOf(f(503), null) as { log: boolean }).log, false);
});

test("시각은 한국 시각, 경과는 시간 · 두 자리 분", () => {
  assert.equal(kstTime(new Date("2026-10-22T00:02:00Z")), "09:02");
  assert.equal(kstTime(new Date("2026-10-22T15:30:00Z")), "00:30");
  assert.equal(kstMonthDayTime(new Date("2026-10-22T15:30:00Z")), "10/23 00:30");
  const e = elapsedOf(new Date("2026-10-22T00:02:00Z"), new Date("2026-10-22T06:43:30Z"));
  assert.deepEqual(e, { hours: 6, minutes: 41 });
  assert.equal(elapsedLabel(e), "6시간 41분");
  assert.deepEqual(elapsedOf(new Date(2000), new Date(1000)), { hours: 0, minutes: 0 });
});

test("등록된 기록의 사유 이름 — api 가 붙이는 근무 12시간 초과까지, 모르는 값은 null", () => {
  assert.equal(recordedReasonLabel("LONG_SHIFT"), "근무 12시간 초과");
  assert.equal(recordedReasonLabel("MOCK_LOCATION"), "위치 조작 감지");
  assert.equal(recordedReasonLabel("ACCURACY_EXCEEDED"), null);
});

test("탭 진입 읽기 · 카카오 지도의 내 위치는 LOCATION v1.1 이상을 시행할 때만 (2026-10-28 재영)", () => {
  assert.equal(termsCoverMap("v1.1"), true);
  assert.equal(termsCoverMap("v1.2"), true);
  assert.equal(termsCoverMap("v1.10"), true);
  assert.equal(termsCoverMap("v2.0"), true);
  assert.equal(termsCoverMap("v1.0"), false); // api 가 아직 v1.1 을 시행하지 않음(배포 순서 · 롤백)
  assert.equal(termsCoverMap("v0.9"), false);
  assert.equal(termsCoverMap(null), false);
  for (const unknown of ["1.1", "V1.1", "v1.1.0", ""]) assert.equal(termsCoverMap(unknown), false, unknown); // 모르는 모양은 막는다
});
