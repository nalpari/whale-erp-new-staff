import Image from "next/image";
import Link from "next/link";

// Figma 02.Main 「나의 근무 정보」 줄(node 9:345): 흰 바탕 · #EFF2F6 테두리 · radius 18 · 안쪽 16 · 사이 9.
// 아이콘은 바탕까지 그려진 33px 그림(public/icons/menu-*.svg). 제목 14px semibold · 설명 12px 보조 글자 · 오른쪽 꺾쇠 12px.
// 카드 전체가 링크다.
export function InfoRow({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-[9px] rounded-[18px] border border-staff-border-light bg-white p-[16px] leading-[1.5] transition-colors duration-150 ease-out active:bg-staff-info-bg"
    >
      <Image src={icon} alt="" width={33} height={33} />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="truncate text-[14px] font-semibold text-staff-text">{title}</span>
        {description && <span className="truncate text-[12px] text-staff-text-sub">{description}</span>}
      </span>
      <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
    </Link>
  );
}
