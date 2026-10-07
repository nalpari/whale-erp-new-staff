// public/icons 의 SVG 를 마스크로 써서 글자색(currentColor)을 따르게 한다.
// 하단 메뉴처럼 상태에 따라 색이 바뀌는 아이콘에 쓴다. 색이 고정인 아이콘은 next/image 로 그대로 둔다.
export function MaskIcon({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden
      className="shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
      style={{ width: size, height: size, maskImage: `url(${src})` }}
    />
  );
}
