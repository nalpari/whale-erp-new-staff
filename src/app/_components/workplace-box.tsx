import { MaskIcon } from "@/components/common";

/**
 * 한 근무지의 정보를 보이는 화면 맨 위의 근무지 상자(정돈 시안, 2026-11-20 사용자 지정) — 연보라 동그라미 점포 아이콘 ·
 * 「근무지」 · 점포명. 등록된 신고 정보 · 근로계약서 목록(내 근무지에서 들어온 경우)이 쓴다.
 */
export function WorkplaceBox({ name }: { name: string }) {
  return (
    // 테두리 · 바탕 없이 머리 글처럼 둔다 — 테두리 상자는 누르는 버튼처럼 보였다(2026-11-20 사용자 지정)
    <div className="flex items-center gap-[10px] px-[2px]">
      <span aria-hidden className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-staff-primary-inactive text-staff-primary">
        <MaskIcon src="/icons/store-line.svg" size={16} />
      </span>
      <p className="flex min-w-0 flex-col">
        <span className="text-[12px] text-staff-text-muted">근무지</span>
        <span className="truncate text-[16px] font-bold">{name}</span>
      </p>
    </div>
  );
}
