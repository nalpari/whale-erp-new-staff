"use client";

import { useEffect, useImperativeHandle, useRef, type PointerEvent, type Ref } from "react";
import { EASE_OUT } from "@/components/common/theme";
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

type Point = { x: number; y: number };

/**
 * 필기 서명란(CON-2, 데모 contract 의 sign · sign-drawn — 높이 190 · radius 12, 비면 점선 테두리 · 안내 글, 그리면 실선 흰 바탕).
 * 손가락 · 펜 · 마우스를 포인터 이벤트로 받고, touch-action: none 으로 그리는 동안 화면이 스크롤되지 않게 한다. 캔버스 해상도는
 * 화면 배율(devicePixelRatio)에 맞춰 선이 흐리지 않다.
 * 획은 점 목록(css px)으로 들고 있다 — 크기가 바뀌면(화면 돌림 · 스크롤바) 해상도를 다시 잡고 다시 그린다. 좁아지면 잘리지 않게 같은
 * 비율로 줄이고, 넓어지면 그대로 둔다(늘린 서명을 보내지 않게). 그래서 크기가 바뀌어도 서명이 지워지지 않는다.
 * 한 획씩 그린다(두 번째 손가락은 무시). 첫 획을 마치면 onDrawnChange(true), 지우면 false. 브라우저가 가로챈 획(pointercancel —
 * 시스템 제스처 · 전화 등)은 점 목록에서 빼고 다시 그려 잉크도 남기지 않는다 — 다음 획과 함께 날인되지 않게. 포인터 캡처만 풀려도
 * (lostpointercapture, up · cancel 없이) 그 획을 마쳐 서명란이 굳지 않게 한다. 탭 한 번의 점도 획으로 센다 — 이니셜 · 점 서명을
 * 막을 근거가 없고, 확정은 따로 한 번 더 누른다(CON-2).
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
  /** 마친 획들 */
  const strokes = useRef<Point[][]>([]);
  /** 긋는 중인 획 */
  const active = useRef<{ pointerId: number; points: Point[] } | null>(null);

  /** 캔버스를 비우고 마친 획(과 긋는 중인 획)을 다시 그린다. */
  const repaint = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const points of active.current ? [...strokes.current, active.current.points] : strokes.current) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      // 점 하나뿐이면 같은 자리로 그어 둥근 끝이 점으로 남는다
      for (const p of points.length > 1 ? points.slice(1) : points) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = 0;
    let height = 0;
    const setup = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if ((w === width && h === height) || w === 0 || h === 0) return;
      // 좁아지거나 낮아지면 그린 획을 같은 비율로 줄인다
      const shrink = width && height ? Math.min(1, w / width, h / height) : 1;
      if (shrink < 1)
        strokes.current = strokes.current.map((points) => points.map((p) => ({ x: p.x * shrink, y: p.y * shrink })));
      width = w;
      height = h;
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
      // 크기를 바꾸면 캔버스가 비워진다 — 마친 획을 다시 그린다(긋던 획은 버린다)
      active.current = null;
      repaint();
    };
    const observer = new ResizeObserver(setup);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokes.current = [];
      active.current = null;
      repaint();
      onDrawnChange(false);
    },
    toPng: () => canvasToPng(canvasRef.current!),
  }));

  const pointOf = (e: { clientX: number; clientY: number }, rect: DOMRect) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  /** 긋는 중인 획에 점을 더하고 그 마디만 그린다. */
  const extend = (to: Point) => {
    const ctx = canvasRef.current?.getContext("2d");
    const points = active.current?.points;
    if (!ctx || !points) return;
    const from = points.at(-1) ?? to;
    points.push(to);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || active.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    active.current = { pointerId: e.pointerId, points: [] };
    extend(pointOf(e, e.currentTarget.getBoundingClientRect())); // 눌렀다 떼기만 해도 점이 남는다
  };
  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.pointerId !== e.pointerId) return;
    // 빠르게 그을 때 브라우저가 묶어 보낸 중간 점까지 그려 선이 각지지 않게
    const rect = e.currentTarget.getBoundingClientRect();
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const c of events.length ? events : [e]) extend(pointOf(c, rect));
  };
  /** 획을 마친다 — 손을 뗐거나(up) 캡처가 풀렸다(lostpointercapture). */
  const handlePointerEnd = (e: PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.pointerId !== e.pointerId) return;
    strokes.current.push(active.current.points);
    active.current = null;
    onDrawnChange(true);
  };
  /** 가로챈 획은 버리고 다시 그린다 — 그 획의 잉크도 지운다. 그린 것으로 세지 않는다. */
  const handlePointerCancel = (e: PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.pointerId !== e.pointerId) return;
    active.current = null;
    repaint();
  };

  return (
    <div
      className={`relative h-[190px] w-full overflow-hidden rounded-[12px] border-[1.5px] transition-[background-color,border-color] duration-150 ${EASE_OUT} ${
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
        onLostPointerCapture={handlePointerEnd}
        onPointerCancel={handlePointerCancel}
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
