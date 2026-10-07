"use client";

import { useState } from "react";
import {
  Badge,
  BottomSheet,
  Button,
  SheetOption,
  BOTTOM_NAV_ITEMS,
  BottomNav,
  SegmentedControl,
  TodoItem,
  TodoList,
  WeekSelector,
  type WeekDay,
} from "@/components/common";

// 가이드에서 눌러 볼 수 있게 상태를 들고 있는 샘플들.

export function SegmentedDemo() {
  const [tab, setTab] = useState<"schedule" | "todo">("schedule");
  return (
    <SegmentedControl
      label="보기"
      value={tab}
      onChange={setTab}
      items={[
        { value: "schedule", label: "스케줄" },
        { value: "todo", label: "TO-DO" },
      ]}
    />
  );
}

// 가이드에서는 다른 화면으로 넘어가지 않게 # 링크로 두고, 누른 칸을 지금 칸으로 칠한다.
// next/link 의 # 이동은 pushState 라 hashchange 가 오지 않으므로 누른 링크를 직접 읽는다.
const GUIDE_NAV = BOTTOM_NAV_ITEMS.map((item, i) => ({ ...item, href: `#${["home", "work", "pay", "me"][i]}` }));

export function NavDemo() {
  const [current, setCurrent] = useState("#home");
  return (
    <div
      onClickCapture={(e) => {
        const href = (e.target as Element).closest("a")?.getAttribute("href");
        if (href) setCurrent(href);
      }}
    >
      <BottomNav current={current} items={GUIDE_NAV} />
    </div>
  );
}

const WEEK: WeekDay[] = [
  { key: "09-07", weekday: "월", date: 7 },
  { key: "09-08", weekday: "화", date: 8, work: true, muted: true },
  { key: "09-09", weekday: "수", date: 9, work: true },
  { key: "09-10", weekday: "목", date: 10, work: true },
  { key: "09-11", weekday: "금", date: 11, work: true },
  { key: "09-12", weekday: "토", date: 12, work: true },
  { key: "09-13", weekday: "일", date: 13, muted: true },
];

export function WeekDemo() {
  const [day, setDay] = useState("09-10");
  return <WeekSelector days={WEEK} selected={day} onSelect={setDay} />;
}

export function TodoDemo() {
  const [done, setDone] = useState<Record<string, boolean>>({ pop: true });
  const toggle = (key: string) => (value: boolean) => setDone((d) => ({ ...d, [key]: value }));
  return (
    <TodoList>
      <TodoItem
        title="마감 청소 사진 촬영"
        meta="9월 9일(수) · 기한 지남"
        done={!!done.clean}
        onToggle={toggle("clean")}
        badges={<Badge tone="waiting">대기</Badge>}
      />
      <TodoItem
        title="냉장고 온도 점검 및 사진 제출"
        meta="9월 10일(목) 14:00"
        done={!!done.fridge}
        onToggle={toggle("fridge")}
        badges={
          <>
            <Badge tone="warning">긴급</Badge>
            <Badge tone="waiting">대기</Badge>
          </>
        }
      />
      <TodoItem
        title="신메뉴 시식 후 피드백 작성"
        meta="9월 10일(목) · 시간 미정"
        done={!!done.menu}
        onToggle={toggle("menu")}
        badges={<Badge tone="progress">진행 중</Badge>}
      />
      <TodoItem
        title="여름 시즌 POP 철거"
        meta="9월 8일(화) 16:40 완료"
        done={!!done.pop}
        onToggle={toggle("pop")}
        badges={<Badge tone="success">완료</Badge>}
      />
    </TodoList>
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  const [store, setStore] = useState("웨일카페 강남역점");
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {store}
      </Button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="어디에서 근무하시나요?" description="선택한 근무지의 정보를 보여드려요.">
        {["웨일카페 강남역점", "웨일카페 홍대점"].map((s) => (
          <SheetOption
            key={s}
            selected={s === store}
            onClick={() => {
              setStore(s);
              setOpen(false);
            }}
          >
            {s}
          </SheetOption>
        ))}
      </BottomSheet>
    </>
  );
}
