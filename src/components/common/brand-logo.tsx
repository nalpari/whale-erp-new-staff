import Image from "next/image";

// Figma Logo(node 9:279): 60px 칸에 고래(아래)와 별(왼쪽 위)을 겹치고, 아래에 WHALE ERP 를 둔다. 사이 간격 8px.
// WHALE ERP 는 키 메시지보다 덜 띄게 16px bold 보조 글자색(2026-11-25 사용자 지정, Figma 는 28px).
// 그 아래 로그인 화면 키 메시지(20px bold 먹색) · 보조 문구(13px 흐림) — 직원 입장에서 사장님과 나를 잇는 앱이라고 말한다
// (2026-11-25 사용자 지정, 전엔 사장님 쪽 말인 「FOR RESTAURANT&CAFE」).
export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-[8px]">
      <div className="relative size-[60px]">
        <Image src="/icons/logo-whale.svg" alt="" width={60.322} height={45.744} className="absolute top-[14.58px] left-0" />
        <Image src="/icons/logo-stars.svg" alt="" width={29.156} height={21.113} className="absolute top-0 left-[9.05px]" />
      </div>
      <p className="text-center text-[16px] leading-[1.5] font-bold text-staff-text-sub">WHALE ERP</p>
      <div className="flex flex-col items-center gap-[4px] pt-[4px] text-center leading-[1.5] break-keep">
        <p className="text-[20px] font-bold text-staff-text">사장님과 나를 잇는 근무 앱</p>
        <p className="text-[13px] text-staff-text-muted">근로계약 · 근무스케줄 · 급여명세서를 앱으로 받아 보세요</p>
      </div>
    </div>
  );
}
