import Link from "next/link";
import type { ReactNode } from "react";
import { MaskIcon } from "@/components/common";
import { PRESS } from "@/components/common/theme";

// 근무지 추가 확인(WHALEERP-144) 화면들 — 확인 · 목록 · 결과(done) — 이 같이 쓰는 본문 틀과 첫 제목. 서버 · 클라이언트 화면 모두에서 쓴다.
// 확인 · 완료 화면은 정돈 시안 C안(둥근 행형, 2026-11-20 사용자 지정)이다 — 큰 제목(근무지 이름만 남보라), 연회색 둥근 정보 행,
// 테두리 둥근 상자(모서리 16) 모양의 누르는 행. 하단 버튼(Dock)은 기존 네모 버튼 그대로다.

/** 본문 틀: 좌우 24 · 위 30 · 사이 16. */
export const BODY = "flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]";

/** 화면 첫 제목 + 설명(데모 lead). */
export function Lead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h2 className="text-[22px] font-bold">{title}</h2>
      <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{children}</p>
    </div>
  );
}

/** C안 큰 제목(24px) — 강조할 근무지 이름은 쓰는 쪽이 <Accent> 로 감싼다. 위에 작은 머리말, 아래 설명 한 줄을 둘 수 있다. */
export function BigTitle({ eyebrow, children, sub }: { eyebrow?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col break-keep">
      {eyebrow && <p className="mb-[8px] text-[14px] font-semibold text-staff-text-sub">{eyebrow}</p>}
      <h2 className="text-[24px] leading-[1.42] font-bold">{children}</h2>
      {sub && <p className="mt-[8px] text-[15px] text-staff-text-sub">{sub}</p>}
    </div>
  );
}

/** 제목 안에서 근무지 이름만 남보라(C안). 「남보라는 지금이다」 규칙의 예외 — DESIGN.md 에 적었다. */
export const Accent = ({ children }: { children: ReactNode }) => <span className="text-staff-primary">{children}</span>;

/** 동그라미 안 아이콘 칸(36px). */
function IconDot({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-[36px] shrink-0 items-center justify-center rounded-full ${muted ? "bg-staff-bg text-staff-placeholder" : "bg-white text-staff-primary"}`}
    >
      {children}
    </span>
  );
}

/** 정보 행 아이콘 — 공용 아이콘 파일이 없는 체크 · 엑스 · 시계는 여기서 그린다. 나머지는 public/icons 마스크. */
export type PillIcon = "store" | "contract" | "clock" | "check" | "close";
function Glyph({ icon }: { icon: PillIcon }) {
  if (icon === "store") return <MaskIcon src="/icons/store-line.svg" size={18} />;
  if (icon === "contract") return <MaskIcon src="/icons/doc-line.svg" size={18} />;
  const path = icon === "check" ? "M5 12.5l4.5 4.5L19 7.5" : icon === "close" ? "M6 6l12 12M18 6L6 18" : "M12 7.5V12l3 2";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icon === "clock" && <circle cx="12" cy="12" r="8.5" />}
      <path d={path} />
    </svg>
  );
}

/** 연회색 둥근 정보 행(C안): 아이콘 동그라미 · 이름(13px 흐림) · 값(15px semibold). 값 아래 덧붙임(sub)은 13px 보조 글자. */
export function InfoPill({ icon, label, children, sub }: { icon: PillIcon; label: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-h-[60px] items-center gap-[12px] rounded-[20px] border border-staff-border bg-staff-bg py-[12px] pr-[16px] pl-[12px]">
      <IconDot>
        <Glyph icon={icon} />
      </IconDot>
      <div className="flex min-w-0 flex-1 flex-col gap-[1px] break-keep">
        <span className="text-[13px] text-staff-text-muted">{label}</span>
        <span className="text-[15px] leading-[1.45] font-semibold">{children}</span>
        {sub && <span className="text-[13px] text-staff-text-sub">{sub}</span>}
      </div>
    </div>
  );
}

/** 테두리 둥근 상자 모양의 누르는 행(C안 — 알약형이었다가 모서리 16px 로, 2026-11-20 사용자 지정): 아이콘 동그라미 · 이름 · 설명 · 회색 꺾쇠 동그라미. */
export function ActionPill({ href, icon, label, sub }: { href: string; icon: PillIcon; label: string; sub?: string }) {
  return (
    <Link
      href={href}
      replace
      transitionTypes={["nav-forward"]}
      className={`flex min-h-[64px] items-center gap-[12px] rounded-[16px] border border-staff-border bg-white py-[10px] pr-[16px] pl-[12px] active:bg-staff-primary-inactive ${PRESS}`}
    >
      <span aria-hidden className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-staff-primary-inactive text-staff-primary">
        <Glyph icon={icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col break-keep">
        <span className="text-[16px] font-semibold">{label}</span>
        {sub && <span className="text-[13px] text-staff-text-muted">{sub}</span>}
      </span>
      {/* #e6e9ef — 공유되지 않는 정보의 흐린 동그라미, 이 자리에만 쓴다 */}
      <span aria-hidden className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[#e6e9ef] text-white">
        <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
      </span>
    </Link>
  );
}

/** 공유 여부 한 줄(C안): 체크 · 엑스 아이콘 · 굵은 이름 · 아래 보조 글자 값. */
export function ShareLine({ shared, title, children }: { shared: boolean; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-[10px] text-[14px] leading-[1.55] break-keep">
      <span aria-hidden className={`mt-[2px] flex shrink-0 ${shared ? "text-staff-primary" : "text-staff-placeholder"}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d={shared ? "M5 12.5l4.5 4.5L19 7.5" : "M6 6l12 12M18 6L6 18"} />
        </svg>
      </span>
      <p>
        <strong className="font-bold">{title}</strong>
        <br />
        <span className="text-staff-text-sub">{children}</span>
      </p>
    </div>
  );
}
