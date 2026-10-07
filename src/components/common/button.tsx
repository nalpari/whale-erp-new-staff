import Link from "next/link";
import type { ComponentProps } from "react";
import { PRESS } from "./theme";

const TONE = {
  // Figma PrimaryBtn: h52 · radius 12 · 브랜드 바탕 · 흰 글자 15px bold
  // 누를 때 남보라를 한 단계 진하게(#3e3fc6). Figma 에 없는 상태라 토큰으로 두지 않는다.
  primary: "h-[52px] rounded-[12px] bg-staff-primary text-[15px] font-bold text-white active:bg-[#3e3fc6]",
  // Figma GhostBtn: h52 · radius 14 · 바탕 없음 · 보조 글자 15px bold
  ghost: "h-[52px] rounded-[14px] text-[15px] font-bold text-staff-text-sub active:bg-staff-primary-inactive",
  // Figma OutlineBtn: h44 · radius 12 · #DBE1EB 테두리 · 기본 글자 14px semibold
  outline:
    "h-[44px] rounded-[12px] border border-staff-border bg-white text-[14px] font-semibold text-staff-text active:bg-staff-primary-inactive",
};

export type ButtonVariant = keyof typeof TONE;

const SHELL = `inline-flex w-full items-center justify-center gap-[8px] px-[18px] whitespace-nowrap ${PRESS}`;

// href 를 주면 링크, 없으면 버튼이다. 둘을 하나의 props 로 두면 <Button href disabled> 가 눌리는 링크가 된다.
type ButtonProps = { variant?: ButtonVariant } & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: never } & Omit<ComponentProps<"button">, "className">)
);

// 모바일 화면이라 폭은 늘 채운다(w-full). 좁히려면 감싸는 요소의 폭을 줄인다.
// 아이콘은 children 에 글자 앞에 둔다(간격 8px).
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant = "primary", ...rest } = props;
    return <Link {...rest} className={`${SHELL} ${TONE[variant]}`} />;
  }
  const { variant = "primary", type = "button", ...rest } = props;
  return <button {...rest} type={type} className={`${SHELL} ${TONE[variant]}`} />;
}
