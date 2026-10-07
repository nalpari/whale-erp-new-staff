"use client";

import { useState } from "react";
import { StatusChip, TodoItem, TodoList } from "@/components/common";

type Status = "waiting" | "progress" | "done";
type Todo = { id: string; title: string; meta: string; status: Status; overdue?: boolean; urgent?: boolean; shared?: boolean };

// 목업 데이터(Figma 07.근무 정보_list). 체크하면 완료, 풀면 원래 상태로 돌아간다.
const TODOS: Todo[] = [
  { id: "clean", title: "마감 청소 사진 촬영", meta: "9월 9일(수) · 기한 지남", status: "waiting", overdue: true },
  { id: "fridge", title: "냉장고 온도 점검 및 사진 제출", meta: "9월 10일(목) 14:00", status: "waiting", urgent: true },
  { id: "menu", title: "신메뉴 시식 후 피드백 작성", meta: "9월 10일(목) · 시간 미정", status: "progress" },
  { id: "stock", title: "매장 재고 실사 보조", meta: "9월 11일(금) 10:00", status: "waiting", shared: true },
  { id: "pop", title: "여름 시즌 POP 철거", meta: "9월 8일(화) 16:40 완료", status: "done" },
];

const STATUS = {
  waiting: { label: "대기", tone: "neutral" },
  progress: { label: "진행 중", tone: "progress" },
  done: { label: "완료", tone: "success" },
} as const;

// TO-DO 탭(node 17:602~). 위에 상태별 개수(12px, 숫자만 bold·상태 색), 아래 목록.
// 개수 색 #13785E(완료)·#315DF5(진행 중)는 이 줄에만 나와 토큰으로 두지 않는다.
export function TodoPanel() {
  const [done, setDone] = useState<Record<string, boolean>>(() => Object.fromEntries(TODOS.map((t) => [t.id, t.status === "done"])));
  const statusOf = (t: Todo): Status => (done[t.id] ? "done" : t.status === "done" ? "waiting" : t.status);
  const count = (s: Status) => TODOS.filter((t) => statusOf(t) === s).length;

  return (
    <div className="flex flex-col gap-[20px]">
      <p className="flex gap-[14px] text-[12px] leading-[1.5] text-staff-text-muted">
        <span>
          완료 <b className="text-[#13785e]">{count("done")}</b>
        </span>
        <span>
          진행 중 <b className="text-[#315df5]">{count("progress")}</b>
        </span>
        <span>
          대기 <b className="text-staff-text">{count("waiting")}</b>
        </span>
      </p>
      <TodoList>
        {TODOS.map((t) => {
          const s = statusOf(t);
          return (
            <TodoItem
              key={t.id}
              title={t.title}
              meta={t.meta}
              done={s === "done"}
              overdue={t.overdue && s !== "done"}
              onToggle={(v) => setDone((d) => ({ ...d, [t.id]: v }))}
              badges={
                <>
                  {t.urgent && s !== "done" && (
                    <StatusChip tone="warning" weight="semibold">
                      긴급
                    </StatusChip>
                  )}
                  {t.shared && (
                    <StatusChip tone="neutral" weight="semibold">
                      공유
                    </StatusChip>
                  )}
                  <StatusChip tone={STATUS[s].tone} weight="semibold">
                    {STATUS[s].label}
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
