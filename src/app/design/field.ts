// 입력칸 공통 스타일. 서버(units.tsx)와 클라이언트(interactive.tsx) 양쪽에서 쓰려고 따로 둔다.
// 포커스 링 대신 테두리 색만 브랜드색으로 바꾼다. globals.css 의 포커스 링과 초록 캐럿이 레이어 밖 규칙이라
// 여기서는 ! 로 눌러야 적용된다.
export const FIELD =
  "h-[34px] w-full rounded-[2px] border border-erp-field-line bg-white pl-[10px] text-[14px] text-erp-ink outline-none! caret-erp-ink! transition-[border-color] duration-150 ease-out placeholder:text-erp-ink focus:border-erp-brand";
