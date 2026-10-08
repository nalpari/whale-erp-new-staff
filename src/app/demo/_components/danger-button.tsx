import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { EASE_OUT } from "@/components/common/theme";

// 되돌리기 어려운 확정(로그아웃 · 거부 확정). 주 버튼과 같은 52px · radius 12 · 15px bold 에 오류색 바탕, 누르면 #dc2626.
// 공통 Button 에 없는 톤이다. href 를 주면 같은 모양의 링크.
const CLASS = `flex h-[52px] items-center justify-center rounded-[12px] bg-staff-error text-[15px] font-bold text-white transition-[background-color] duration-150 ${EASE_OUT} active:bg-[#dc2626]`;

type DangerButtonProps = { children: ReactNode } & (
  | { href: string; transitionTypes?: ComponentProps<typeof Link>["transitionTypes"] }
  | { href?: never; onClick: () => void }
);

export function DangerButton(props: DangerButtonProps) {
  if (props.href !== undefined) {
    return <Link href={props.href} transitionTypes={props.transitionTypes} className={CLASS}>{props.children}</Link>;
  }
  return (
    <button type="button" onClick={props.onClick} className={CLASS}>
      {props.children}
    </button>
  );
}
