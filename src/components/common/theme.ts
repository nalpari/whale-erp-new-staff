// Whale ERP 공통 컴포넌트가 함께 쓰는 스타일 조각. 색·서체 토큰은 globals.css 의 erp-* 에 있다.

export const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";

// 입력칸. 모두 폭을 채우므로(w-full) 폭은 감싸는 요소로 정한다. 포커스 링 대신 테두리 색만 브랜드색으로 바꾼다.
// globals.css 의 포커스 링과 초록 캐럿이 레이어 밖 규칙이라 ! 로 눌러야 적용된다.
export const FIELD =
  "h-[34px] w-full rounded-[2px] border border-erp-field-line bg-white pl-[10px] text-[14px] text-erp-ink outline-none! caret-erp-ink! transition-[border-color] duration-150 ease-out placeholder:text-erp-ink focus:border-erp-brand";

// 콘솔 전체는 다크 계근대 테마라, ERP 화면은 ErpRoot 안에서만 밝은 테마로 뒤집는다.
// Tailwind v4 는 버튼에 pointer 커서를 주지 않으므로 누를 수 있는 요소를 여기서 한 번에 잡는다.
// 스크롤바 색도 globals.css 의 어두운 색(레이어 밖 규칙)을 ! 로 덮어 밝은 화면에 맞춘다.
export const ERP_THEME =
  "bg-white font-erp leading-[normal] tracking-[-0.025em] text-erp-ink scheme-light selection:bg-erp-brand selection:text-white [&_*:focus-visible]:outline-erp-brand! [&_:is(a[href],button:enabled,select:enabled,label:has(input:enabled),input[type=checkbox]:enabled)]:cursor-pointer [&_::-webkit-calendar-picker-indicator]:cursor-pointer [&_*]:[scrollbar-color:#cfd4da_transparent]!";
