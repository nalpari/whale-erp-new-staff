import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// 근무지 머리줄 — 홈 · 근무 · 출퇴근 탭이 같이 쓴다(2026-11-24 사용자 지정, 배달 앱 주소 머리줄을 본뜸).
//   홈(title 없음): 근무지 이름(17px bold) + 꺾쇠 · 오른쪽 알림 종
//   탭 화면(title): 첫 줄 화면 제목(22px bold) · 알림 종, 둘째 줄 근무지 이름(15px bold) + 꺾쇠 · 오른쪽 끝 action
// onStoreClick 이 없으면(근무지가 하나 · 없음) 꺾쇠를 그리지 않는다(#314, 2026-10-23 재영).
// 알림 종은 테두리 상자 없이 아이콘만(누르는 칸 44px), 새 알림이 있으면 오른쪽 위 8px 빨간 점(#C24242 — 이 점에만 나와 토큰으로 두지 않는다).
// 아이콘은 Figma 가 뒤집어 내보내 -scale-y-100 으로 세운다.
export function TopBar({
  store,
  onStoreClick,
  alarmHref,
  hasNewAlarm = false,
  title,
  backHref,
  action,
}: {
  store: string;
  onStoreClick?: () => void;
  alarmHref: string;
  hasNewAlarm?: boolean;
  /** 탭 화면 제목 — 있으면 제목 줄 아래에 근무지 줄을 둔다 */
  title?: string;
  /** 이어 들어온 화면(알림에서 연 근무 정보 등)만 뒤로 가기 */
  backHref?: string;
  /** 근무지 줄 오른쪽 끝(출퇴근의 「출퇴근 현황 ›」) */
  action?: ReactNode;
}) {
  const storeButton = (
    <button
      type="button"
      onClick={onStoreClick}
      aria-label={`근무지 바꾸기, 지금 ${store}`}
      className={`flex min-h-[44px] max-w-full min-w-0 items-center gap-[6px] font-bold text-staff-text ${title ? "text-[15px]" : "text-[17px]"}`}
    >
      <span className="truncate">{store}</span>
      {onStoreClick && <Image src="/icons/chevron-down.svg" alt="" width={13} height={13} className="shrink-0 -scale-y-100" />}
    </button>
  );
  const bell = (
    <Link
      href={alarmHref}
      transitionTypes={["nav-forward"]}
      aria-label={hasNewAlarm ? "알림, 새 알림 있음" : "알림"}
      className="relative -mr-[10px] flex size-[44px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 ease-out active:bg-staff-info-bg"
    >
      <Image src="/icons/bell.svg" alt="" width={23} height={23} className="-scale-y-100" />
      {hasNewAlarm && <span className="absolute top-[10px] right-[11px] size-[8px] rounded-full border border-white bg-[#c24242]" />}
    </Link>
  );
  if (!title)
    return (
      <header className="flex w-full items-center gap-[10px]">
        <div className="min-w-0 flex-1">{storeButton}</div>
        {bell}
      </header>
    );
  return (
    <header className="flex w-full flex-col">
      <div className="flex min-h-[44px] items-center gap-[12px]">
        {backHref && (
          <Link href={backHref} transitionTypes={["nav-back"]} aria-label="뒤로" className="-ml-[10px] flex size-[44px] shrink-0 items-center justify-center">
            <Image src="/icons/back.svg" alt="" width={19} height={19} className="-scale-y-100" />
          </Link>
        )}
        <h1 className="min-w-0 flex-1 truncate text-[22px] leading-[1.4] font-bold">{title}</h1>
        {bell}
      </div>
      <div className="flex items-center justify-between gap-[10px]">
        <div className="min-w-0 flex-1">{storeButton}</div>
        {action}
      </div>
    </header>
  );
}
