// 필수 칸 표시(데모 join 의 라벨 끝 「*」). 별표는 화면 낭독기에 숨긴다 — 그대로 두면 「별표」로 읽힌다(재영 리뷰 #77).
// announce 면 「필수」로 읽힌다. 칸에 required 가 있으면 화면 낭독기가 이미 「필수」를 알리므로 announce 를 끈다.
export function RequiredMark({ announce = true }: { announce?: boolean }) {
  return (
    <>
      <span aria-hidden>*</span>
      {announce && <span className="sr-only"> 필수</span>}
    </>
  );
}
