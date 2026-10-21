// 토스트(데모 ui.mjs 의 toast 를 올린 것): 짙은 남색 90% · radius 12 · 13px semibold 흰 글자 · 화면 아래 120px 위.
// 떠오른 뒤 2초쯤 머물고 사라진다(globals.css 의 staff-toast). 상태를 들지 않으므로, 다시 띄우려면 쓰는 쪽이 key 를 바꿔 새로 붙인다.
// role="status" 라 화면 낭독기가 문구를 읽는다. 누를 것이 아니라 아래 화면을 막지 않는다(pointer-events-none).
export function Toast({ children }: { children: string }) {
  return (
    <p
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[120px] z-50 mx-auto w-fit max-w-[calc(100%-32px)] animate-[staff-toast_2.4s_ease-out_both] rounded-[12px] bg-staff-navy/90 px-[16px] py-[10px] text-center text-[13px] leading-[1.5] font-semibold text-white"
    >
      {children}
    </p>
  );
}
