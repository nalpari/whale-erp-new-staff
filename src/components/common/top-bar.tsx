import Image from "next/image";
import Link from "next/link";

// Figma 02.Main 머리줄(node 8:53): 작은 로고(36px) · 점포 이름 버튼(15px bold + 아래 꺾쇠) · 알림 버튼.
// 알림 버튼은 흰 바탕 · #E9EDF3 테두리 · radius 14 · 44px, 새 알림이 있으면 오른쪽 위 8px 빨간 점(#C24242).
// 두 색은 이 버튼에만 나와 토큰으로 두지 않는다. 아이콘은 Figma 가 뒤집어 내보내 -scale-y-100 으로 세운다.
export function TopBar({
  store,
  onStoreClick,
  alarmHref,
  hasNewAlarm = false,
}: {
  store: string;
  onStoreClick?: () => void;
  alarmHref: string;
  hasNewAlarm?: boolean;
}) {
  return (
    <header className="flex w-full items-center gap-[10px]">
      <span className="relative size-[36px] shrink-0">
        <Image src="/icons/logo-whale-small.svg" alt="" width={36.193} height={27.446} className="absolute top-[8.75px] left-0" />
        <Image src="/icons/logo-stars-small.svg" alt="" width={17.494} height={12.668} className="absolute top-0 left-[5.43px]" />
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onStoreClick}
          aria-label={`점포 바꾸기, 지금 ${store}`}
          className="flex min-h-[44px] max-w-full items-center gap-[7px] py-[10px] text-[15px] leading-[1.5] font-bold text-staff-text"
        >
          <span className="truncate">{store}</span>
          <Image src="/icons/chevron-down.svg" alt="" width={15} height={15} className="-scale-y-100" />
        </button>
      </div>
      <Link
        href={alarmHref}
        transitionTypes={["nav-forward"]}
        aria-label={hasNewAlarm ? "알림, 새 알림 있음" : "알림"}
        className="relative flex size-[44px] shrink-0 items-center justify-center rounded-[14px] border border-[#e9edf3] bg-white transition-colors duration-150 ease-out active:bg-staff-info-bg"
      >
        <Image src="/icons/bell.svg" alt="" width={21} height={21} className="-scale-y-100" />
        {hasNewAlarm && <span className="absolute top-[11px] right-[12px] size-[8px] rounded-full border border-white bg-[#c24242]" />}
      </Link>
    </header>
  );
}
