import { MaskIcon } from "@/components/common";

// 아이콘 한 줄. 20px 칸의 16px 보조색 아이콘 · 제목 14px semibold · 설명 12px 보조 글자, 사이 12 · 위아래 8(첫 줄 위·끝 줄 아래는 0).
// 줄 사이 선은 감싸는 쪽이 divide 로 긋는다.
export function IconRow({ icon, title, sub, flipY = false }: { icon: string; title: string; sub: string; flipY?: boolean }) {
  return (
    <div className="flex items-center gap-[12px] py-[8px] text-left first:pt-0 last:pb-0">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={16} flipY={flipY} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[12px] text-staff-text-sub">{sub}</p>
      </div>
    </div>
  );
}
