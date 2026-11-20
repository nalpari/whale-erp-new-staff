import { MaskIcon } from "@/components/common";

/**
 * 한 근무지의 정보를 보이는 화면 맨 위의 근무지 상자(정돈 시안, 2026-11-20 사용자 지정) — 흰 상자 · 연보라 동그라미 점포 아이콘 ·
 * 「근무지」 · 점포명. 등록된 신고 정보 · 근로계약서 목록(내 근무지에서 들어온 경우)이 쓴다.
 */
export function WorkplaceBox({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-[12px] rounded-[16px] border border-staff-border bg-white py-[12px] pr-[16px] pl-[12px]">
      <span aria-hidden className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-staff-primary-inactive text-staff-primary">
        <MaskIcon src="/icons/store-small.svg" size={18} />
      </span>
      <p className="flex min-w-0 flex-col">
        <span className="text-[12px] text-staff-text-muted">근무지</span>
        <span className="truncate text-[16px] font-bold">{name}</span>
      </p>
    </div>
  );
}
