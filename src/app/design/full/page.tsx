import {
  Alarm,
  Field,
  ItemRow,
  Plate,
  QuietButton,
  SAMPLE_ITEMS,
  StartButton,
} from "../units";

// 유닛을 한 화면에 모두 올려 보는 임시 페이지. 동작은 없다.
export default function DesignFullPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10 sm:py-16">
      <div className="flex items-center justify-between border-b border-seam pb-4">
        <Plate>Whale ERP</Plate>
        <div className="flex items-center gap-5">
          <span className="font-sans text-sm text-plate-dim">관리자</span>
          <QuietButton>로그아웃</QuietButton>
        </div>
      </div>

      <div className="slot mt-10 flex items-center justify-between gap-6 px-5 py-5 sm:px-7">
        <h1 className="font-sans text-xl text-plate sm:text-2xl">품목</h1>
        <span className="lit font-mono text-4xl font-medium tabular-nums sm:text-5xl">
          {SAMPLE_ITEMS.length}
        </span>
      </div>

      <ul className="mt-12">
        {SAMPLE_ITEMS.map((item) => (
          <ItemRow key={item.sku} {...item} />
        ))}
        <li className="border-t border-seam" />
      </ul>

      <p className="mt-12 max-w-md border-t border-seam pt-8 font-sans leading-relaxed text-plate-dim">
        빈 상태: 등록된 품목이 없습니다. 품목이 등록되면 이 자리에 재고와 함께 표시됩니다.
      </p>

      <form className="mt-16 flex max-w-md flex-col gap-7">
        <Field id="f-email" label="이메일" type="email" />
        <Field id="f-password" label="비밀번호" type="password" />
        <Alarm>이메일 또는 비밀번호가 맞지 않습니다.</Alarm>
        <StartButton type="button">로그인</StartButton>
      </form>
    </main>
  );
}
