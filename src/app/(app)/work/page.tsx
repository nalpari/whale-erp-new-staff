import type { Metadata } from "next";
import { Alert, BottomNav, Notice, PageHeader } from "@/components/common";
import { getCurrentMembership } from "@/lib/current-membership";
import { getMyTodos } from "@/lib/my-todos";
import { getMyWorkSchedules } from "@/lib/my-work-schedules";
import { requireSession } from "@/lib/session";
import { kstDate, parseMonth } from "@/lib/work-schedules";
import { NotificationBell } from "../notification-bell";
import { SchedulePanel } from "./schedule-panel";
import { StoreCard } from "./store-card";
import { TodoPanel } from "./todo-panel";
import { WorkTabs, type WorkTab } from "./work-tabs";

export const metadata: Metadata = { title: "근무정보 · Whale ERP" };

// ponytail: 한 번에 api 최대치(200)만 받는다. 근무지 칩 · 개수는 받은 것으로 센다 — 넘는 직원이 생기면 상태별로 나눠 받는다.
const TODO_QUERY = "pageSize=200";

// 하단 메뉴 「근무」(목업 work.html). 두 탭 위의 근무지 카드가 앱 전역 근무지를 고르고(WORK-4), 두 탭이 그 근무지를 따른다.
export default async function WorkPage({ searchParams }: PageProps<"/work">) {
  await requireSession();
  const params = await searchParams;
  const tab: WorkTab = params.tab === "todo" ? "todo" : "schedule";
  const today = kstDate(new Date());
  const month = parseMonth(typeof params.month === "string" ? params.month : undefined, today);
  // 알림에서 들어오면 그날을 먼저 고른다(?day=, 그 달의 날짜일 때만)
  const day = typeof params.day === "string" && params.day.startsWith(`${month}-`) && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : undefined;
  const memberships = await getCurrentMembership();
  const current = memberships?.current;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="근무정보" backHref="/home" action={<NotificationBell />} />
      <div className="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px] leading-[1.5]">
        {!memberships ? (
          <Alert tone="warning">근무지를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>
        ) : !current ? (
          <div className="flex flex-col items-center gap-[6px] py-[40px] text-center">
            <p className="text-[18px] font-bold">근무지가 없습니다</p>
            <p className="max-w-[300px] text-[14px] text-staff-text-sub">
              연결된 근무지가 없어 스케줄과 TO-DO 를 보여 줄 수 없습니다. 받은 급여명세서는 급여 탭에서 계속 볼 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            <StoreCard
              stores={memberships.items.map((m) => ({ staffMemberId: m.staffMemberId, storeName: m.store.storeName }))}
              currentId={current.staffMemberId}
            />
            <WorkTabs tab={tab}>
              {tab === "schedule" ? (
                <ScheduleTab staffMemberId={current.staffMemberId} storeName={current.store.storeName} month={month} today={today} day={day} />
              ) : (
                <TodoTab storeId={current.store.storeId} />
              )}
            </WorkTabs>
          </>
        )}
      </div>
      {/* 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다. */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/work" />
      </div>
    </div>
  );
}

async function ScheduleTab({
  staffMemberId,
  storeName,
  month,
  today,
  day,
}: {
  staffMemberId: number;
  storeName: string;
  month: string;
  today: string;
  day?: string;
}) {
  const schedules = await getMyWorkSchedules(staffMemberId, month);
  if (!schedules) return <Alert tone="warning">근무스케줄을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>;
  // 근무지 · 달이 바뀌면 고른 날을 다시 정한다.
  return <SchedulePanel key={`${staffMemberId}:${month}:${day ?? ""}`} month={month} today={today} day={day} items={schedules.items} storeName={storeName} />;
}

// 고른 근무지의 TO-DO 만 — 근무지가 하나로 걸러지므로 TO-DO 패널의 근무지 칩은 나오지 않는다.
async function TodoTab({ storeId }: { storeId: number }) {
  const todos = await getMyTodos(TODO_QUERY);
  if (!todos) return <Alert tone="warning">TO-DO 를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</Alert>;
  const items = todos.items.filter((t) => t.storeId === storeId);
  // 기한 지남 판정의 기준 시각을 서버에서 정해 넘긴다 — 서버와 브라우저가 같은 글자를 그린다.
  return (
    <>
      {todos.total > todos.items.length && (
        <Notice>TO-DO 가 많아 앞의 {todos.items.length}건만 보입니다. 개수도 보이는 것만 셉니다.</Notice>
      )}
      <TodoPanel todos={items} now={new Date().toISOString()} />
    </>
  );
}
