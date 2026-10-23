import Image from "next/image";
import Link from "next/link";
import { SectionTitle } from "@/components/common";
import { getMyTodos } from "@/lib/my-todos";
import { TodoChecklist } from "../work/todo-panel";

// 홈에 보이는 미완료 TO-DO 수. api 순서라 긴급이 먼저 온다.
// 근무지는 api 에서 거른다 — 3건을 받은 뒤 화면에서 거르면 0건이 될 수 있다.
const homeTodoQuery = (storeId?: number) => `status=PENDING&status=IN_PROGRESS&pageSize=3${storeId ? `&storeId=${storeId}` : ""}`;

// 홈 TO-DO 카드(#316, 목업 02.Main 「오늘 할 일」 자리). 미완료 위 몇 건을 체크로 완료하고, 「전체 보기」는 근무 화면 TO-DO 탭(HOME-1).
// 홈 파일은 다른 작업(#311 · #313)이 채울 자리라 카드만 따로 두고 홈에는 한 줄로 끼운다. storeId 는 앱 전역 근무지(#314).
export async function TodoCard({ storeId }: { storeId?: number }) {
  const todos = await getMyTodos(homeTodoQuery(storeId));
  return (
    <section className="flex flex-col gap-[12px]">
      <SectionTitle title="TO-DO" count={todos?.total}>
        <Link href="/work?tab=todo" transitionTypes={["nav-forward"]} className="-my-[13px] flex min-h-[44px] items-center text-[12px] text-staff-text-sub">
          전체 보기
          <Image src="/icons/chevron-right-small.svg" alt="" width={11} height={11} className="-scale-y-100" />
        </Link>
      </SectionTitle>
      <div className="rounded-[18px] border border-staff-border-light bg-white px-[16px] leading-[1.5]">
        {!todos ? (
          <p className="py-[14px] text-[13px] text-staff-text-sub">TO-DO 를 불러오지 못했습니다</p>
        ) : (
          <TodoChecklist todos={todos.items} now={new Date().toISOString()} />
        )}
      </div>
    </section>
  );
}
