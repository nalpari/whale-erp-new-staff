// node --test src/lib/todos.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countByStatus,
  dayLabel,
  isOverdue,
  isTodoStatus,
  kstLabel,
  knownStatusError,
  performerLine,
  storesOf,
  todoMeta,
  toggledStatus,
  type MyTodo,
} from "./todos.ts";

const todo = (over: Partial<MyTodo>): MyTodo => ({
  todoId: 1,
  storeId: 10,
  storeName: "강남점",
  title: "마감 청소",
  body: null,
  assigneeType: "INDIVIDUAL",
  executionMode: "EACH",
  dueDate: "2026-10-19",
  dueTime: null,
  status: "PENDING",
  completedAt: null,
  performer: null,
  isUrgent: false,
  ...over,
});

test("상태별 개수", () => {
  const items = [todo({ status: "PENDING" }), todo({ status: "DONE" }), todo({ status: "DONE" }), todo({ status: "IN_PROGRESS" })];
  assert.deepEqual(countByStatus(items), { PENDING: 1, IN_PROGRESS: 1, DONE: 2 });
  assert.deepEqual(countByStatus([]), { PENDING: 0, IN_PROGRESS: 0, DONE: 0 });
});

test("근무지는 처음 나온 순서로 한 번씩, 이름이 없으면 대체 문구", () => {
  const items = [todo({ storeId: 2, storeName: "역삼점" }), todo({ storeId: 1 }), todo({ storeId: 2, storeName: "역삼점" }), todo({ storeId: 3, storeName: null })];
  assert.deepEqual(storesOf(items), [
    { storeId: 2, storeName: "역삼점" },
    { storeId: 1, storeName: "강남점" },
    { storeId: 3, storeName: "이름 없는 근무지" },
  ]);
});

test("체크는 완료, 풀면 대기 · 상태 값 거르기", () => {
  assert.equal(toggledStatus(true), "DONE");
  assert.equal(toggledStatus(false), "PENDING");
  assert.ok(isTodoStatus("IN_PROGRESS"));
  assert.ok(!isTodoStatus("CANCELLED"));
  assert.ok(!isTodoStatus(undefined));
});

test("상태 바꾸기 실패 문구", () => {
  assert.equal(knownStatusError(409, { code: "TODO_ALREADY_DONE", performer: null }), "이미 완료된 TO-DO 입니다");
  assert.equal(knownStatusError(409, { code: "TODO_STATUS_CONFLICT" }), "그사이 상태가 바뀌어 지금 상태를 다시 불러왔습니다");
  assert.equal(knownStatusError(409, null), "그사이 상태가 바뀌어 지금 상태를 다시 불러왔습니다");
  assert.equal(knownStatusError(404, null), "배정이 풀렸거나 지워진 TO-DO 입니다");
  assert.equal(knownStatusError(500, null), null);
  assert.equal(knownStatusError(400, null), null);
});

test("날짜 · 한국 시각 표시", () => {
  assert.equal(dayLabel("2026-10-19"), "10월 19일(월)");
  // UTC 15:30 은 한국 다음 날 00:30 이다.
  assert.equal(kstLabel("2026-10-19T15:30:00.000Z"), "10월 20일(화) 00:30");
});

test("기한 지남 — 시간 있으면 그 시각, 날짜만이면 그날 끝(한국 시각)", () => {
  const timed = todo({ dueTime: "18:00" });
  assert.ok(!isOverdue(timed, new Date("2026-10-19T08:59:00Z"))); // 17:59 KST
  assert.ok(isOverdue(timed, new Date("2026-10-19T09:00:00Z"))); // 18:00 KST
  const dateOnly = todo({});
  assert.ok(!isOverdue(dateOnly, new Date("2026-10-19T14:59:00Z"))); // 23:59 KST
  assert.ok(isOverdue(dateOnly, new Date("2026-10-19T15:00:00Z"))); // 다음 날 00:00 KST
  assert.ok(!isOverdue(todo({ status: "DONE" }), new Date("2027-01-01T00:00:00Z")));
});

test("공유 완료는 먼저 완료한 직원과 시각", () => {
  const shared = todo({
    executionMode: "ANY_ONE",
    status: "DONE",
    completedAt: "2026-10-19T07:40:00.000Z",
    performer: { staffMemberId: 7, staffMemberName: "김하은" },
  });
  assert.equal(performerLine(shared), "김하은님이 완료 · 10월 19일(월) 16:40");
  assert.equal(performerLine(todo({ performer: shared.performer })), null);
});

test("목록 아래 글자", () => {
  const now = new Date("2026-10-19T03:00:00Z"); // 12:00 KST
  assert.equal(todoMeta(todo({ dueTime: "14:00" }), now), "10월 19일(월) 14:00");
  assert.equal(todoMeta(todo({}), now), "10월 19일(월) · 시간 미정");
  assert.equal(todoMeta(todo({ dueDate: "2026-10-18", dueTime: "09:00" }), now), "10월 18일(일) · 기한 지남");
  assert.equal(todoMeta(todo({ status: "DONE", completedAt: "2026-10-19T01:05:00.000Z" }), now), "10월 19일(월) 10:05 완료");
});
