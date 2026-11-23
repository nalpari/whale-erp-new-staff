// public/icons 의 SVG 를 마스크로 써서 글자색(currentColor)을 따르게 한다.
// 하단 메뉴처럼 상태에 따라 색이 바뀌는 아이콘에 쓴다. 색이 고정인 아이콘은 next/image 로 그대로 둔다.
// flipY: Figma 가 위아래를 뒤집어 내보낸 아이콘(-scale-y-100 으로 놓인 것)을 바로 세운다.
export function MaskIcon({ src, size, flipY = false }: { src: string; size: number; flipY?: boolean }) {
  return (
    <span
      aria-hidden
      className={`shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${flipY ? "-scale-y-100" : ""}`}
      style={{ width: size, height: size, maskImage: `url(${src})` }}
    />
  );
}

// 바탕까지 그려진 menu-*.svg(연한 보라 둥근 바탕 · 브랜드색 그림)와 같은 모양에 선 아이콘(public/icons/*-line.svg)을 얹는다.
// 근로계약서 · 급여명세서 · 신고 정보는 앱 어디서나 「내 정보 › 내 근무지」의 선 아이콘으로 보인다(2026-11-23 사용자 지정).
// #eef2ff 는 menu-*.svg 의 둥근 바탕과 같은 값이라 토큰으로 두지 않는다. 모서리는 그 그림처럼 한 변의 1/3.
export function IconTile({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center bg-[#eef2ff] text-staff-primary"
      style={{ width: size, height: size, borderRadius: size / 3 }}
    >
      <MaskIcon src={src} size={Math.round(size * 0.6)} />
    </span>
  );
}
