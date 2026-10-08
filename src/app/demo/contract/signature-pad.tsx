"use client";

import { useEffect, useRef, type PointerEvent } from "react";

// 필기 서명(CON-2)의 서명란. 손가락·펜·마우스로 실제로 그린다(pointer 이벤트, 그리는 동안 스크롤 막음 touch-none).
// 비어 있으면 점선 테두리와 안내 글, 그리면 실선 흰 바탕(목업 sign · sign-drawn). 높이 190 · radius 12.
// drawn 이 false 가 되면(다시 그리기) 지우고, 그린 적 없이 true 로 들어오면(상태 도구로 바로 sign-drawn) 목업의 견본 서명을 그린다.
// 첫 획을 마치면 onDraw 를 부른다. 선 색은 글자색(text-staff-text)을 읽는다.
// ponytail: 캔버스 해상도는 처음 그릴 때 한 번만 맞춘다. 화면 폭이 바뀌면 선이 늘어나 보이니, 필요하면 ResizeObserver 로 다시 맞춘다.
const SAMPLE =
  "M14 58c14-30 26-40 30-30s-12 40-4 38 22-44 30-40-6 34 2 34 18-26 24-24-2 20 6 20 14-14 22-14 10 10 20 8 30-10 44-12M60 72c40-4 90-6 150-8";

export function SignaturePad({ drawn, onDraw }: { drawn: boolean; onDraw: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inked = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(canvas).color;
  }, []);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    if (!drawn) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      inked.current = false;
    } else if (!inked.current) {
      // 목업 SVG(viewBox 240×90)를 220×82 로 가운데에 그린다.
      ctx.save();
      ctx.translate((canvas.clientWidth - 220) / 2, (canvas.clientHeight - 82) / 2);
      ctx.scale(220 / 240, 220 / 240);
      ctx.stroke(new Path2D(SAMPLE));
      ctx.restore();
      inked.current = true;
    }
  }, [drawn]);

  const pointOf = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const line = (to: { x: number; y: number }) => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = pointOf(e);
    line(last.current); // 눌렀다 떼기만 해도 점이 남는다
    inked.current = true;
  };
  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (last.current) line(pointOf(e));
  };
  const handlePointerUp = () => {
    if (!last.current) return;
    last.current = null;
    onDraw();
  };

  return (
    <div
      className={`relative h-[190px] w-full overflow-hidden rounded-[12px] border-[1.5px] transition-[background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        drawn ? "border-solid border-staff-border-light bg-white" : "border-dashed border-staff-placeholder bg-staff-info-bg"
      }`}
    >
      {!drawn && (
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-staff-text-muted">
          여기에 손가락으로 서명
        </span>
      )}
      <canvas
        ref={ref}
        role="img"
        aria-label={drawn ? "서명란 · 서명함" : "서명란 · 비어 있음. 손가락으로 서명합니다"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative block size-full cursor-crosshair touch-none text-staff-text"
      />
    </div>
  );
}
