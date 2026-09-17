import type { Metadata } from "next";
import Link from "next/link";
import { Plate } from "./units";

export const metadata: Metadata = {
  title: "디자인 샘플 · Whale ERP",
  robots: { index: false },
};

export default function DesignLayout({ children }: LayoutProps<"/design">) {
  return (
    <div className="min-h-[100dvh]">
      <header className="border-b border-seam">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4 sm:px-10">
          <Plate>Design</Plate>
          <Link href="/design" className="font-sans text-sm text-plate-dim hover:text-plate">
            유닛
          </Link>
          <Link href="/design/full" className="font-sans text-sm text-plate-dim hover:text-plate">
            전체 페이지
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
