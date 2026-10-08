import Image from "next/image";

// 같은 화면 안에서 앞 상태로 돌아가는 머리줄(근로계약 데모의 BackHeader 와 같다). PageHeader 와 같은 모양이지만 뒤로 가기가 링크가 아니라 상태 이동이다.
export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex min-h-[72px] w-full items-center gap-[20px] bg-white px-[22px] py-[14px]">
      <button type="button" onClick={onBack} aria-label="뒤로" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
        <Image src="/icons/back.svg" alt="" width={19} height={19} className="-scale-y-100" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[18px] leading-[1.5] font-bold">{title}</h1>
    </header>
  );
}
