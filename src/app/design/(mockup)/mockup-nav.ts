import { BOTTOM_NAV_ITEMS } from "@/components/common";

// 목업 여러 화면이 같이 쓰는 고정 데이터. 서버 화면에서도 읽으므로 "use client" 파일에 두지 않는다.

// 하단 메뉴: 목업이 있는 칸만 목업 경로로, 나머지는 # 로 둔다.
const MOCKUP_ROUTES: Record<string, string> = { 홈: "/design/home", 근무: "/design/work", 출퇴근: "/design/check-in", 급여: "/design/pay" };
export const MOCKUP_NAV = BOTTOM_NAV_ITEMS.map((item) => ({ ...item, href: MOCKUP_ROUTES[item.label] ?? "#" }));

export const STORES = ["웨일카페 강남역점", "웨일카페 홍대점"];
