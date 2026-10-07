import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "디자인 샘플 · Whale ERP 직원",
  robots: { index: false },
};

export default function DesignLayout({ children }: LayoutProps<"/design">) {
  return <div className="min-h-[100dvh]">{children}</div>;
}
