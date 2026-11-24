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

// 둥근 네모 바탕에 선 아이콘(public/icons/*-line.svg). 바탕은 옅은 회색 · 아이콘은 보조 글자색 — 보라 아이콘은 쓰지 않는다(2026-11-24 사용자 지정).
// 근로계약서 · 급여명세서 · 신고 정보는 앱 어디서나 「내 정보 › 내 근무지」의 선 아이콘으로 보인다(2026-11-23 사용자 지정).
// 모서리는 한 변의 1/3.
export function IconTile({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center bg-staff-bg text-staff-text-sub"
      style={{ width: size, height: size, borderRadius: size / 3 }}
    >
      <MaskIcon src={src} size={Math.round(size * 0.6)} />
    </span>
  );
}
