// node --test src/lib/notifications.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { PREFERENCE_ITEMS, isPreferenceCategory, targetHref, timeLabel } from "./notifications.ts";

test("갈 곳 경로 — 근무스케줄은 그 달 · 그 날, TO-DO 는 근무 탭 TO-DO, 없으면 null", () => {
  assert.equal(
    targetHref({ type: "WORK_SCHEDULE", staffMemberId: 7, workDate: "2026-11-02" }),
    "/work?tab=schedule&month=2026-11&day=2026-11-02",
  );
  assert.equal(targetHref({ type: "TODO", staffMemberId: 7, todoId: 3 }), "/work?tab=todo");
  // 급여명세서는 명세서 상세로(근무지와 상관없다)
  assert.equal(targetHref({ type: "PAYSLIP", payslipId: 9 }), "/pay/9");
  // 근로계약서는 이 앱에 계약 화면이 아직 없어 열 수 없다
  assert.equal(targetHref({ type: "CONTRACT", staffMemberId: 7, contractId: 4 }), null);
  assert.equal(targetHref(null), null);
  // 근무스케줄인데 근무일이 없으면 갈 수 없다
  assert.equal(targetHref({ type: "WORK_SCHEDULE", staffMemberId: 7 }), null);
});

test("받은 시각 — 방금 · n분 전 · n시간 전 · 어제 HH:MM · n일 전 (한국 날짜 기준)", () => {
  const now = new Date("2026-10-22T06:00:00.000Z"); // 한국 15:00
  const at = (iso: string) => timeLabel(iso, now);
  assert.equal(at("2026-10-22T05:59:40.000Z"), "방금");
  assert.equal(at("2026-10-22T05:56:00.000Z"), "4분 전");
  assert.equal(at("2026-10-22T05:00:00.000Z"), "1시간 전");
  // 오늘 한국 00:30 — 14시간 반 전이라도 같은 날이면 시간
  assert.equal(at("2026-10-21T15:30:00.000Z"), "14시간 전");
  // 어제 한국 13:00
  assert.equal(at("2026-10-21T04:00:00.000Z"), "어제 13:00");
  assert.equal(at("2026-10-14T04:00:00.000Z"), "8일 전");
});

test("수신 설정 묶음 — 네 가지, 모르는 값은 거른다", () => {
  assert.deepEqual(
    PREFERENCE_ITEMS.map((i) => i.category),
    ["CONTRACT", "SCHEDULE", "TODO", "PAYSLIP"],
  );
  assert.equal(isPreferenceCategory("TODO"), true);
  assert.equal(isPreferenceCategory("ETC"), false);
});
