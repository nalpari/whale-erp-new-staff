import Image from "next/image";

// Figma 05.출퇴근 현황 기간 이동 줄(node 12:1335): 왼쪽 「‹ 이전 주」 · 가운데 기간(16px bold) · 오른쪽 「다음 주 ›」.
// 버튼 글자 15px semibold 보조 글자, 화살표 24px, 최소 높이 44. 이전 칸이 남는 폭을 차지한다(Figma 그대로).
export function PeriodNav({
  label,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: {
  label: string;
  prevLabel: string;
  nextLabel: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const btn = "flex min-h-[44px] items-center text-[15px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:text-staff-text";
  return (
    <div className="flex w-full items-center gap-[8px] leading-[1.5]">
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onPrev} className={btn}>
          <Image src="/icons/chevron-left-24.svg" alt="" width={24} height={24} className="-scale-y-100" />
          {prevLabel}
        </button>
      </div>
      <p className="shrink-0 text-[16px] font-bold text-staff-text">{label}</p>
      <button type="button" onClick={onNext} className={`${btn} shrink-0 justify-end gap-[2px]`}>
        {nextLabel}
        <Image src="/icons/chevron-right-24.svg" alt="" width={24} height={24} className="-scale-y-100" />
      </button>
    </div>
  );
}
