import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// Figma 04.출퇴근 머리줄(node 12:916): 흰 바탕 · 최소 높이 72 · 좌우 22 위아래 14 · 사이 20.
// 왼쪽 뒤로 가기(24px 칸에 19px 화살표) · 제목 18px bold · 오른쪽 끝에 아이콘 버튼 하나(action).
// 아이콘은 Figma 가 뒤집어 내보내 -scale-y-100 으로 세운다.
export function PageHeader({ title, backHref, action }: { title: string; backHref: string; action?: ReactNode }) {
  return (
    <header className="flex min-h-[72px] w-full items-center gap-[20px] bg-white px-[22px] py-[14px]">
      <Link href={backHref} aria-label="뒤로" className="flex size-[24px] shrink-0 items-center justify-center">
        <Image src="/icons/back.svg" alt="" width={19} height={19} className="-scale-y-100" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-[18px] leading-[1.5] font-bold">{title}</h1>
      {action}
    </header>
  );
}
