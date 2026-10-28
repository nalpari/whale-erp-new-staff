"use client";

import { useEffect, useImperativeHandle, useRef, type PointerEvent, type Ref } from "react";
import { SIGNATURE_TARGET_BYTES } from "@/lib/contract-actions";

export interface SignaturePadHandle {
  /** 그린 것을 지운다(「다시 그리기」). */
  clear: () => void;
  /** 그린 서명 PNG. 목표 크기(SIGNATURE_TARGET_BYTES)를 넘으면 가로 · 세로를 반씩 줄여 다시 만든다. */
  toPng: () => Promise<Blob>;
}

const LINE_WIDTH = 2.4;
/** api 의 서명 이미지 가로 · 세로 상한(SIGNATURE_MAX_PX)보다 넉넉히 작게 — 캔버스 해상도는 화면 배율을 따르되 여기서 멈춘다. */
const MAX_PX = 2048;

/**
 * 필기 서명란(CON-2, 데모 contract 의 sign · sign-drawn — 높이 190 · radius 12, 비면 점선 테두리 · 안내 글, 그리면 실선 흰 바탕).
 * 손가락 · 펜 · 마우스를 포인터 이벤트로 받고, touch-action: none 으로 그리는 동안 화면이 스크롤되지 않게 한다. 캔버스 해상도는
 * 화면 배율(devicePixelRatio)에 맞춰 선이 흐리지 않다. 폭이 바뀌면(화면 돌림) 해상도를 다시 맞추며 지운다 — 늘린 서명을 보내지 않게.
 * 한 획씩 그린다(두 번째 손가락은 무시). 첫 획을 마치면 onDrawnChange(true), 지우면 false.
 */
export function SignaturePad({
  ref,
  drawn,
  disabled = false,
  onDrawnChange,
}: {
  ref: Ref<SignaturePadHandle>;
  drawn: boolean;
  disabled?: boolean;
  onDrawnChange: (drawn: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stroke = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const onDrawnChangeRef = useRef(onDrawnChange);
  useEffect(() => {
    onDrawnChangeRef.current = onDrawnChange;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let size = "";
    const setup = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (`${w}x${h}` === size || w === 0 || h === 0) return;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PX / w, MAX_PX / h);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = getComputedStyle(canvas).color;
      // 처음이 아니면(폭이 바뀜) 해상도를 바꾸며 지워졌다
      if (size) onDrawnChangeRef.current(false);
      size = `${w}x${h}`;
    };
    const observer = new ResizeObserver(setup);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      // 배율 변환이 걸린 채라 픽셀 크기로 지우면 넉넉히 다 지워진다
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      stroke.current = null;
      onDrawnChangeRef.current(false);
    },
    toPng: () => canvasToPng(canvasRef.current!),
  }));

  const pointOf = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const lineTo = (to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext("2d");
    const from = stroke.current;
    if (!ctx || !from) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    stroke.current = { ...from, ...to };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || stroke.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointOf(e);
    stroke.current = { pointerId: e.pointerId, ...p };
    lineTo(p); // 눌렀다 떼기만 해도 점이 남는다
  };
  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (stroke.current?.pointerId !== e.pointerId) return;
    // 빠르게 그을 때 브라우저가 묶어 보낸 중간 점까지 그려 선이 각지지 않게
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const rect = e.currentTarget.getBoundingClientRect();
    if (events.length) for (const c of events) lineTo({ x: c.clientX - rect.left, y: c.clientY - rect.top });
    else lineTo(pointOf(e));
  };
  const handlePointerEnd = (e: PointerEvent<HTMLCanvasElement>) => {
    if (stroke.current?.pointerId !== e.pointerId) return;
    stroke.current = null;
    onDrawnChange(true);
  };

  return (
    <div
      className={`relative h-[190px] w-full overflow-hidden rounded-[12px] border-[1.5px] transition-[background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        drawn ? "border-solid border-staff-border-light bg-white" : "border-dashed border-staff-placeholder bg-staff-info-bg"
      }`}
    >
      {!drawn && (
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-staff-text-muted">
          여기에 서명해 주세요
        </span>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={drawn ? "서명란 · 서명함" : "서명란 · 비어 있음. 손가락으로 서명합니다"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative block size-full cursor-crosshair touch-none text-staff-text select-none"
      />
    </div>
  );
}

const blobOf = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("서명 이미지를 만들지 못했습니다"))), "image/png"),
  );

/** 캔버스 → PNG. 목표 크기를 넘으면 반씩 줄여 세 번까지 다시 만든다(손가락 서명은 보통 수십 KB 라 거의 일어나지 않는다). */
async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  let source = canvas;
  for (let attempt = 0; ; attempt++) {
    const blob = await blobOf(source);
    if (blob.size <= SIGNATURE_TARGET_BYTES || attempt === 3) return blob;
    const smaller = document.createElement("canvas");
    smaller.width = Math.max(1, Math.round(source.width / 2));
    smaller.height = Math.max(1, Math.round(source.height / 2));
    smaller.getContext("2d")?.drawImage(source, 0, 0, smaller.width, smaller.height);
    source = smaller;
  }
}
