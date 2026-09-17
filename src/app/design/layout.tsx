import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "디자인 샘플 · Whale ERP",
  robots: { index: false },
};

// 콘솔 전체는 다크 계근대 테마지만, 1차수정 Figma 는 밝은 ERP 화면이다.
// 샘플이 기존 화면을 건드리지 않도록 테마를 이 경로 안에서만 뒤집는다.
// Tailwind v4 는 버튼에 pointer 커서를 주지 않으므로, 누를 수 있는 요소를 여기서 한 번에 잡는다.
const CLICKABLE =
  "[&_:is(a[href],button:enabled,select:enabled,label:has(input:enabled),input[type=checkbox]:enabled)]:cursor-pointer [&_::-webkit-calendar-picker-indicator]:cursor-pointer";

export default function DesignLayout({ children }: LayoutProps<"/design">) {
  return (
    <div
      className={`min-h-[100dvh] bg-white font-erp leading-[normal] tracking-[-0.025em] text-erp-ink scheme-light selection:bg-erp-brand selection:text-white [&_*:focus-visible]:outline-erp-brand! ${CLICKABLE}`}
    >
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        precedence="default"
      />
      {children}
      <nav className="fixed right-4 bottom-4 z-10 flex gap-1 rounded-[4px] bg-erp-ink p-1 text-[13px] text-white shadow-lg">
        <Link href="/design" className="rounded-[2px] px-3 py-1.5 hover:bg-white/15">
          유닛
        </Link>
        <Link href="/design/full" className="rounded-[2px] px-3 py-1.5 hover:bg-white/15">
          전체 페이지
        </Link>
      </nav>
    </div>
  );
}
