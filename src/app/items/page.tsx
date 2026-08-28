import { redirect } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { ApiError, getSession, listItems, type Item } from "@/lib/api";

export default async function ItemsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let items: Item[];
  try {
    items = await listItems();
  } catch (error) {
    // 액세스 토큰이 15분을 넘겨 만료되면 401 이다. 다시 로그인시킨다.
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-seam">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.36em] text-plate">
          Whale ERP
        </span>
        <form action={logoutAction} className="flex items-center gap-5">
          <span className="font-sans text-sm text-plate-dim">
            {session.user.name}
          </span>
          <button
            type="submit"
            className="h-11 px-3 font-sans text-sm text-plate-dim transition-colors hover:text-plate"
          >
            로그아웃
          </button>
        </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="flex items-baseline gap-6">
          <h1 className="font-sans text-base text-plate-dim">품목</h1>
          <span className="lit font-mono text-4xl font-medium tabular-nums">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="mt-16 max-w-md border-t border-seam pt-8 font-sans leading-relaxed text-plate-dim">
            등록된 품목이 없습니다. 품목이 등록되면 이 자리에 재고와 함께
            표시됩니다.
          </p>
        ) : (
          <ul className="mt-10">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-t border-seam py-7 sm:grid-cols-[14rem_1fr_4rem_auto]"
              >
                <span className="font-mono text-[0.82rem] tracking-[0.08em] text-plate-dim sm:text-sm sm:text-plate">
                  {item.sku}
                </span>
                <span className="order-last col-span-2 font-sans text-lg leading-tight text-plate sm:order-none sm:col-span-1 sm:text-xl">
                  {item.name}
                  {/* 단위는 좁은 화면에서도 빠지면 안 되는 값이라 품목명 옆에 붙인다. */}
                  <span className="ml-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-plate-dim sm:hidden">
                    {item.unit}
                  </span>
                </span>
                <span className="hidden font-mono text-[0.72rem] uppercase tracking-[0.2em] text-plate-dim sm:block">
                  {item.unit}
                </span>
                <span
                  className={`row-span-2 self-center text-right font-mono text-5xl font-medium tabular-nums sm:row-span-1 sm:text-6xl ${
                    item.stock > 0 ? "lit" : "text-plate-dim"
                  }`}
                  // 목록이 뜨면 위에서부터 순서대로 켜진다.
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {item.stock}
                </span>
              </li>
            ))}
            <li className="border-t border-seam" />
          </ul>
        )}

        <p className="mt-10 max-w-md font-sans text-[0.82rem] leading-relaxed text-plate-dim">
          재고 0 은 소등으로 표시합니다. 그 밖의 재고 기준은 API 가 주지 않아
          화면에서 판단하지 않습니다.
        </p>
      </main>
    </div>
  );
}
