import type { ReactNode } from "react";
import { MaskIcon } from "@/components/common";

// 근로계약서 화면 조각. 데모 조각(docs/demo/src/ui.mjs)의 body detail · sunken · values · tiny 를 DESIGN.md 토큰으로 옮겼다.

/** 화면 틀: 머리줄 · 본문(데모 body detail — 좌우 22 · 위 22 · 사이 20). 데모 근로계약 화면에는 하단 메뉴가 없다. */
export function ContractFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col leading-[1.5]">
      {header}
      <div className="flex flex-1 flex-col gap-[20px] px-[22px] pt-[22px] pb-[24px]">{children}</div>
    </div>
  );
}

/** 데모 sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. label 은 머리 13px semibold. */
export function Sunken({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[4px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
      {label && <h2 className="text-[13px] font-semibold text-staff-text-sub">{label}</h2>}
      {children}
    </section>
  );
}

/** 데모 values: 이름 · 값 줄. 13px, 이름은 보조 글자 · 값은 기본 글자 오른쪽, 위아래 9 · 줄 사이 옅은 선. 값이 없는 줄은 뺀다. */
export function Values({ rows }: { rows: [string, ReactNode | null | undefined][] }) {
  return (
    <dl className="flex flex-col divide-y divide-staff-border-light text-[13px]">
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-[12px] py-[9px]">
            <dt className="shrink-0 text-staff-text-sub">{label}</dt>
            <dd className="min-w-0 text-right break-keep">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** 데모 tiny: 화면 아래 작은 안내. */
export function Tiny({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text-sub">{children}</p>;
}

/**
 * 계약서 머리 카드(데모 detail · readonly · expired). 남은 날인 기한이 7일 이내면(CON-4) 상태 칩 지각 · 긴급 색(#FFF6E5 · #956013)
 * 바탕으로 기한 줄을 강조한다 — 이 화면에만 나오는 색이라 토큰으로 두지 않는다.
 */
export function ContractHead({ title, sub, urgent, badge }: { title: string; sub: string; urgent: boolean; badge: ReactNode }) {
  return (
    <section
      className={`flex items-center gap-[12px] rounded-[16px] p-[16px] ${urgent ? "bg-[#fff6e5]" : "border border-staff-border-light bg-white"}`}
    >
      <span className={`flex ${urgent ? "text-[#956013]" : "text-staff-placeholder"}`}>
        <MaskIcon src="/icons/contract.svg" size={18} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="text-[15px] font-bold">{title}</p>
        <p className={`text-[12px] ${urgent ? "font-semibold text-[#956013]" : "text-staff-text-muted"}`}>{sub}</p>
      </div>
      {badge}
    </section>
  );
}
