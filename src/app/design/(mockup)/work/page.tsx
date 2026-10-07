import Image from "next/image";
import Link from "next/link";
import { BottomNav, PageHeader } from "@/components/common";
import { MOCKUP_NAV } from "../mockup-nav";
import { PageSlide } from "../page-slide";
import { WorkView } from "./work-view";

// Figma 06.근무 정보(node 15:183). 하단 메뉴 「근무」 칸 화면이다.
export default function MockupWorkPage() {
  return (
    <PageSlide>
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="근무정보"
          backHref="/design/home"
          action={
            <Link href="#" aria-label="근무지 정보" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
              <Image src="/icons/store-header.svg" alt="" width={21} height={21} className="-scale-y-100" />
            </Link>
          }
        />
        <WorkView />
        {/* 하단 메뉴는 앱의 탭 막대라 화면 아래에 붙여 둔다. */}
        <div className="sticky bottom-0 mt-auto">
          <BottomNav current="/design/work" items={MOCKUP_NAV} />
        </div>
      </div>
    </PageSlide>
  );
}
