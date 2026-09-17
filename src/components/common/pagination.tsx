"use client";

import Image from "next/image";

const ARROW = "flex items-center gap-[4px] transition-colors duration-150 ease-out enabled:hover:text-erp-brand disabled:text-erp-thead-text";

// 현재 페이지를 가운데에 두고 최대 max 개의 번호를 고른다.
function visiblePages(page: number, total: number, max: number) {
  const start = Math.max(1, Math.min(page - Math.floor(max / 2), total - max + 1));
  return Array.from({ length: Math.min(max, total) }, (_, i) => start + i);
}

// Figma Pagination. 번호는 최대 maxPages(기본 10)개를 현재 페이지 중심으로 보여 준다.
export function Pagination({
  page,
  total,
  maxPages = 10,
  onPageChange,
}: {
  page: number;
  total: number;
  maxPages?: number;
  onPageChange?: (page: number) => void;
}) {
  const go = (n: number) => {
    if (n >= 1 && n <= total && n !== page) onPageChange?.(n);
  };

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-[17px] text-[14px] font-medium">
      <button type="button" disabled={page <= 1} onClick={() => go(page - 1)} className={`${ARROW} text-erp-ink`}>
        <Image src="/icons/prev.svg" alt="" width={16} height={16} />
        Prev
      </button>
      <ol className="flex gap-[9px]">
        {visiblePages(page, total, maxPages).map((n) => (
          <li key={n}>
            <button
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => go(n)}
              className={`size-[38px] rounded-[2px] transition-[border-color,color] duration-150 ease-out ${
                n === page
                  ? "bg-erp-subtle font-semibold text-erp-ink"
                  : "border border-erp-subtle bg-white text-erp-muted hover:border-erp-brand hover:text-erp-ink"
              }`}
            >
              {n}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" disabled={page >= total} onClick={() => go(page + 1)} className={`${ARROW} text-erp-ink`}>
        Next
        <Image src="/icons/next.svg" alt="" width={16} height={16} />
      </button>
    </nav>
  );
}
