import { BOTTOM_NAV_ITEMS, type BottomNavItem } from "@/components/common";

// 데모 화면의 하단 메뉴. 공통 BottomNav 의 네 칸(Figma 순서 · DESIGN.md)을 그대로 두고 경로만 /demo 아래로 바꾼다.
// 목업은 출퇴근까지 다섯 칸이지만 Figma·DESIGN.md 는 네 칸이고 출퇴근은 홈의 오늘의 근무 카드에서 들어간다.
const DEMO_HREF: Record<string, string> = { 홈: "/demo/home", 근무: "/demo/work", 급여: "/demo/pay", "내 정보": "/demo/me" };

export const DEMO_NAV_ITEMS: BottomNavItem[] = BOTTOM_NAV_ITEMS.map((item) => ({ ...item, href: DEMO_HREF[item.label] }));
