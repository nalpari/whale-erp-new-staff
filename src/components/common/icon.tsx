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
