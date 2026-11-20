import Link from "next/link";
import type { ReactNode } from "react";
import { PRESS } from "@/components/common/theme";

// 내 정보 정돈 시안(⑬, 2026-11-20 사용자 지정)의 줄 상자 조각 — 흰 상자(radius 16 · staff-border) 안에 min-h 56 줄을 옅은 선으로
// 나눈다. 줄은 왼쪽 32px 원 아이콘(안내 바탕) · 이름 15 semibold · 값 13 흐림 · 오른쪽 꺾쇠. 동의 카드(consent-cards)도 같은 상자를 쓴다.

/** 시안의 선 아이콘(24 칸 · 1.8 선). 글자색(currentColor)을 따른다. */
const PATHS = {
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7v9H4z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  store: (
    <>
      <path d="M4 9l1.5-5h13L20 9" />
      <path d="M4 9v11h16V9" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  chevron: <path d="M9 5l7 7-7 7" />,
  logout: <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </>
  ),
};

export type LineIconName = keyof typeof PATHS;

export function LineIcon({ name, size = 17 }: { name: LineIconName; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "info" ? 2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {PATHS[name]}
    </svg>
  );
}

/** 줄 왼쪽 32px 원 아이콘 — 안내 바탕 · 보조 글자색. accent 면 연보라 바탕 · 남보라(새 근무지 초대), dot 이면 오른쪽 위 빨간 점. */
export function RowIcon({ name, accent = false, dot = false }: { name: LineIconName; accent?: boolean; dot?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative flex size-[32px] shrink-0 items-center justify-center rounded-full ${accent ? "bg-staff-primary-inactive text-staff-primary" : "bg-staff-info-bg text-staff-text-sub"}`}
    >
      <LineIcon name={name} />
      {dot && <span className="absolute top-[1px] right-[1px] size-[7px] rounded-full border-[1.5px] border-white bg-staff-error" />}
    </span>
  );
}

/** 줄 오른쪽 꺾쇠(16px, 자리표시 색). open 이면 아래를 본다(펼친 주소 줄). */
export function RowChevron({ open = false }: { open?: boolean }) {
  return (
    <span aria-hidden className={`flex text-staff-placeholder transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
      <LineIcon name="chevron" size={16} />
    </span>
  );
}

/** 흰 줄 상자. 줄 사이 옅은 선은 둘째 줄부터 위에 긋는다. */
export function RowBox({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-staff-border bg-white [&>*+*]:border-t [&>*+*]:border-staff-border-light">
      {children}
    </div>
  );
}

const ROW = "flex min-h-[56px] w-full items-center gap-[12px] py-[10px] pr-[16px] pl-[14px] text-left";

/** 줄 가운데 — 이름 15 semibold, 아래 값 13 흐림(값은 자르지 않고 줄을 바꾼다). */
export function RowText({ name, value }: { name: ReactNode; value?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col break-keep">
      <span className="text-[15px] font-semibold text-staff-text">{name}</span>
      {value && <span className="text-[13px] text-staff-text-muted">{value}</span>}
    </span>
  );
}

/** 더 깊은 화면으로 가는 줄. 늘 앞으로 가는 이동이라 nav-forward 슬라이드를 붙인다. highlight 면 연보라 기운 바탕(새 근무지 초대). */
export function LinkRow({
  href,
  icon,
  name,
  value,
  highlight = false,
}: {
  href: string;
  icon: ReactNode;
  name: ReactNode;
  value?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      // 새 근무지 초대 줄 바탕 #f9f9fe — 시안의 연보라 기운 흰색. 이 줄에만 나와 토큰으로 두지 않는다.
      className={`${ROW} ${highlight ? "bg-[#f9f9fe]" : ""} active:bg-staff-info-bg ${PRESS}`}
    >
      {icon}
      <RowText name={name} value={value} />
      <RowChevron />
    </Link>
  );
}

export const ROW_CLASS = ROW;

/** 묶음 — 제목(14 semibold 보조) · 상자 · 아래 안내(12 흐림). 제목이 없으면 상자만. */
export function RowGroup({ title, note, children }: { title?: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[8px]">
      {title && <h2 className="px-[4px] text-[14px] font-semibold text-staff-text-sub">{title}</h2>}
      {children}
      {note && <p className="px-[4px] text-[12px] leading-[1.5] whitespace-pre-line text-staff-text-muted">{note}</p>}
    </section>
  );
}
