// 내 TO-DO(근무 탭 · 홈 카드)의 순수 계산 — 개수 세기, 근무지 묶기, 체크 · 오류 문구, 일시 표시.
// node --test 가 직접 읽으므로 값 import 는 두지 않는다(타입 import 는 지워진다).
import type { Schemas } from "./api";

export type MyTodo = Schemas["TodoItemDto"];
export type TodoStatus = Schemas["TodoStatus"];

/** 상세 시트의 상태 바꾸기 순서와 한글 이름. 칩 색은 목업(StatusChip)과 같다. */
export const TODO_STATUS = {
  PENDING: { label: "대기", tone: "neutral" },
  IN_PROGRESS: { label: "진행 중", tone: "progress" },
  DONE: { label: "완료", tone: "success" },
} as const satisfies Record<TodoStatus, { label: string; tone: string }>;

export const TODO_STATUSES = Object.keys(TODO_STATUS) as TodoStatus[];

export const isTodoStatus = (value: unknown): value is TodoStatus => TODO_STATUSES.includes(value as TodoStatus);

export function countByStatus(items: readonly MyTodo[]): Record<TodoStatus, number> {
  const counts: Record<TodoStatus, number> = { PENDING: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** 목록에 나온 근무지를 처음 나온 순서로. 둘 이상일 때만 근무지 칩을 보인다. */
export function storesOf(items: readonly MyTodo[]): { storeId: number; storeName: string }[] {
  const stores = new Map<number, string>();
  for (const item of items) if (!stores.has(item.storeId)) stores.set(item.storeId, item.storeName ?? "이름 없는 근무지");
  return [...stores].map(([storeId, storeName]) => ({ storeId, storeName }));
}

/** 목록 체크칸 — 체크하면 완료, 완료 전 상태(대기·진행 중)를 응답이 알려 주지 않아 풀면 대기로 돌린다. 진행 중은 상세 시트에서 고른다. */
export const toggledStatus = (checked: boolean): TodoStatus => (checked ? "DONE" : "PENDING");

/**
 * 상태 바꾸기가 실패했을 때 목록을 다시 받아 보여 줄 문구. 그 밖의 실패(5xx 등)는 null — 부른 쪽이 일반 문구를 쓴다.
 * 409 TODO_ALREADY_DONE 은 한 명 수행을 다른 직원이 먼저 완료했거나, 완료된 한 명 수행 건을 다시 열려 한 경우다 —
 * 본인이 완료한 것이 아니면(다른 직원·관리자 완료) 다시 열 수 없다.
 */
export function knownStatusError(status: number, body: unknown): string | null {
  if (status === 409) {
    if ((body as { code?: unknown } | null)?.code === "TODO_ALREADY_DONE") return "이미 완료된 TO-DO 입니다";
    return "그사이 상태가 바뀌어 지금 상태를 다시 불러왔습니다";
  }
  if (status === 404) return "배정이 풀렸거나 지워진 TO-DO 입니다";
  return null;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS = "일월화수목금토";
const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD → 「10월 19일(월)」. 달력 날짜라 시간대와 상관없이 UTC 로 요일을 센다. */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일(${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`;
}

/** ISO 시각 → 한국 시각 「10월 19일(월) 16:40」. 한국은 서머타임이 없어 9시간만 민다. */
export function kstLabel(iso: string): string {
  const k = new Date(Date.parse(iso) + KST_OFFSET_MS);
  return `${dayLabel(`${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`)} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}

/** 수행 예정 일시. 시간이 없으면 날짜만. */
export const dueLabel = (item: Pick<MyTodo, "dueDate" | "dueTime">) =>
  item.dueTime ? `${dayLabel(item.dueDate)} ${item.dueTime}` : dayLabel(item.dueDate);

/** 기한 지남 — 미완료이고 수행 예정 시각(날짜만이면 그날 끝, 한국 시각)이 지났다. */
export function isOverdue(item: Pick<MyTodo, "status" | "dueDate" | "dueTime">, now: Date): boolean {
  if (item.status === "DONE") return false;
  const due = item.dueTime
    ? Date.parse(`${item.dueDate}T${item.dueTime}:00+09:00`)
    : Date.parse(`${item.dueDate}T00:00:00+09:00`) + 24 * 60 * 60 * 1000;
  return now.getTime() >= due;
}

/** 한 명 수행 완료 줄 — 먼저 완료한 직원과 시각(WORK-3). 한 명 수행 완료가 아니면 null. */
export function performerLine(item: Pick<MyTodo, "status" | "performer" | "completedAt">): string | null {
  if (item.status !== "DONE" || !item.performer) return null;
  const at = item.completedAt ? ` · ${kstLabel(item.completedAt)}` : "";
  // 직원 근무 앱 응답은 가리지 않는다(isMasked 늘 false). 이름이 비면 「다른 직원」으로 둔다.
  return `${item.performer.staffMemberName ? `${item.performer.staffMemberName}님이` : "다른 직원이"} 완료${at}`;
}

/** 목록 한 줄의 아래 글자(목업 07.근무 정보_list). */
export function todoMeta(item: MyTodo, now: Date): string {
  const performer = performerLine(item);
  if (performer) return performer;
  if (item.status === "DONE") return item.completedAt ? `${kstLabel(item.completedAt)} 완료` : dueLabel(item);
  if (isOverdue(item, now)) return `${dayLabel(item.dueDate)} · 기한 지남`;
  return item.dueTime ? dueLabel(item) : `${dayLabel(item.dueDate)} · 시간 미정`;
}
