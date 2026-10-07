import Image from "next/image";

// Figma 04.출퇴근 지도(node 12:948)를 그림으로 흉내 낸 것. 목업이라 실제 지도·위치는 쓰지 않는다.
// 바탕 #EEF3F7 에 #E1EBEC 격자(약 44.6×41.2), 길 두 줄(SVG), 매장 반경 원(130px, 파란 점선),
// 매장 아이콘 칸, 내 위치 점(남보라 15px), 왼쪽 아래 오차 안내. 지도에만 나오는 색이라 토큰으로 두지 않는다.
export function LocationMap({ caption }: { caption: string }) {
  return (
    <div
      role="img"
      aria-label={`매장 반경 안의 내 위치. ${caption}`}
      className="relative h-[205px] w-full overflow-clip rounded-[18px] border border-[#e1ebec] bg-[#eef3f7] bg-[linear-gradient(#e1ebec_1px,transparent_1px),linear-gradient(90deg,#e1ebec_1px,transparent_1px)] bg-[size:44.64px_41.25px] bg-position-[-1px_-1px]"
    >
      {/* 지도 가운데(Figma 폭 358 의 179px)를 기준으로 놓아 폭이 바뀌어도 길·원·핀·점의 상대 위치가 Figma 와 같다.
          가로로 지나는 길은 SVG 가 비율을 고정하지 않아(preserveAspectRatio none) 지도 폭만큼 늘린다. */}
      <Image src="/icons/map-road-1.svg" alt="" width={164} height={205.5} className="absolute top-[-0.5px] left-[calc(50%-116px)]" />
      <Image src="/icons/map-road-2.svg" alt="" width={364} height={136.5} className="absolute top-[62.5px] left-[-1px] h-[136.5px] w-[calc(100%+6px)] max-w-none" />
      <div className="absolute top-[36.5px] left-[calc(50%-27px)] size-[130px] rounded-full border border-dashed border-[rgba(49,93,245,0.44)] bg-[rgba(49,93,245,0.07)]" />
      <div className="absolute top-[79.5px] left-[calc(50%+16px)] rounded-[14px] bg-white p-[12px] drop-shadow-[0_4px_8px_rgba(25,48,101,0.08)]">
        <Image src="/icons/store.svg" alt="" width={20} height={20} className="-scale-y-100" />
      </div>
      <div className="absolute top-[115.84px] left-[calc(50%+55.44px)] size-[15px] rounded-full border-2 border-white bg-staff-primary shadow-[0_0_0_5px_rgba(31,63,122,0.2)]" />
      <p className="absolute bottom-[13px] left-[13px] rounded-[8px] border border-[#e4e8ef] bg-white/93 px-[10px] py-[6px] text-[12px] leading-[1.5] text-staff-text-sub">
        {caption}
      </p>
    </div>
  );
}
