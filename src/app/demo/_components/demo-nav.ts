import { BOTTOM_NAV_ITEMS, type BottomNavItem } from "@/components/common";

// 데모 화면의 하단 메뉴. 공통 BottomNav 의 다섯 칸을 그대로 두고 경로만 /demo 아래로 바꾼다.
// 출퇴근 칸은 출퇴근 등록으로 간다. 홈의 오늘 근무 카드에서 들어가는 길도 그대로 둔다.
const DEMO_HREF: Record<string, string> = {
  홈: "/demo/home",
  근무: "/demo/work",
  출퇴근: "/demo/check-in",
  급여: "/demo/pay",
  "내 정보": "/demo/me",
};

export const DEMO_NAV_ITEMS: BottomNavItem[] = BOTTOM_NAV_ITEMS.map((item) => ({ ...item, href: DEMO_HREF[item.label] }));
