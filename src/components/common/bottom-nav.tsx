import Link from "next/link";
import { MaskIcon } from "./icon";

// activeIcon: 지금 칸일 때 바꿔 끼우는 아이콘(Figma 는 홈·근무만 채운 모양이 따로 있다). 없으면 icon 을 남보라로 칠한다.
export type BottomNavItem = { href: string; label: string; icon: string; activeIcon?: string };

// 직원앱 하단 메뉴 다섯 칸. Figma 는 네 칸(홈·근무·급여·내 정보)이지만 2026-10-08 재영 결정으로 목업처럼 출퇴근을 더했다.
// 출퇴근 아이콘은 Figma 에 없어 DESIGN.md 규칙(23px · 선 1.45)으로 그렸다. 경로는 화면이 생기면 실제 라우트에 맞춘다.
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/", label: "홈", icon: "/icons/nav-home.svg", activeIcon: "/icons/nav-home-on.svg" },
  { href: "/work", label: "근무", icon: "/icons/nav-work.svg", activeIcon: "/icons/nav-work-on.svg" },
  { href: "/check-in", label: "출퇴근", icon: "/icons/nav-attendance.svg" },
  { href: "/pay", label: "급여", icon: "/icons/nav-pay.svg" },
  { href: "/me", label: "내 정보", icon: "/icons/nav-me.svg" },
];

// Figma 02.Main 하단 메뉴(node 19:2077): 흰 바탕 · 위 1px #EFF2F6 · 위로 아주 옅은 그림자 · 안쪽 좌우 12 위아래 9.
// 칸마다 아이콘 23px + 글자 11px(사이 3.5, 최소 높이 54). 지금 칸은 남보라 bold, 나머지는 보조 글자 regular.
// 아이콘은 마스크로 글자색을 따른다(Figma 가 뒤집어 내보내 flipY).
// 칸을 옮길 때는 오른쪽 칸이면 nav-forward, 왼쪽 칸이면 nav-back 슬라이드를 붙인다(globals.css).
// 메뉴 자신은 view-transition-name 으로 따로 떼어 움직이지 않게 한다 — 내용만 미끄러지고 메뉴는 기준점으로 남는다.
export function BottomNav({ current, items = BOTTOM_NAV_ITEMS }: { current: string; items?: BottomNavItem[] }) {
  const here = items.findIndex((n) => n.href === current);
  return (
    <nav
      aria-label="주 메뉴"
      style={{ viewTransitionName: "bottom-nav" }}
      className="flex w-full items-end border-t border-staff-border-light bg-white px-[12px] pt-[9px] pb-[max(9px,env(safe-area-inset-bottom))] shadow-[0_-5px_10px_rgba(35,55,82,0.01)]"
    >
      {items.map((item, i) => {
        const on = item.href === current;
        const direction = here < 0 || i === here ? undefined : i > here ? ["nav-forward"] : ["nav-back"];
        return (
          <Link
            key={item.label}
            href={item.href}
            transitionTypes={direction}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[54px] flex-1 flex-col items-center gap-[3.5px] rounded-[12px] py-[6px] text-[11px] leading-[1.5] transition-colors duration-150 ease-out ${
              on ? "font-bold text-staff-primary" : "text-staff-text-sub"
            }`}
          >
            <MaskIcon src={(on && item.activeIcon) || item.icon} size={23} flipY />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
