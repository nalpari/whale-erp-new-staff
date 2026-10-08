import type { ReactNode } from "react";

// 안내 판. 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14.
// prose: 글을 바로 담는 판(출퇴근 등록·근로계약). 13px 보조 글자, <b> 는 기본 글자색 bold. label 은 판 머리의 13px semibold 한 줄.
export function Sunken({ label, prose = false, children }: { label?: string; prose?: boolean; children: ReactNode }) {
  return (
    <div
      className={`w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-left ${
        prose ? "text-[13px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text" : ""
      }`}
    >
      {label && <p className="pb-[6px] text-[13px] font-semibold text-staff-text-sub">{label}</p>}
      {children}
    </div>
  );
}

// 이름 · 값 줄. 13px, 이름은 보조 글자 · 값은 오른쪽 정렬, 줄 사이 옅은 선 · 위아래 9.
export function Values({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col divide-y divide-staff-border-light">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start gap-[12px] py-[9px] first:pt-0 last:pb-0">
          <dt className="shrink-0 text-[13px] font-medium text-staff-text-sub">{k}</dt>
          <dd className="min-w-0 flex-1 text-right text-[13px] text-staff-text">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
