import Image from "next/image";
import Link from "next/link";

// Figma Info Row Card: 아이콘 칸(36px, radius 10, 연한 브랜드 바탕) · 제목 14px semibold · 설명 12px · 오른쪽 꺾쇠.
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
      className="flex w-full items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-white p-[16px] transition-colors duration-150 ease-out active:bg-staff-info-bg"
    >
      <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[10px] bg-staff-primary-inactive">
        <Image src={icon} alt="" width={20} height={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-semibold text-staff-text">{title}</span>
        {description && <span className="truncate text-[12px] text-staff-text-muted">{description}</span>}
      </span>
      <Image src="/icons/chevron-right.svg" alt="" width={16} height={16} />
    </Link>
  );
}
