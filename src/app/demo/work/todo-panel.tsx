"use client";

// TO-DO 탭. Figma 07.근무 정보_list(node 17:602~)의 개수 줄·목록 모양에 목업(docs/mockup/app/work.html)의 세 상태를 얹었다.
//   todo      — 5건(대기 3 · 진행 중 1 · 완료 1)
//   todo-done — 긴급 「냉장고 온도 점검」을 완료 처리한 직후
//   shared    — 근무지 전체 · 한 명 수행으로 배정된 「매장 재고 실사 보조」를 동료(정민준)가 먼저 완료(WORK-3 확정 · 이름 공개)
// 순서는 목업 근거(TO-DO 정렬 정책)대로 계산한다: 완료되지 않은 긴급 → 나머지 미완료 → 완료, 같은 무리 안은 수행 예정 일시 오름차순.
// 목업 shared 는 긴급 건을 둘째 줄에 그렸지만 정책에 맞춰 맨 위에 둔다.
// 체크칸: 긴급 건은 누르면 todo-done 으로 옮기고(목업 data-go), 나머지 미완료 건은 그 자리에서만 켜고 끈다(목업 data-tick).
// 완료된 건은 목업처럼 보기 전용이다.
import { useState, type ReactNode } from "react";
import { StatusChip, TodoList } from "@/components/common";
import { EASE_OUT } from "@/components/common/theme";
import { CheckBox } from "../_components";

export type TodoSheet = "fridge" | "sharedInfo";
type Status = "waiting" | "progress" | "done";
type Todo = {
  id: string;
  title: string;
  meta: string;
  status: Status;
  due: string; // 정렬용 수행 예정 일시. 시간이 없으면 날짜만.
  overdue?: boolean;
  urgent?: boolean;
  shared?: boolean; // 배정 대상 근무지 전체 · 수행 방식 한 명 수행
  doneByOther?: boolean;
  sheet?: TodoSheet;
};

const TODOS: Todo[] = [
  { id: "fridge", title: "냉장고 온도 점검 및 사진 제출", meta: "9월 10일(목) 14:00", status: "waiting", due: "09-10 14:00", urgent: true, sheet: "fridge" },
  { id: "clean", title: "마감 청소 사진 촬영", meta: "9월 9일(수) · 기한 지남", status: "waiting", due: "09-09", overdue: true },
  { id: "menu", title: "신메뉴 시식 후 피드백 작성", meta: "9월 10일(목) · 시간 미정", status: "progress", due: "09-10" },
  { id: "stock", title: "매장 재고 실사 보조", meta: "9월 11일(금) 10:00", status: "waiting", due: "09-11 10:00", shared: true, sheet: "sharedInfo" },
  { id: "pop", title: "여름 시즌 POP 철거", meta: "9월 8일(화) 16:40 완료", status: "done", due: "09-08 16:40" },
];

export type TodoState = "todo" | "todo-done" | "shared";

const todosOf = (state: TodoState) =>
  TODOS.map((t): Todo => {
    if (state === "todo-done" && t.id === "fridge") return { ...t, status: "done", meta: "9월 10일(목) 14:03 완료" };
    if (state === "shared" && t.id === "stock") return { ...t, status: "done", doneByOther: true, meta: "정민준이 9월 11일(금) 10:42에 완료했습니다" };
    return t;
  });

const rank = (t: Todo) => (t.status === "done" ? 2 : t.urgent ? 0 : 1);

const STATUS = {
  waiting: { label: "대기", tone: "neutral" },
  progress: { label: "진행 중", tone: "progress" },
  done: { label: "완료", tone: "success" },
} as const;

export function TodoPanel({
  state,
  onUrgentDone,
  onOpen,
}: {
  state: TodoState;
  onUrgentDone: () => void;
  onOpen: (sheet: TodoSheet) => void;
}) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const todos = todosOf(state)
    .map((t) => (ticked[t.id] ? { ...t, status: "done" as const } : t))
    .sort((a, b) => rank(a) - rank(b) || a.due.localeCompare(b.due));
  const count = (s: Status) => todos.filter((t) => t.status === s).length;

  return (
    <div className="flex flex-col gap-[20px]">
      {/* 개수 색 #13785E(완료)·#315DF5(진행 중)는 Figma 이 줄에만 나와 토큰으로 두지 않는다. 순서는 목업(대기·진행 중·완료). */}
      <p className="flex gap-[14px] text-[12px] text-staff-text-muted">
        <span>
          대기 <b className="text-staff-text">{count("waiting")}</b>
        </span>
        <span>
          진행 중 <b className="text-[#315df5]">{count("progress")}</b>
        </span>
        <span>
          완료 <b className="text-[#13785e]">{count("done")}</b>
        </span>
      </p>
      <TodoList>
        {todos.map((t) => {
          const done = t.status === "done";
          const fixed = done && !ticked[t.id];
          return (
            <TodoRow
              key={t.id}
              title={t.title}
              meta={t.meta}
              done={done}
              overdue={t.overdue && !done}
              onToggle={fixed ? undefined : t.urgent ? onUrgentDone : (v) => setTicked((m) => ({ ...m, [t.id]: v }))}
              onOpen={t.sheet && !t.doneByOther ? () => onOpen(t.sheet!) : undefined}
              badges={
                <>
                  {t.urgent && !done && (
                    <StatusChip tone="warning" weight="semibold">
                      긴급
                    </StatusChip>
                  )}
                  {t.shared && (
                    <StatusChip tone="neutral" weight="semibold">
                      공유
                    </StatusChip>
                  )}
                  <StatusChip tone={STATUS[t.status].tone} weight="semibold">
                    {t.doneByOther ? "완료됨" : STATUS[t.status].label}
                  </StatusChip>
                </>
              }
            />
          );
        })}
      </TodoList>
    </div>
  );
}

// 공통 TodoItem 과 같은 줄에, 제목을 누르면 상세 시트를 여는 onOpen 만 더했다(목업 row__main 버튼).
// 공통 TodoItem 에 onOpen 을 올리면 이 조각은 지운다.
function TodoRow({
  title,
  meta,
  done,
  overdue = false,
  onToggle,
  onOpen,
  badges,
}: {
  title: string;
  meta: string;
  done: boolean;
  overdue?: boolean;
  onToggle?: (done: boolean) => void;
  onOpen?: () => void;
  badges: ReactNode;
}) {
  const text = (
    <>
      <span className={`block truncate text-[15px] font-semibold ${done ? "text-staff-text-muted" : "text-staff-text"}`}>{title}</span>
      <span className={`block truncate pt-[2px] text-[12px] ${overdue ? "text-[#956013]" : "text-staff-text-sub"}`}>{meta}</span>
    </>
  );
  return (
    <li className="flex items-center gap-[12px] py-[17px] leading-[1.5]">
      <CheckBox checked={done} onChange={onToggle} label={`${title} 완료`} />
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className={`-my-[4px] flex min-h-[44px] min-w-0 flex-1 flex-col justify-center rounded-[10px] text-left transition-colors duration-150 ${EASE_OUT} active:bg-staff-primary-inactive`}
        >
          {text}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{text}</div>
      )}
      <div className="flex shrink-0 gap-[4px]">{badges}</div>
    </li>
  );
}
