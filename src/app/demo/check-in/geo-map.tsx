import Image from "next/image";
import { MaskIcon } from "@/components/common";

// 출퇴근 등록의 가짜 지도. Figma 04.출퇴근 지도(node 12:948, /design/check-in 의 LocationMap)와 같은 그림이고, 실제 지도·위치는 쓰지 않는다.
// 목업(docs/mockup/app/attendance.html .geo)의 세 모양을 더했다 — Figma 에 있는 것은 in 뿐이라 out·vague 는 DESIGN.md 기준 초안이다.
//   in    — 근무지 반경 안(Figma 그대로): 남보라 점선 원 안에 내 위치 점
//   out   — 반경 밖: 원을 회색 점선으로 낮추고 내 위치 점을 원 밖 오른쪽 위에 경고색(#F59E0B)으로
//   vague — 위치 흐림: 내 위치 점을 가운데 둔 오차 원(경고색 옅은 판)이 반경 원보다 넓다
// 지도에만 나오는 색이라 토큰으로 두지 않는다.
export function GeoMap({ tone, caption }: { tone: "in" | "out" | "vague"; caption: string }) {
  const label = { in: "매장 반경 안의 내 위치", out: "매장 반경 밖의 내 위치", vague: "오차가 반경보다 넓은 내 위치" }[tone];
  return (
    <div
      role="img"
      aria-label={`${label}. ${caption}`}
      className="relative h-[205px] w-full shrink-0 overflow-clip rounded-[18px] border border-[#e1ebec] bg-[#eef3f7] bg-[linear-gradient(#e1ebec_1px,transparent_1px),linear-gradient(90deg,#e1ebec_1px,transparent_1px)] bg-[size:44.64px_41.25px] bg-position-[-1px_-1px]"
    >
      <Image src="/icons/map-road-1.svg" alt="" width={164} height={205.5} className="absolute top-[-0.5px] left-[calc(50%-116px)]" />
      <Image src="/icons/map-road-2.svg" alt="" width={364} height={136.5} className="absolute top-[62.5px] left-[-1px] h-[136.5px] w-[calc(100%+6px)] max-w-none" />
      <div
        className={`absolute top-[36.5px] left-[calc(50%-27px)] size-[130px] rounded-full border border-dashed ${
          tone === "out" ? "border-[#b6c1d5] bg-[rgba(182,193,213,0.12)]" : "border-[rgba(49,93,245,0.44)] bg-[rgba(49,93,245,0.07)]"
        }`}
      />
      {tone === "vague" && (
        <div className="absolute top-[3px] left-[calc(50%-57px)] size-[240px] rounded-full border border-dashed border-[rgba(245,158,11,0.55)] bg-[rgba(245,158,11,0.12)]" />
      )}
      <div
        className={`absolute top-[79.5px] left-[calc(50%+16px)] rounded-[14px] bg-white p-[12px] drop-shadow-[0_4px_8px_rgba(25,48,101,0.08)] ${tone === "out" ? "opacity-60" : ""}`}
      >
        <Image src="/icons/store.svg" alt="" width={20} height={20} className="-scale-y-100" />
      </div>
      {tone === "in" && (
        <div className="absolute top-[115.84px] left-[calc(50%+55.44px)] size-[15px] rounded-full border-2 border-white bg-staff-primary shadow-[0_0_0_5px_rgba(31,63,122,0.2)]" />
      )}
      {tone === "out" && (
        <div className="absolute top-[24px] left-[calc(50%+120px)] size-[15px] rounded-full border-2 border-white bg-[#f59e0b] shadow-[0_0_0_5px_rgba(245,158,11,0.22)]" />
      )}
      {tone === "vague" && (
        <div className="absolute top-[115.84px] left-[calc(50%+55.44px)] size-[15px] rounded-full border-2 border-white bg-[#f59e0b]/70" />
      )}
      <p className="absolute bottom-[13px] left-[13px] rounded-[8px] border border-[#e4e8ef] bg-white/93 px-[10px] py-[6px] text-[12px] leading-[1.5] text-staff-text-sub">
        {caption}
      </p>
    </div>
  );
}

// 위치를 읽지 못하거나 읽지 않는 상태(권한 꺼짐 · 위치 조작 감지 · 일시 중지 · 동의 없음)의 빈 지도 자리.
// 격자를 지우고 가운데에 아이콘과 한 줄만 둔다(목업 .geo 의 background-image: none). 아이콘 색은 쓰는 쪽이 글자색으로 정한다.
export function GeoBlank({ icon, iconClass, children }: { icon: string; iconClass: string; children: string }) {
  return (
    <div className="flex h-[205px] w-full shrink-0 flex-col items-center justify-center gap-[8px] rounded-[18px] border border-[#e1ebec] bg-[#eef3f7]">
      <span className={`flex ${iconClass}`}>
        <MaskIcon src={icon} size={30} flipY />
      </span>
      <p className="text-[12px] text-staff-text-muted">{children}</p>
    </div>
  );
}
