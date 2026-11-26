"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, BottomSheet, Notice, SHEET_CLOSE_MS, SegmentedControl, StatusChip, Toast, TodoItem, TodoList } from "@/components/common";
import {
  TODO_STATUS,
  TODO_STATUSES,
  countByStatus,
  dueLabel,
  isDoneByOther,
  isOverdue,
  performerLine,
  storesOf,
  todoMeta,
  toggledStatus,
  type MyTodo,
  type TodoStatus,
} from "@/lib/todos";
import { changeTodoStatusAction } from "./actions";

/** 상태를 바꾼 뒤 띄우는 알림(조사까지 맞춘 문장). */
const CHANGED_TEXT: Record<TodoStatus, string> = {
  PENDING: "TO-DO 를 대기로 바꿨습니다",
  IN_PROGRESS: "TO-DO 를 진행 중으로 바꿨습니다",
  DONE: "TO-DO 를 완료했습니다",
};

/**
 * 상태 바꾸기 — 보내는 동안은 다시 누르지 못하게 하고, 실패 문구를 들고 있는다. 목록은 액션의 refresh 로 다시 온다.
 * 액션 호출 자체가 던지면(휴대전화가 서버에 닿지 못함 · 배포로 액션이 바뀜 「Failed to find Server Action」) 화면 전체를
 * error.tsx 로 보내지 않고 문구만 보인다. 401 의 만료 안내 redirect 같은 Next 내부 오류는 다시 던진다.
 */
function useStatusChange() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  // 바꾸기에 성공했을 때 띄우는 짧은 알림(key 로 같은 문구도 다시 띄운다)
  const [done, setDone] = useState<{ key: number; text: string }>();
  /** [onDone] 은 성공했을 때만 부른다 — 상세 시트는 이때 닫는다(2026-11-26 실기기 피드백). 실패하면 시트를 둔 채 문구를 보인다. */
  const change = (todoId: number, status: TodoStatus, onDone?: () => void) =>
    startTransition(async () => {
      setError(undefined);
      let failed: string | undefined;
      try {
        failed = (await changeTodoStatusAction(todoId, status)).error;
      } catch (thrown) {
        unstable_rethrow(thrown);
        console.error("[todo-status] 액션 호출 실패", thrown);
        setError("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
        return;
      }
      // 성공한 뒤의 처리는 위 catch 밖에 둔다 — 여기서 난 오류를 연결 실패로 잘못 보이지 않게.
      setError(failed);
      if (failed) return;
      const text = CHANGED_TEXT[status];
      if (!onDone) return setDone({ key: Date.now(), text });
      // 상세 시트에서 바꿨으면 시트가 다 내려가 close() 된 뒤에 알린다 — 모달이 열려 있는 동안은 바깥(알림)이
      // 접근성 트리에서 빠져 화면 낭독기가 안내를 놓칠 수 있다.
      onDone();
      setTimeout(() => setDone({ key: Date.now(), text }), SHEET_CLOSE_MS + 50);
    });
  return { pending, error, done, change, clearError: () => setError(undefined) };
}

type StatusChange = ReturnType<typeof useStatusChange>;

/**
 * TO-DO 줄 목록(목업 07.근무 정보_list). api 순서(미완료 긴급 → 미완료 나머지 → 완료) 그대로 쌓는다.
 * 체크하면 완료, 풀면 대기. onOpen 을 주면 줄을 눌러 상세를 연다.
 */
function TodoRows({
  todos,
  now,
  status,
  staffMemberId,
  onOpen,
  checkOpens = false,
}: {
  todos: MyTodo[];
  now: string;
  status: StatusChange;
  staffMemberId?: number;
  onOpen?: (todoId: number) => void;
  /** 체크칸을 눌러도 바로 바꾸지 않고 상세 시트를 연다(홈 카드) */
  checkOpens?: boolean;
}) {
  const at = new Date(now);
  return (
    <TodoList>
      {todos.map((t) => (
        <TodoItem
          key={t.todoId}
          title={t.title}
          meta={todoMeta(t, at)}
          done={t.status === "DONE"}
          overdue={isOverdue(t, at)}
          onToggle={
            status.pending ? undefined : checkOpens && onOpen ? () => onOpen(t.todoId) : (checked) => status.change(t.todoId, toggledStatus(checked))
          }
          onOpen={onOpen && (() => onOpen(t.todoId))}
          badges={
            <>
              <KindChips todo={t} />
              <StateChip todo={t} staffMemberId={staffMemberId} />
            </>
          }
        />
      ))}
    </TodoList>
  );
}

const EMPTY_TEXT: Record<TodoStatus | "ALL", string> = {
  ALL: "배정된 TO-DO 가 없습니다",
  PENDING: "대기 중인 TO-DO 가 없습니다",
  IN_PROGRESS: "진행 중인 TO-DO 가 없습니다",
  DONE: "완료한 TO-DO 가 없습니다",
};

const STATUS_CHIPS: readonly [TodoStatus | "ALL", string][] = [
  ["ALL", "전체"],
  ["PENDING", "대기"],
  ["IN_PROGRESS", "진행 중"],
  ["DONE", "완료"],
];

/**
 * 홈 TO-DO 카드(#316)의 목록. 줄이나 체크칸을 누르면 근무 탭과 같은 상세 시트를 열고 거기서 상태를 바꾼다 — 체크 한 번에 바로 완료돼
 * 목록에서 사라지면 잘못 눌렀을 때 당황스러웠다(2026-11-23 사용자 지정, 전엔 체크로 완료만 하고 상세는 열지 않았다).
 * 빈 목록 안내도 여기서 그린다 — 마지막 건이 404 로 사라져도 이 컴포넌트가 그대로 남아 실패 문구가 보인다.
 */
export function TodoChecklist({ todos, now, staffMemberId }: { todos: MyTodo[]; now: string; staffMemberId?: number }) {
  const status = useStatusChange();
  // 시트 상태는 근무 탭(TodoPanel)과 같다 — 완료로 바꿔 목록에서 사라지면 들고 있던 값을 그린 채 닫는다.
  const [picked, setPicked] = useState<MyTodo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const current = picked && todos.find((t) => t.todoId === picked.todoId);
  const open = sheetOpen && Boolean(current);
  const handleOpen = (todoId: number) => {
    // 상태를 보내는 동안은 다른 상세를 열지 않는다 — 앞 요청이 성공하며 새로 연 시트를 닫지 않게.
    if (status.pending) return;
    status.clearError();
    setPicked(todos.find((t) => t.todoId === todoId) ?? null);
    setSheetOpen(true);
  };
  return (
    <>
      {status.error && (
        <div className="pt-[14px]">
          <Alert tone="warning">{status.error}</Alert>
        </div>
      )}
      {todos.length === 0 ? (
        <p className="py-[14px] text-[13px] text-staff-text-sub">남은 TO-DO 가 없습니다</p>
      ) : (
        <TodoRows todos={todos} now={now} status={status} staffMemberId={staffMemberId} onOpen={handleOpen} checkOpens />
      )}
      {picked && (
        <TodoSheet
          open={open}
          todo={current ?? picked}
          status={status}
          staffMemberId={staffMemberId ?? 0}
          showStore={false}
          onClose={() => setSheetOpen(false)}
        />
      )}
      {status.done && <Toast key={status.done.key}>{status.done.text}</Toast>}
    </>
  );
}

/** 긴급(미완료일 때) · 공유 칩 */
function KindChips({ todo }: { todo: MyTodo }) {
  return (
    <>
      {todo.isUrgent && todo.status !== "DONE" && (
        <StatusChip tone="warning" weight="semibold">
          긴급
        </StatusChip>
      )}
      {todo.executionMode === "ANY_ONE" && (
        <StatusChip tone="neutral" weight="semibold">
          공유
        </StatusChip>
      )}
    </>
  );
}

/** 상태 칩 — 다른 직원이 먼저 끝낸 공유 TO-DO 는 「완료됨」(데모 work) */
function StateChip({ todo, staffMemberId }: { todo: MyTodo; staffMemberId?: number }) {
  return (
    <StatusChip tone={TODO_STATUS[todo.status].tone} weight="semibold">
      {isDoneByOther(todo, staffMemberId) ? "완료됨" : TODO_STATUS[todo.status].label}
    </StatusChip>
  );
}

const ALL = "all";

// TO-DO 탭(목업 node 17:602~). 위에 상태별 개수(12px, 숫자만 bold·상태 색), 아래 목록, 줄을 누르면 상세 시트.
// 개수 색 #13785E(완료)·#315DF5(진행 중)는 이 줄에만 나와 토큰으로 두지 않는다(목업과 같다).
// 근무지가 둘 이상이면 위에 근무지 칩을 둔다. 근무 탭은 앱 전역 근무지(WORK-4)로 걸러 넘기므로 칩이 나오지 않는다.
export function TodoPanel({
  todos,
  now,
  staffMemberId,
}: {
  todos: MyTodo[];
  now: string;
  /** 지금 근무지의 내 직원 id — 다른 직원이 먼저 끝낸 공유 TO-DO(「완료됨」)를 가른다 */
  staffMemberId: number;
}) {
  const [store, setStore] = useState(ALL);
  // 시트는 늘 마운트해 두고 open 만 바꾼다(닫힘 애니메이션 · 초점 되돌리기는 <dialog> 가 맡는다).
  // 고른 TO-DO 는 통째로 들고 있다가, 다시 받은 목록에 있으면 그 값을, 사라졌으면(404) 들고 있던 값을 그린 채 닫는다.
  const [picked, setPicked] = useState<MyTodo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // 목록과 시트가 한 상태를 같이 쓴다 — 문구는 시트가 열려 있으면 시트에, 닫혔으면(404 로 사라짐 포함) 목록 위에 보인다.
  const status = useStatusChange();
  const stores = storesOf(todos);
  // 고른 근무지의 TO-DO 가 모두 사라졌으면(배정 해제 등) 칩이 없어지므로 전체로 본다.
  const storeId = stores.some((s) => String(s.storeId) === store) ? Number(store) : null;
  const shown = storeId === null ? todos : todos.filter((t) => t.storeId === storeId);
  const counts = countByStatus(shown);
  // 상태 칩 — 내 근무지 상태 칩과 같은 모양 · 동작(2026-11-23 사용자 지정). 0건도 보이고 누르면 그 상태만 거른다.
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "ALL">("ALL");
  const listed = statusFilter === "ALL" ? shown : shown.filter((t) => t.status === statusFilter);
  const current = picked && todos.find((t) => t.todoId === picked.todoId);
  const open = sheetOpen && Boolean(current);
  const handleOpen = (todoId: number) => {
    // 상태를 보내는 동안은 다른 상세를 열지 않는다 — 앞 요청이 성공하며 새로 연 시트를 닫지 않게.
    if (status.pending) return;
    // 시트를 열 때마다 실패 문구를 비운다(목록 · 시트가 한 상태를 쓴다) — 시트 안의 실패는 시트가 열려 있는 동안만 보인다.
    status.clearError();
    setPicked(todos.find((t) => t.todoId === todoId) ?? null);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col gap-[12px]">
      {stores.length > 1 && (
        <SegmentedControl
          label="근무지"
          value={storeId === null ? ALL : store}
          onChange={setStore}
          items={[{ value: ALL, label: "전체" }, ...stores.map((s) => ({ value: String(s.storeId), label: s.storeName }))]}
        />
      )}
      <div role="group" aria-label="TO-DO 상태" className="flex flex-wrap gap-[8px]">
        {STATUS_CHIPS.map(([key, label]) => {
          const on = key === statusFilter;
          const n = key === "ALL" ? shown.length : counts[key];
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => setStatusFilter(key)}
              className={`flex h-[36px] items-center gap-[4px] rounded-full border px-[14px] text-[13px] font-semibold ${
                on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text-sub"
              }`}
            >
              {label} <span className="tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>
      {status.error && !open && <Alert tone="warning">{status.error}</Alert>}
      {/* 목록은 흰 상자 안에, 상자는 화면 남는 높이를 채운다 — 회색 바탕에 줄만 있거나 비었을 때 아래가 휑했다(2026-11-23 사용자 지정) */}
      <section className="flex flex-1 flex-col rounded-[20px] border border-staff-border-light bg-white px-[20px]">
        {listed.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-[40px] text-center text-[14px] leading-[1.5] text-staff-text-sub">
            {EMPTY_TEXT[statusFilter]}
          </p>
        ) : (
          <TodoRows todos={listed} now={now} status={status} staffMemberId={staffMemberId} onOpen={handleOpen} checkOpens />
        )}
      </section>
      {picked && (
        <TodoSheet
          open={open}
          todo={current ?? picked}
          status={status}
          staffMemberId={staffMemberId}
          showStore={stores.length > 1}
          onClose={() => setSheetOpen(false)}
        />
      )}
      {status.done && <Toast key={status.done.key}>{status.done.text}</Toast>}
    </div>
  );
}

// 근무 탭 · 홈 모두 줄 · 체크칸 어디를 눌러도 이 시트를 열고 거기서 상태를 바꾼다 — 체크 한 번에 바로 완료되지 않는다(2026-11-23 사용자 지정).
// 상세(바텀시트, 데모 work 의 긴급 TO-DO 상세 · 공유 TO-DO 안내): 제목 · 내용 · 수행 예정 · 근무지 · 상태, 상태 바꾸기(대기 · 진행 중 · 완료).
// 등록 · 삭제는 없다.
// 공유 TO-DO 는 먼저 완료한 직원과 시각(WORK-3)과 수행자 안내를 보이고, 닫기 버튼은 「확인」이다.
function TodoSheet({
  open,
  todo,
  status,
  staffMemberId,
  showStore,
  onClose,
}: {
  open: boolean;
  todo: MyTodo;
  status: StatusChange;
  staffMemberId: number;
  showStore: boolean;
  onClose: () => void;
}) {
  const { pending, error, change } = status;
  const performer = performerLine(todo);
  const shared = todo.executionMode === "ANY_ONE";
  const kind = (todo.isUrgent && todo.status !== "DONE") || shared;
  const doneByOther = isDoneByOther(todo, staffMemberId);
  return (
    // 정돈(2026-11-23 사용자 지정): 긴급 · 공유는 제목 앞 배지, 수행 예정 · 근무지는 둥근 정보 상자, 상태는 「상태 변경」 한 줄 3칸.
    // 상태 배지 줄은 3칸과 같은 말을 되풀이해 뺐다 — 다른 직원이 먼저 끝낸 공유 TO-DO 의 「완료됨」만 정보 상자에 남긴다.
    <BottomSheet
      open={open}
      onClose={onClose}
      title={todo.title}
      heading={
        kind ? (
          <span className="flex flex-wrap items-center gap-[6px]">
            <KindChips todo={todo} />
            <span>{todo.title}</span>
          </span>
        ) : undefined
      }
      description={todo.body ?? undefined}
      closeLabel={shared ? "확인" : undefined}
    >
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-[16px] gap-y-[6px] rounded-[12px] border border-staff-border-light px-[16px] py-[12px] text-[14px] leading-[1.5]">
        <dt className="text-staff-text-sub">수행 예정</dt>
        <dd>{dueLabel(todo)}</dd>
        {showStore && (
          <>
            <dt className="text-staff-text-sub">근무지</dt>
            <dd>{todo.storeName ?? "이름 없는 근무지"}</dd>
          </>
        )}
        {doneByOther && (
          <>
            <dt className="text-staff-text-sub">상태</dt>
            <dd className="flex">
              <StateChip todo={todo} staffMemberId={staffMemberId} />
            </dd>
          </>
        )}
      </dl>
      {performer && <p className="text-[13px] leading-[1.5] text-staff-text-sub">{performer}</p>}
      {shared && <Notice>먼저 완료 처리한 사람이 수행자로 기록됩니다.</Notice>}
      {error && <Alert tone="warning">{error}</Alert>}
      {/* 상태 바꾸기는 세 가지 그대로 둔다 — 직원이 진행 중을 고를 곳이 여기뿐이다 */}
      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] font-semibold">상태 변경</p>
        <div role="group" aria-label="상태 변경" className="grid grid-cols-3 gap-[8px]">
          {TODO_STATUSES.map((s) => {
            const on = todo.status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                disabled={pending}
                // 지금 상태를 다시 누르면 바꿀 것이 없어 시트만 닫는다. 다른 상태는 바꾼 뒤(성공했을 때만) 닫는다.
                onClick={() => (on ? onClose() : change(todo.todoId, s, onClose))}
                className={`flex min-h-[48px] items-center justify-center gap-[4px] rounded-[12px] border text-[14px] font-semibold disabled:opacity-60 ${
                  on ? "border-staff-primary bg-staff-primary-inactive text-staff-primary" : "border-staff-border bg-white text-staff-text"
                }`}
              >
                {TODO_STATUS[s].label}
                {on && <span aria-hidden>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
