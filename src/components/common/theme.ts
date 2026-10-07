// 직원앱 공통 컴포넌트가 함께 쓰는 스타일 조각. 색·서체 토큰은 globals.css 의 staff-* 에 있다.
// Figma 에 한 번만 나오는 색(배지 바탕·글자 등)은 토큰으로 두지 않고 쓰는 곳에 직접 적는다.

export const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";

// 누를 때는 바탕색만 바꾼다. 크기를 줄이면 글자가 움직여 보여서 쓰지 않는다.
export const PRESS = `transition-[background-color,border-color,color] duration-150 ${EASE_OUT} disabled:pointer-events-none disabled:opacity-40`;

// 입력칸. 폭을 채우므로(w-full) 폭은 감싸는 요소로 정한다. 포커스 링 대신 테두리 색만 바꾼다.
export const FIELD =
  "h-[52px] w-full rounded-[12px] border border-staff-border bg-white px-[14px] text-[16px] text-staff-text outline-none! transition-[border-color] duration-150 ease-out placeholder:text-staff-placeholder focus:border-staff-primary aria-invalid:border-staff-error";

// 루트 globals.css 는 계근대(다크) 월드라, 직원앱 화면은 StaffRoot 안에서 밝은 테마로 고정한다.
// 전역의 초록 포커스 링·캐럿·다크 자동완성 바탕을 여기서 직원앱 색으로 덮는다.
export const STAFF_THEME =
  "bg-staff-bg font-staff leading-normal text-staff-text scheme-light antialiased selection:bg-staff-primary selection:text-white [&_*:focus-visible]:outline-staff-primary [&_:is(input,textarea)]:caret-staff-primary! [&_input:-webkit-autofill]:shadow-[0_0_0_100px_white_inset] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--color-staff-text)] [&_:is(a[href],button:enabled,label:has(input:enabled))]:cursor-pointer";
