import Link from "next/link";
import type { ComponentProps } from "react";
import { EASE_OUT } from "./theme";

// 되돌리기 어려운 확정(로그아웃). 주 버튼과 같은 52px · radius 12 · 15px bold 에 오류색 바탕, 누르면 #dc2626.
// Button 처럼 href 를 주면 링크, 없으면 버튼이다(폼 제출은 type="submit").
const CLASS = `flex h-[52px] w-full items-center justify-center rounded-[12px] bg-staff-error text-[15px] font-bold text-white transition-[background-color] duration-150 ${EASE_OUT} active:bg-[#dc2626] disabled:pointer-events-none disabled:opacity-40`;

type DangerButtonProps =
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: never } & Omit<ComponentProps<"button">, "className">);

export function DangerButton(props: DangerButtonProps) {
  if (props.href !== undefined) return <Link {...props} className={CLASS} />;
  const { type = "button", ...rest } = props;
  return <button {...rest} type={type} className={CLASS} />;
}
