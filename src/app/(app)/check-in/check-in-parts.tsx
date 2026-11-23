import Image from "next/image";
import type { ReactNode } from "react";
import { MaskIcon } from "@/components/common";

// 출퇴근 화면 조각(데모 check-in 의 geoMap · geoBlank · siteCard · clock · sunken · values). 지도는 /design 견본(LocationMap)을
// 옮기고 반경 밖(out) 모양을 더했다 — 실제 지도가 아니라 그림이고, 좌표는 화면에 그리지 않는다. 화면의 지도는 kakao-map.tsx(카카오
// 지도)이고, 이 그림은 키가 없거나 SDK 를 불러오지 못할 때의 대체다. 지도에만 나오는 색이라
// 토큰으로 두지 않는다.
export function GeoMap({ tone, caption }: { tone: "in" | "out"; caption: string }) {
  const out = tone === "out";
  return (
    <div
      role="img"
      aria-label={`${out ? "매장 반경 밖의 내 위치" : "매장 반경 안의 내 위치"}. ${caption}`}
      className="relative h-[205px] w-full shrink-0 overflow-clip rounded-[18px] border border-[#e1ebec] bg-[#eef3f7] bg-[linear-gradient(#e1ebec_1px,transparent_1px),linear-gradient(90deg,#e1ebec_1px,transparent_1px)] bg-[size:44.64px_41.25px] bg-position-[-1px_-1px]"
    >
      <Image src="/icons/map-road-1.svg" alt="" width={164} height={205.5} className="absolute top-[-0.5px] left-[calc(50%-116px)]" />
      <Image src="/icons/map-road-2.svg" alt="" width={364} height={136.5} className="absolute top-[62.5px] left-[-1px] h-[136.5px] w-[calc(100%+6px)] max-w-none" />
      <div
        className={`absolute top-[36.5px] left-[calc(50%-27px)] size-[130px] rounded-full border border-dashed ${
          out ? "border-[#b6c1d5] bg-[rgba(182,193,213,0.12)]" : "border-[rgba(49,93,245,0.44)] bg-[rgba(49,93,245,0.07)]"
        }`}
      />
      <div className={`absolute top-[79.5px] left-[calc(50%+16px)] rounded-[14px] bg-white p-[12px] drop-shadow-[0_4px_8px_rgba(25,48,101,0.08)] ${out ? "opacity-60" : ""}`}>
        <span className="flex text-staff-primary"><MaskIcon src="/icons/store-line.svg" size={20} /></span>
      </div>
      {out ? (
        <div className="absolute top-[24px] left-[calc(50%+120px)] size-[15px] rounded-full border-2 border-white bg-[#f59e0b] shadow-[0_0_0_5px_rgba(245,158,11,0.22)]" />
      ) : (
        <div className="absolute top-[115.84px] left-[calc(50%+55.44px)] size-[15px] rounded-full border-2 border-white bg-staff-primary shadow-[0_0_0_5px_rgba(31,63,122,0.2)]" />
      )}
      <p className="absolute bottom-[13px] left-[13px] rounded-[8px] border border-[#e4e8ef] bg-white/93 px-[10px] py-[6px] text-[12px] leading-[1.5] text-staff-text-sub">
        {caption}
      </p>
    </div>
  );
}

/** 위치를 읽지 못하거나 읽지 않는 상태의 빈 지도 자리 */
export function GeoBlank({ tone, text }: { tone: "muted" | "warning" | "error"; text: string }) {
  const color = { muted: "text-staff-placeholder", warning: "text-staff-warning", error: "text-staff-error" }[tone];
  return (
    <div className="flex h-[205px] w-full shrink-0 flex-col items-center justify-center gap-[8px] rounded-[18px] border border-[#e1ebec] bg-[#eef3f7]">
      <span className={`flex ${color}`}>
        <MaskIcon src="/icons/pin.svg" size={30} flipY />
      </span>
      <p className="text-[12px] text-staff-text-muted">{text}</p>
    </div>
  );
}

/** 근무지 카드(Figma node 12:957): 연한 남보라 — 「지금 근무 중」 카드도 같은 판이다 */
export function SiteCard({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="flex items-center gap-[8px] rounded-[18px] border border-[#dce4ff] bg-[#eef2ff] p-[20px]">
      {/* 근무지 이름 앞 아이콘은 앱 전체 점포 아이콘(store-line)으로 하나(2026-11-23 사용자 지정 — 전엔 화면마다 위치 핀 · 채운 점포 등 달랐다) */}
      <span className="flex text-staff-primary"><MaskIcon src="/icons/store-line.svg" size={18} /></span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="truncate text-[16px] font-bold">{title}</p>
        {sub && <p className="text-[12px] text-staff-primary">{sub}</p>}
      </div>
    </section>
  );
}

/**
 * 큰 시계. center 면 본문의 남는 세로 공간 가운데에 선다(my-auto — 본문이 화면 높이를 채우는 flex 세로 열일 때) — 출퇴근 화면의
 * 현재 시각 · 근무 시간이 카드 바로 아래 붙고 버튼 줄까지 빈 곳이 크게 남아 가운데로 내렸다(2026-11-20 사용자 지정).
 */
export function Clock({
  label,
  children,
  note,
  dim = false,
  center = false,
}: {
  label: string;
  children: ReactNode;
  note?: string;
  dim?: boolean;
  center?: boolean;
}) {
  // center(출퇴근 화면의 현재 시각 · 근무 시간)는 큰 둥근 시계 판에 담는다 — 흰 원(220px) · 회색 테두리 · 안쪽 옅은 띠(2026-11-20 사용자 지정).
  return (
    <section
      className={
        center
          ? "mx-auto my-auto flex size-[220px] shrink-0 flex-col items-center justify-center gap-[8px] rounded-full border border-staff-border bg-white text-center shadow-[inset_0_0_0_10px_var(--color-staff-info-bg)]"
          : "flex flex-col items-center py-[14px] text-center"
      }
    >
      {/* 시계 아이콘(하단 메뉴 출퇴근과 같은 그림)을 이름 앞에 둔다(2026-11-20 사용자 지정) */}
      {/* 둥근 시계 안은 글자 크기를 세 가지로 줄였다 — 이름 14 · 숫자 40(단위 16) · 아래 14(2026-11-20 사용자 지정: 크기가 섞여 들쑥날쑥해 보였다) */}
      <h2 className={`flex items-center gap-[4px] font-semibold text-staff-text-sub ${center ? "text-[14px] leading-[1.3]" : "text-[13px]"}`}>
        {center ? (
          <span className={`flex ${dim ? "text-staff-placeholder" : "text-staff-primary"}`}>
            <MaskIcon src="/icons/nav-attendance.svg" size={15} />
          </span>
        ) : (
          <span className={`flex size-[24px] items-center justify-center rounded-full ${dim ? "bg-staff-bg text-staff-placeholder" : "bg-staff-primary-inactive text-staff-primary"}`}>
            <MaskIcon src="/icons/nav-attendance.svg" size={14} />
          </span>
        )}
        {label}
      </h2>
      <p
        className={`flex items-baseline justify-center font-bold tracking-[-0.02em] tabular-nums ${center ? "text-[40px] leading-[1.2]" : "pt-[4px] text-[44px] leading-[1.1]"} ${dim ? "text-staff-placeholder" : ""}`}
      >
        {children}
      </p>
      {note && <p className={`${center ? "text-[14px] leading-[1.3] text-staff-text-muted" : "pt-[4px] text-[12px] text-staff-text-sub"}`}>{note}</p>}
    </section>
  );
}

/** 들어간 판(데모 sunken). prose 면 13px 보조 글자 */
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

/** 이름 · 값 줄(데모 values) */
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
