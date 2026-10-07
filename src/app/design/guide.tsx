import Link from "next/link";
import type { ReactNode } from "react";

// 화면 목업 링크. 목업을 하나 만들 때마다 여기에 한 줄 더하고, page.tsx SCREENS 의 mockup 도 채운다.
// 목업은 design/(mockup)/ 아래에 두고 인증 없이 UI 만 보여 준다.
export const MOCKUP_LINKS = [
  { href: "/design/login", label: "로그인", node: "3:1965" },
  { href: "/design/home", label: "홈", node: "8:3" },
  { href: "/design/check-in", label: "출퇴근 (GPS)", node: "12:756" },
];

// 가이드 맨 위 목업 표: 화면 · 경로 · Figma 노드. 줄 전체가 아니라 화면 이름이 링크다.
export function MockupLinks() {
  return (
    <nav aria-label="화면 목업" className="pb-[32px]">
      <h2 className="pb-[12px] text-[12px] font-semibold tracking-[0.1em] text-staff-text-muted uppercase">Mockups</h2>
      <div className="overflow-x-auto rounded-[12px] border border-staff-border-light bg-white">
        <table className="w-full min-w-[420px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-staff-border-light text-staff-text-muted">
              <th className="px-[16px] py-[12px] font-semibold">화면</th>
              <th className="px-[16px] py-[12px] font-semibold">경로</th>
              <th className="px-[16px] py-[12px] font-semibold">Figma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-staff-border-light">
            {MOCKUP_LINKS.map((m) => (
              <tr key={m.href}>
                <td className="px-[16px] py-[12px]">
                  <Link href={m.href} className="font-semibold text-staff-primary hover:underline">
                    {m.label} →
                  </Link>
                </td>
                <td className="px-[16px] py-[12px] font-staff-code text-staff-text-sub">{m.href}</td>
                <td className="px-[16px] py-[12px]">
                  <a
                    href={`https://www.figma.com/design/fTjUhrEgrf4HG1G3dCXjpY/?node-id=${m.node.replace(":", "-")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-staff-code text-staff-text-sub hover:text-staff-primary hover:underline"
                  >
                    {m.node}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </nav>
  );
}

// 디자인 가이드 화면에서만 쓰는 조각. 앱 화면에는 쓰지 않으므로 components/common 에 두지 않는다.

export function GuideSection({
  title,
  id,
  first = false,
  children,
}: {
  title: string;
  id?: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={first ? "pt-[48px]" : "pt-[64px]"}>
      <h2 className="border-b border-staff-border pb-[12px] text-[22px] leading-[1.5] font-bold">{title}</h2>
      {children}
    </section>
  );
}

// 묶음 제목(Figma Heading 3): 13px semibold 대문자, 자간 0.1em.
export function GuideLabel({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return (
    <h3 className={`font-semibold text-staff-text-muted uppercase ${small ? "text-[12px] tracking-[0.1em]" : "text-[13px] tracking-[0.1em]"}`}>
      {children}
    </h3>
  );
}

// 흰 칸(Figma App 카드): #EFF2F6 테두리 · radius 12.
export function GuideBox({ children, padding = "p-[20px]" }: { children: ReactNode; padding?: string }) {
  return <div className={`rounded-[12px] border border-staff-border-light bg-white ${padding}`}>{children}</div>;
}

export function GuideCaption({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-[1.5] text-staff-text-muted">{children}</p>;
}

// "Default: …" 처럼 굵은 머리말 + 설명 한 줄.
export function GuideSpec({ name, children }: { name: string; children: ReactNode }) {
  return (
    <p className="text-[12px] text-staff-text-muted">
      <b className="font-bold">{name}:</b> {children}
    </p>
  );
}

export type Swatch = { name: string; hex: string; usage: string; dark?: boolean };

// 색 견본(Figma Swatch): 80px 색면 + 왼쪽 아래 HEX 칩 + 이름·쓰임.
export function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-[12px] pt-[16px] sm:grid-cols-4">
      {items.map((s) => (
        <div key={s.name} className="overflow-clip rounded-[12px] border border-staff-border bg-white">
          <div className="flex h-[80px] items-end p-[12px]" style={{ backgroundColor: s.hex }}>
            <span
              className={`rounded-[4px] px-[6px] py-[2px] font-staff-code text-[11px] font-bold ${
                s.dark ? "bg-white/20 text-white" : "bg-black/8 text-staff-text"
              }`}
            >
              {s.hex.toUpperCase()}
            </span>
          </div>
          <div className="px-[12px] py-[10px]">
            <p className="text-[13px] font-semibold">{s.name}</p>
            <p className="pt-[2px] text-[11px] leading-[1.25] text-staff-text-muted">{s.usage}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
