"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, BottomSheet, SegmentedControl, SheetOption, StatusChip, TodoItem, TodoList } from "@/components/common";
import {
  TODO_STATUS,
  TODO_STATUSES,
  countByStatus,
  dueLabel,
  isOverdue,
  performerLine,
  storesOf,
  todoMeta,
  toggledStatus,
  type MyTodo,
  type TodoStatus,
} from "@/lib/todos";
import { changeTodoStatusAction } from "./actions";

/**
 * 상태 바꾸기 — 보내는 동안은 다시 누르지 못하게 하고, 실패 문구를 들고 있는다. 목록은 액션의 refresh 로 다시 온다.
 * 액션 호출 자체가 던지면(휴대전화가 서버에 닿지 못함 · 배포로 액션이 바뀜 「Failed to find Server Action」) 화면 전체를
 * error.tsx 로 보내지 않고 문구만 보인다. 401 의 만료 안내 redirect 같은 Next 내부 오류는 다시 던진다.
 */
function useStatusChange() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const change = (todoId: number, status: TodoStatus) =>
    startTransition(async () => {
      setError(undefined);
      try {
        setError((await changeTodoStatusAction(todoId, status)).error);
      } catch (thrown) {
        unstable_rethrow(thrown);
        console.error("[todo-status] 액션 호출 실패", thrown);
        setError("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
      }
    });
  return { pending, error, change, clearError: () => setError(undefined) };
}

type StatusChange = ReturnType<typeof useStatusChange>;

/**
 * TO-DO 줄 목록(목업 07.근무 정보_list). api 순서(미완료 긴급 → 미완료 나머지 → 완료) 그대로 쌓는다.
 * 체크하면 완료, 풀면 대기. onOpen 을 주면 줄을 눌러 상세를 연다.
 */
function TodoRows({ todos, now, status, onOpen }: { todos: MyTodo[]; now: string; status: StatusChange; onOpen?: (todoId: number) => void }) {
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
          onToggle={status.pending ? undefined : (checked) => status.change(t.todoId, toggledStatus(checked))}
          onOpen={onOpen && (() => onOpen(t.todoId))}
          badges={<TodoBadges todo={t} />}
        />
      ))}
    </TodoList>
  );
}

/**
 * 홈 TO-DO 카드(#316)의 목록 — 체크로 완료만 하고 상세는 열지 않는다. 빈 목록 안내도 여기서 그린다 — 마지막 건이 404 로
 * 사라져도 이 컴포넌트가 그대로 남아 실패 문구가 보인다.
 */
export function TodoChecklist({ todos, now }: { todos: MyTodo[]; now: string }) {
  const status = useStatusChange();
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
        <TodoRows todos={todos} now={now} status={status} />
      )}
    </>
  );
}

function TodoBadges({ todo }: { todo: MyTodo }) {
  return (
    <>
      {todo.isUrgent && todo.status !== "DONE" && (
        <StatusChip tone="warning" weight="semibold">
          긴급
        </StatusChip>
      )}
      {todo.executionMode === "ANY_ONE" && (
        <StatusChip tone="neutral" weight="semibold">
          한 명 수행
        </StatusChip>
      )}
      <StatusChip tone={TODO_STATUS[todo.status].tone} weight="semibold">
        {TODO_STATUS[todo.status].label}
      </StatusChip>
    </>
  );
}

const ALL = "all";

// TO-DO 탭(목업 node 17:602~). 위에 상태별 개수(12px, 숫자만 bold·상태 색), 아래 목록, 줄을 누르면 상세 시트.
// 개수 색 #13785E(완료)·#315DF5(진행 중)는 이 줄에만 나와 토큰으로 두지 않는다(목업과 같다).
// 근무지가 둘 이상이면 위에 근무지 칩을 둔다. 근무 탭은 앱 전역 근무지(WORK-4)로 걸러 넘기므로 칩이 나오지 않는다.
export function TodoPanel({ todos, now }: { todos: MyTodo[]; now: string }) {
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
  const current = picked && todos.find((t) => t.todoId === picked.todoId);
  const open = sheetOpen && Boolean(current);
  const handleOpen = (todoId: number) => {
    // 시트를 열 때마다 실패 문구를 비운다(목록 · 시트가 한 상태를 쓴다) — 시트 안의 실패는 시트가 열려 있는 동안만 보인다.
    status.clearError();
    setPicked(todos.find((t) => t.todoId === todoId) ?? null);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-[20px]">
      {stores.length > 1 && (
        <SegmentedControl
          label="근무지"
          value={storeId === null ? ALL : store}
          onChange={setStore}
          items={[{ value: ALL, label: "전체" }, ...stores.map((s) => ({ value: String(s.storeId), label: s.storeName }))]}
        />
      )}
      <p className="flex gap-[14px] text-[12px] leading-[1.5] text-staff-text-muted">
        <span>
          완료 <b className="text-[#13785e]">{counts.DONE}</b>
        </span>
        <span>
          진행 중 <b className="text-[#315df5]">{counts.IN_PROGRESS}</b>
        </span>
        <span>
          대기 <b className="text-staff-text">{counts.PENDING}</b>
        </span>
      </p>
      {status.error && !open && <Alert tone="warning">{status.error}</Alert>}
      {shown.length === 0 ? (
        <p className="py-[40px] text-center text-[14px] leading-[1.5] text-staff-text-sub">배정된 TO-DO 가 없습니다</p>
      ) : (
        <TodoRows todos={shown} now={now} status={status} onOpen={handleOpen} />
      )}
      {picked && (
        <TodoSheet open={open} todo={current ?? picked} status={status} showStore={stores.length > 1} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  );
}

// 상세(바텀시트): 제목 · 내용 · 수행 예정 일시 · 근무지, 상태 바꾸기(대기 · 진행 중 · 완료). 등록 · 삭제는 없다.
// 한 명 수행 완료면 먼저 완료한 직원과 시각을 보인다(WORK-3).
function TodoSheet({
  open,
  todo,
  status,
  showStore,
  onClose,
}: {
  open: boolean;
  todo: MyTodo;
  status: StatusChange;
  showStore: boolean;
  onClose: () => void;
}) {
  const { pending, error, change } = status;
  const performer = performerLine(todo);
  return (
    <BottomSheet open={open} onClose={onClose} title={todo.title} description={todo.body ?? undefined}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-[16px] gap-y-[6px] text-[14px] leading-[1.5]">
        <dt className="text-staff-text-sub">수행 예정 일시</dt>
        <dd>{dueLabel(todo)}</dd>
        {showStore && (
          <>
            <dt className="text-staff-text-sub">근무지</dt>
            <dd>{todo.storeName ?? "이름 없는 근무지"}</dd>
          </>
        )}
      </dl>
      <div className="flex gap-[4px]">
        <TodoBadges todo={todo} />
      </div>
      {performer && <p className="text-[13px] leading-[1.5] text-staff-text-sub">{performer}</p>}
      {error && <Alert tone="warning">{error}</Alert>}
      <div role="group" aria-label="상태 바꾸기" className="flex flex-col gap-[8px]">
        {TODO_STATUSES.map((s) => (
          <SheetOption key={s} selected={todo.status === s} disabled={pending} onClick={() => change(todo.todoId, s)}>
            {TODO_STATUS[s].label}
          </SheetOption>
        ))}
      </div>
    </BottomSheet>
  );
}
