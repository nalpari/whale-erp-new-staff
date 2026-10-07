import type { Metadata } from "next";
import { StaffRoot } from "@/components/common";

export const metadata: Metadata = {
  title: "디자인 가이드 · Whale ERP 직원",
  robots: { index: false },
};

export default function DesignLayout({ children }: LayoutProps<"/design">) {
  return <StaffRoot>{children}</StaffRoot>;
}
