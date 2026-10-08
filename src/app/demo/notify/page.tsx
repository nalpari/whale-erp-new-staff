"use client";

// 직원 근무 앱 데모 · 알림(/demo/notify). 기준 목업: docs/mockup/app/notify.html — 상태 4개(알림함 · 알림 없음 · 수신 설정 · 연결 끊김),
// 화면 문구·가짜 값·버튼의 이동(data-go)·알림(data-toast)을 옮겼다. 목업에 시트는 없다. 쟁점 NOTI-1~7 은 모두 확정이다.
//   직원 알림은 근로계약서 발송 · 근무스케줄 주요 변경 · TO-DO 배정 · 급여명세서 발송 넷뿐이다(S-AYBNWF).
//   NOTI-1 TO-DO 배정은 앱 푸시를 보내지 않고 알림함에만 한 줄 쌓인다. 근무시간 외 보류 규칙은 없어졌다. 긴급 TO-DO 는 빨간 점.
//   NOTI-2 알림톡은 자동 대체 없이 프로세스별로 함께 보낸다. NOTI-3 알림함은 14일 보관. NOTI-4 한 줄에 발송 결과까지 적는다.
//   NOTI-5 알림함은 머리줄 알림 버튼으로 들어온다(홈 데모). NOTI-6 다시 보낸 급여명세서는 「다시 발송되었습니다 · 금액이 바뀌었을 수 있습니다」.
//   알림을 누르면 관련 화면으로 가며 자동으로 읽음 처리된다. 직원 알림함은 줄마다 읽음을 바꿀 수 있고(S-IMFWJT), 머리에 「모두 읽음」도 둔다(NOTI-7,
//   2026-10-08) — 관리자 웹 운영 알림함은 모두 읽음만 둔다.
//   수신은 수신 설정 묶음(근로계약서 · 근무스케줄 · TO-DO · 급여명세서) 단위로 켜고 끈다. 근로계약서 · 급여명세서는 잠긴 스위치, 꺼 둔 묶음의 알림도
//   알림함에는 남는다(S-SIGZJQ). TO-DO 묶음은 보낼 앱 푸시가 없어 스위치 대신 「알림함만」(목업 그대로).
// 수신 설정(settings)은 Figma 09.알림설정(node 17:1097)을 따른다. 알림함 · 알림 없음 · 연결 끊김은 Figma 없음 — DESIGN.md 기준 초안.
// 목업과 다른 점: 목업 btn--quiet(더 보기)는 outline 버튼이다. 하단 메뉴는 목업처럼 다섯 칸이다(2026-10-08 재영 결정).
// 목업에서 링크가 없던 읽은 줄도 같은 규칙으로 관련 화면에 잇는다. 줄마다 읽음을 바꾸는 동작은 목업에 그려져 있지 않아 왼쪽 점을 누르는 것으로 그렸다.
// 데모라 다른 화면으로 갔다 돌아오면 읽음 표시는 처음으로 돌아간다.
import Link from "next/link";
import { useState } from "react";
import { BottomNav, Button, MaskIcon, Notice, PageHeader, SwitchRow } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { BackHeader, DEMO_NAV_ITEMS, DemoStates, Empty, useDemoState, useToast } from "../_components";

// 목업 오른쪽 목록 순서 그대로.
const STATES = [
  { id: "inbox", label: "알림함", note: "미확인 4건" },
  { id: "inbox-empty", label: "알림 없음", note: "빈 상태" },
  { id: "settings", label: "수신 설정", note: "수신 설정 묶음별 토글" },
  { id: "gone", label: "연결 끊김", note: "데이터 삭제·접근 불가" },
];

const HOME = "/demo/home";

// 알림 유형별 아이콘과 누르면 가는 곳. 목업 pay.html 에 「다시 보낸 명세서」 상태가 있어 다시 발송 알림은 그리로 간다.
const KIND = {
  contract: { icon: "/icons/contract.svg", flipY: false, href: "/demo/contract#detail" },
  schedule: { icon: "/icons/nav-work.svg", flipY: true, href: "/demo/work" },
  todo: { icon: "/icons/check.svg", flipY: false, href: "/demo/work#todo" },
  payslip: { icon: "/icons/nav-pay.svg", flipY: true, href: "/demo/pay#detail" },
};

// 목업 알림함 여덟 줄 그대로. 위 넷이 미확인이다.
const NOTIFICATIONS: {
  id: string;
  kind: keyof typeof KIND;
  title: string;
  sub: string;
  sent?: string;
  time: string;
  unread?: boolean;
  urgent?: boolean;
  href?: string;
}[] = [
  {
    id: "n1",
    kind: "contract",
    title: "근로계약서가 도착했습니다",
    sub: "웨일카페 강남역점 · 2026년 9월 근로계약서 · 날인 대기",
    sent: "앱 푸시 실패 09:12 · 알림톡으로 함께 보냄",
    time: "4분 전",
    unread: true,
  },
  { id: "n2", kind: "schedule", title: "이번 주 근무스케줄이 바뀌었습니다", sub: "9/12(토) 근무가 13:00–22:00으로 바뀌었습니다", time: "1시간 전", unread: true },
  { id: "n3", kind: "todo", title: "TO-DO가 배정되었습니다 · 긴급", sub: "환불 요청 처리 · 지금 바로", time: "3시간 전", unread: true, urgent: true },
  {
    id: "n4",
    kind: "payslip",
    title: "8월 급여명세서가 다시 발송되었습니다",
    sub: "금액이 바뀌었을 수 있습니다",
    time: "5시간 전",
    unread: true,
    href: "/demo/pay#resent",
  },
  { id: "n5", kind: "todo", title: "TO-DO가 배정되었습니다", sub: "유통기한 라벨 점검 · 내일 14:00까지 · 읽음", time: "어제 23:40" },
  { id: "n6", kind: "payslip", title: "8월 급여명세서가 도착했습니다", sub: "읽음", time: "8일 전" },
  { id: "n7", kind: "schedule", title: "근무스케줄이 바뀌었습니다", sub: "9/9(수) 근무가 휴무로 바뀌었습니다 · 읽음", time: "4일 전" },
  { id: "n8", kind: "contract", title: "근로계약서가 도착했습니다", sub: "2026년 8월 근로계약서 · 날인 완료 · 읽음", time: "12일 전" },
];

export default function DemoNotifyPage() {
  const [state, go] = useDemoState(STATES);
  const [unread, setUnread] = useState(() => new Set(NOTIFICATIONS.filter((n) => n.unread).map((n) => n.id)));
  const [scheduleOn, setScheduleOn] = useState(true);
  const [toast, setToast] = useToast();

  const setRead = (id: string, read: boolean) =>
    setUnread((prev) => {
      const next = new Set(prev);
      if (read) next.delete(id);
      else next.add(id);
      return next;
    });

  // 알림함으로 들어가는 머리줄 오른쪽 버튼(목업 abar__end 톱니). 누르는 칸 44px, PageHeader 뒤로 가기처럼 -10px 여백.
  const settingsButton = (
    <button
      type="button"
      onClick={() => go("settings")}
      aria-label="알림 설정"
      className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center text-staff-text"
    >
      <GearIcon />
    </button>
  );

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={go} />

      <PageSlide key={state}>
        <div className="flex flex-1 flex-col leading-[1.5]">
          {state === "settings" ? (
            <BackHeader title="알림 설정" onBack={() => go("inbox", "nav-back")} />
          ) : (
            <PageHeader title="알림" backHref={HOME} action={state === "gone" ? undefined : settingsButton} />
          )}

          {state === "inbox" && (
            <main className="flex flex-1 flex-col gap-[16px] px-[16px] pt-[16px] pb-[24px]">
              {/* 모두 읽음(NOTI-7). 미확인이 없으면 누를 것이 없어 끈다. */}
              <div className="-my-[8px] flex items-center justify-between pl-[2px]">
                <span className="text-[13px] font-semibold text-staff-text-sub">미확인 {unread.size}건</span>
                <button
                  type="button"
                  disabled={unread.size === 0}
                  onClick={() => {
                    setUnread(new Set());
                    setToast("모두 읽음으로 바꿨습니다");
                  }}
                  className={`h-[44px] rounded-[14px] px-[12px] text-[13px] font-bold text-staff-text-sub active:bg-staff-primary-inactive ${PRESS}`}
                >
                  모두 읽음
                </button>
              </div>
              <ul className="flex flex-col divide-y divide-staff-border-light overflow-hidden rounded-[16px] border border-staff-border-light bg-white">
                {NOTIFICATIONS.map((n) => (
                  <NotificationRow key={n.id} {...n} unread={unread.has(n.id)} onRead={(read) => setRead(n.id, read)} />
                ))}
              </ul>
              <Button variant="outline" onClick={() => setToast("20건을 더 불러왔습니다")}>
                더 보기
              </Button>
              <Notice icon={<MaskIcon src="/icons/history.svg" size={16} flipY />}>
                알림은 <strong>14일</strong> 동안 보관합니다. 근로계약서와 급여명세서는 각 화면에서 기간대로 계속 볼 수 있습니다.
              </Notice>
            </main>
          )}

          {state === "inbox-empty" && (
            <main className="flex flex-1 flex-col">
              <Empty icon={<MaskIcon src="/icons/bell.svg" size={24} flipY />} title="확인할 알림이 없습니다">
                근로계약서, 근무스케줄 변경, TO-DO 배정, 급여명세서가 도착하면 여기에 표시됩니다.
              </Empty>
            </main>
          )}

          {/* 수신 설정 — Figma 09.알림설정(node 17:1097)의 여백·목록·안내 블록, 문구는 목업. */}
          {state === "settings" && (
            <main className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px]">
              <p className="pb-[4px] text-[14px]">
                유형별로 받을 앱 푸시를 고릅니다.
                <br />꺼 둔 유형도 알림함에서는 확인할 수 있습니다.
              </p>
              <ul className="divide-y divide-[#e8edf3]">
                <SwitchRow title="근로계약서 발송" description="항상 켜져 있습니다 · 계약 확인은 놓치면 안 됩니다" checked locked />
                <SwitchRow title="근무스케줄 주요 변경" description="근무 시간이나 근무일이 바뀌면 알립니다" checked={scheduleOn} onChange={setScheduleOn} />
                {/* TO-DO 묶음은 앱 푸시가 없어(NOTI-1) 켜고 끌 것이 없다. SwitchRow 와 같은 줄에 스위치 대신 「알림함만」. */}
                <li className="flex items-center gap-[12px] py-[17px]">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[15px] font-semibold text-staff-text-muted">TO-DO 배정</p>
                    <p className="pt-[2px] text-[12px] text-staff-text-sub">푸시를 보내지 않습니다 · 홈과 근무 탭에서 봅니다</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-staff-text-muted">알림함만</span>
                </li>
                <SwitchRow title="급여명세서 발송" description="항상 켜져 있습니다 · 급여 확인은 놓치면 안 됩니다" checked locked />
              </ul>
              {/* 채널 안내(node 17:1241): #F9FBFD 바탕 · 옅은 테두리 · radius 14 · 안쪽 14. 문구는 NOTI-2 확정 뒤의 목업 문구. */}
              <p className="mt-auto rounded-[14px] border border-staff-border-light bg-[#f9fbfd] p-[14px] text-[12px] text-staff-text-sub">
                기본 채널은 앱 푸시입니다. 근로계약서처럼 꼭 확인해야 하는 알림은 카카오 알림톡을 함께 보내는 경우가 있습니다.
              </p>
            </main>
          )}

          {/* 알림을 눌렀지만 관련 항목이 지워졌거나 볼 수 없을 때. 알림은 알림함에 남는다. */}
          {state === "gone" && (
            <main className="flex flex-1 flex-col">
              <Empty icon={<LinkBreakIcon />} title="이 알림과 연결된 화면을 열 수 없습니다">
                관련 항목이 삭제되었거나 더 이상 접근할 수 없습니다. 알림 자체는 계속 알림함에 남아 있습니다.
                <div className="pt-[8px]">
                  <Button variant="ghost" onClick={() => go("inbox", "nav-back")}>
                    알림함으로 돌아가기
                  </Button>
                </div>
              </Empty>
            </main>
          )}

          {/* 목업 탭바는 수신 설정·연결 끊김에서 빠진다(data-unless). 알림은 메뉴 칸이 아니라 지금 칸이 없다. */}
          {(state === "inbox" || state === "inbox-empty") && (
            <div className="sticky bottom-0 mt-auto">
              <BottomNav current="/demo/notify" items={DEMO_NAV_ITEMS} />
            </div>
          )}
        </div>
      </PageSlide>

      {toast}
    </>
  );
}

// 알림 한 줄. 왼쪽 점이 읽음 상태를 보이고 누르면 바꾼다(S-IMFWJT, 누르는 칸 44px). 미확인은 남보라, 긴급 TO-DO 는 빨간 점(TopBar 새 알림 점과 같은 #C24242),
// 읽음은 빈 고리. 나머지를 누르면 읽음으로 바꾸고 관련 화면으로 간다. 읽은 줄은 글자를 흐리게 가라앉힌다.
function NotificationRow({
  kind,
  title,
  sub,
  sent,
  time,
  unread,
  urgent,
  href,
  onRead,
}: (typeof NOTIFICATIONS)[number] & { onRead: (read: boolean) => void }) {
  const k = KIND[kind];
  return (
    <li className="flex items-start">
      <button
        type="button"
        onClick={() => onRead(!!unread)}
        aria-label={unread ? `${title} 읽음으로 표시` : `${title} 안 읽음으로 표시`}
        aria-pressed={!unread}
        className="flex size-[44px] shrink-0 items-center justify-center self-stretch pt-[2px]"
      >
        <span
          className={`size-[8px] rounded-full ${unread ? (urgent ? "bg-[#c24242]" : "bg-staff-primary") : "border border-staff-border"}`}
        />
      </button>
      <Link
        href={href ?? k.href}
        transitionTypes={["nav-forward"]}
        onClick={() => onRead(true)}
        className="flex min-w-0 flex-1 items-start gap-[12px] py-[14px] pr-[16px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
      >
        <span className={`flex size-[22px] shrink-0 items-center justify-center ${unread ? "text-staff-text" : "text-staff-placeholder"}`}>
          <MaskIcon src={k.icon} size={kind === "todo" ? 14 : 19} flipY={k.flipY} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className={`text-[14px] font-semibold ${unread ? "text-staff-text" : "text-staff-text-muted"}`}>{title}</span>
          <span className="text-[12px] text-staff-text-sub">{sub}</span>
          {/* 그 알림의 발송 결과(NOTI-4). */}
          {sent && <span className="text-[12px] text-staff-text-muted">{sent}</span>}
        </span>
        <span className="shrink-0 pt-[2px] text-[12px] text-staff-text-muted">{time}</span>
      </Link>
    </li>
  );
}

// public/icons 에 없는 아이콘 둘(목업 ph-gear-six · ph-link-break). 이 화면에만 나와 글자색을 따르는 선 아이콘으로 그린다.
function GearIcon() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function LinkBreakIcon() {
  return (
    <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2" />
      <path d="M4 4l16 16" />
    </svg>
  );
}
