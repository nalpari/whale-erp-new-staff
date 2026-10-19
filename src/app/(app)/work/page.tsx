import type { Metadata } from "next";
import { Alert, BottomNav, Notice, PageHeader } from "@/components/common";
import { getMyTodos } from "@/lib/my-todos";
import { requireSession } from "@/lib/session";
import { TodoPanel } from "./todo-panel";
import { WorkTabs, type WorkTab } from "./work-tabs";

export const metadata: Metadata = { title: "근무정보 · Whale ERP" };

// ponytail: 한 번에 api 최대치(200)만 받는다. 근무지 칩 · 개수는 받은 것으로 센다 — 넘는 직원이 생기면 상태별로 나눠 받는다.
const TODO_QUERY = "pageSize=200";

// 하단 메뉴 「근무」(목업 06·07 근무 정보). 근무스케줄 api 가 아직 없어 근무스케줄 탭은 안내만, 근무지 카드도 이번에는 두지 않는다.
export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  await requireSession();
  const tab: WorkTab = (await searchParams).tab === "todo" ? "todo" : "schedule";
  const todos = tab === "todo" ? await getMyTodos(TODO_QUERY) : null;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="근무정보" backHref="/home" />
      <div className="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
        <WorkTabs tab={tab}>
          {tab === "schedule" ? (
            <Notice>근무스케줄은 준비 중입니다</Notice>
          ) : todos ? (
            // 기한 지남 판정의 기준 시각을 서버에서 정해 넘긴다 — 서버와 브라우저가 같은 글자를 그린다.
            <>
              {todos.total > todos.items.length && (
                <Notice>
                  TO-DO 가 많아 앞의 {todos.items.length}건만 보입니다. 개수와 근무지도 보이는 것만 셉니다.
                </Notice>
              )}
              <TodoPanel todos={todos.items} now={new Date().toISOString()} />
            </>
          ) : (
            <Alert tone="warning">TO-DO 를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
          )}
        </WorkTabs>
      </div>
      {/* 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다. */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/work" />
      </div>
    </div>
  );
}
