import Image from "next/image";

// Figma Logo(node 9:279): 60px 칸에 고래(아래)와 별(왼쪽 위)을 겹치고, 아래에 WHALE ERP(28px bold)와
// FOR RESTAURANT&CAFE(13px medium)를 둔다. 사이 간격 8px.
export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-[8px]">
      <div className="relative size-[60px]">
        <Image src="/icons/logo-whale.svg" alt="" width={60.322} height={45.744} className="absolute top-[14.58px] left-0" />
        <Image src="/icons/logo-stars.svg" alt="" width={29.156} height={21.113} className="absolute top-0 left-[9.05px]" />
      </div>
      <p className="text-center leading-[1.5] text-staff-text">
        <span className="block text-[28px] font-bold tracking-[-0.08px]">WHALE ERP</span>
        <span className="block text-[13px] font-medium tracking-[-0.025em]">FOR RESTAURANT&amp;CAFE</span>
      </p>
    </div>
  );
}
