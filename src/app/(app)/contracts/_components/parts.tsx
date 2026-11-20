import type { ReactNode } from "react";
import { MaskIcon, SubLine } from "@/components/common";

// 근로계약서 화면 조각. 데모 조각(docs/demo/src/ui.mjs)의 body detail · sunken · values · tiny 를 DESIGN.md 토큰으로 옮겼다.

/** 화면 틀: 머리줄 · 본문(데모 body detail — 좌우 22 · 위 22 · 사이 20). 데모 근로계약 화면에는 하단 메뉴가 없다. */
export function ContractFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col leading-[1.5]">
      {header}
      {/* 근로계약서 화면은 머리줄 아래 · 묶음 사이를 모두 12 로 좁혀 같게 둔다(2026-11-20 사용자 지정 — 20 은 흰 바탕에서 띄엄띄엄 보였다) */}
      <div className="flex flex-1 flex-col gap-[12px] px-[22px] pt-[12px] pb-[24px]">{children}</div>
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

/**
 * 근로계약서 상세 머리 요약(정돈 시안 ㉑, 2026-11-20 사용자 지정) — 근무지명 · 상태 배지, 아래 이름 · 값 줄(받은 날 · 서명 기한 또는 서명일).
 * 화면 제목이 「파트타이머 근로계약서」라 고용 형태는 되풀이하지 않는다. 기한이 7일 이내면 남은 날 꺾은선 줄을 강조색(#956013, CON-4)으로.
 */
export function ContractSummary({
  storeName,
  badge,
  rows,
  left,
  note,
}: {
  storeName: string;
  badge: ReactNode;
  /** 값이 없는 줄은 뺀다 */
  rows: [string, string | null | undefined][];
  /** 서명 기한 아래 남은 날(「5일 남음」) — urgent 면 강조색 */
  left?: { text: string; urgent: boolean };
  /** 받은 날 · 서명으로 말할 수 없는 단계의 한 줄(거절 · 만료 · 수정 요청 등) */
  note?: string | null;
}) {
  const shown = rows.filter(([, v]) => v);
  return (
    <section className="flex flex-col gap-[10px] rounded-[16px] border border-staff-border bg-white py-[16px] pr-[16px] pl-[18px]">
      {/* 점포 아이콘 없이 근무지명만. 길면 말줄임 없이 두 줄로 넘기고 배지는 첫 줄 높이에 둔다(2026-11-20 사용자 지정) */}
      <div className="flex items-start gap-[8px]">
        <h2 className="min-w-0 flex-1 text-[15px] leading-[1.45] font-bold break-keep">{storeName}</h2>
        {badge}
      </div>
      {(shown.length > 0 || note) && (
        <dl className="flex flex-col gap-[6px] text-[14px]">
          {shown.map(([label, value], i) => (
            <div key={label} className="flex flex-col gap-[2px]">
              <div className="flex gap-[12px]">
                <dt className="w-[76px] shrink-0 whitespace-nowrap text-staff-text-muted">{label}</dt>
                <dd className="min-w-0 flex-1 break-keep">{value}</dd>
              </div>
              {left && i === shown.length - 1 && (
                <div className="pl-[88px]">
                  <SubLine>
                    <span className={left.urgent ? "font-semibold text-[#956013]" : undefined}>{left.text}</span>
                  </SubLine>
                </div>
              )}
            </div>
          ))}
          {note && <p className="text-[13px] text-staff-text-muted">{note}</p>}
        </dl>
      )}
    </section>
  );
}

/**
 * 상세 아래 정보 묶음(정돈 시안, 2026-11-20 사용자 지정) — 묶음 이름(14 semibold 보조)은 상자 밖, 연회색 둥근 상자에 이름(104 흐림) · 값(왼쪽 정렬)
 * 줄. 전엔 오른쪽 정렬 값이라 긴 주소가 들쑥날쑥했다. 값이 없는 줄은 뺀다.
 */
export function InfoGroup({ title, rows }: { title: string; rows: [string, ReactNode | null | undefined][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <section className="flex flex-col gap-[8px]">
      <h2 className="px-[4px] text-[14px] font-semibold text-staff-text-sub">{title}</h2>
      <dl className="flex flex-col gap-[10px] rounded-[16px] border border-staff-border bg-staff-bg px-[18px] py-[16px]">
        {shown.map(([label, value]) => (
          // 줄 사이 선 없이 간격만(2026-11-20 사용자 지정)
          <div key={label} className="flex gap-[12px] text-[14px]">
            {/* 이름 칸은 가장 긴 「사업자등록번호」(7자)가 한 줄에 들어가는 104 · 줄바꿈 없음(2026-11-20 사용자 지정) */}
            <dt className="w-[104px] shrink-0 whitespace-nowrap text-staff-text-muted">{label}</dt>
            <dd className="min-w-0 flex-1 break-keep">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
