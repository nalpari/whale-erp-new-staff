import Link from "next/link";
import { MaskIcon } from "./icon";

export type BottomNavItem = { href: string; label: string; icon: string };

// 직원앱 하단 메뉴 네 칸(Figma 순서). 경로는 화면이 생기면 실제 라우트에 맞춘다.
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/", label: "홈", icon: "/icons/nav-home.svg" },
  { href: "/work", label: "근무", icon: "/icons/nav-work.svg" },
  { href: "/notifications", label: "알림", icon: "/icons/nav-alarm.svg" },
  { href: "/me", label: "내 정보", icon: "/icons/nav-me.svg" },
];

// Figma BottomNav: 흰 바탕 · 위 1px #EFF2F6 · 칸마다 아이콘 20px + 글자 10px(사이 4, 위아래 12).
// 지금 화면 칸은 브랜드색·bold, 나머지는 흐린 글자·medium. 아이콘은 마스크로 글자색을 따른다.
export function BottomNav({ current, items = BOTTOM_NAV_ITEMS }: { current: string; items?: BottomNavItem[] }) {
  return (
    <nav aria-label="주 메뉴" className="flex w-full border-t border-staff-border-light bg-white pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const on = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-[4px] py-[12px] text-[10px] transition-colors duration-150 ease-out ${
              on ? "font-bold text-staff-primary" : "font-medium text-staff-text-muted"
            }`}
          >
            <MaskIcon src={item.icon} size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
