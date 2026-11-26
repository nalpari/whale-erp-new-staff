"use client";

import { useEffect, useRef, type ReactNode, type TouchEvent } from "react";

// Figma 03.Sheet(node 12:670) 바텀시트. 네이티브 <dialog>(showModal)라 Esc·포커스 가두기·뒤 화면 막기를 브라우저가 맡는다.
// 흰 바탕 · 위 모서리 26 · 위로 그림자, 맨 위 40×4 손잡이(#DCE1E9), 제목 20px bold · 설명 14px 보조 글자 · 좌우 24.
// 뒤 화면은 #17253D 38% + 1.5px 흐림. 열 때 아래에서 올라오고(260ms) 닫을 때 더 빨리 내려간다(200ms).
// 움직임은 Web Animations(element.animate)로 준다 — CSS 만으로는(@starting-style · overlay) 닫힐 때 <dialog> 가 바로 사라지는
// 브라우저(Safari · 일부 웹뷰)가 있어 실기기에서 애니메이션이 없어 보였다(2026-11-26 실기기 확인). 닫을 때는 다 내려간 뒤에 close() 한다.
// 「동작 줄이기」를 켠 사람에게는 움직이지 않고 바로 열고 닫는다.
// 뒤 화면을 누르거나 Esc·닫기를 누르면 onClose 를 부른다. 열림 상태는 쓰는 쪽이 open 으로 들고 있다.
// 손잡이 · 제목 쪽(머리)을 잡고 아래로 끌면 따라 내려오고, 충분히 끌면 닫는다(덜 끌면 제자리로). 시트가 열린 동안은 뒤 화면이
// 스크롤되지 않게 문서 스크롤을 잠근다(2026-11-26 실기기 피드백 — 시트를 만지면 뒤 화면이 움직였다).
/** 닫힐 때 내려가는 시간(ms, 아래 slide() 의 down). 시트를 차례로 띄우는 쪽이 앞 시트가 다 내려간 뒤 다음을 열 때 쓴다. */
export const SHEET_CLOSE_MS = 200;

/** 머리를 이만큼(px) 넘게 끌면 닫는다. 덜 끌었어도 빠르게 튕기듯 내리면(DRAG_FLICK) 닫는다. */
const DRAG_CLOSE_PX = 80;
/** 빠르게 내린 것으로 보는 속도(px/ms)와 그때 필요한 최소 거리(px). */
const DRAG_FLICK = { speed: 0.5, minPx: 24 };

const FOCUSABLE = '[autofocus], button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  heading,
  description,
  closeLabel = "닫기",
  initialFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** 화면 낭독기가 읽는 시트 이름. heading 이 없으면 제목으로도 보인다. */
  title: string;
  /** 제목 위 작은 머리말(14px semibold 보조 글자) — 근무지 추가 요청 시트의 「새 근무지 초대」. */
  eyebrow?: string;
  /** 제목을 글자 대신 그릴 때(일부만 남보라로 칠하기 · 줄바꿈). 없으면 title 을 그대로 보인다. */
  heading?: ReactNode;
  /** 글자면 \n 에서 줄을 바꾼다. 굵게 할 곳은 <strong> 으로 넘긴다(데모 <b>). */
  description?: ReactNode;
  closeLabel?: string;
  /** "close" 면 열릴 때 첫 포커스를 닫기 버튼에 둔다 — 위험 동작 버튼이 먼저 포커스를 받아 엔터 한 번에 눌리는 것을 막는다(탈퇴 확인). 기본은 브라우저 동작. */
  initialFocus?: "close";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // 내려가는 중인 애니메이션 — 그사이 다시 열면 멈추고 그때 그려진 위치에서 다시 올린다.
  const closing = useRef<Animation[]>([]);
  // 올라오는 중인 애니메이션 — 그사이 닫으면 지금 그려진 위치에서 내려가게 한다.
  const opening = useRef<Animation[]>([]);
  // 머리를 끄는 중 — 시작 y · 시각, 지금까지 내린 거리
  const drag = useRef<{ startY: number; startAt: number; dy: number } | null>(null);
  // 이 시트가 문서 스크롤을 잠갔는지 — 닫힘 · 사라짐이 겹쳐도 한 번만 푼다.
  const locked = useRef(false);
  const lockScroll = () => {
    if (locked.current) return;
    locked.current = true;
    lockDocumentScroll();
  };
  const unlockScroll = () => {
    if (!locked.current) return;
    locked.current = false;
    unlockDocumentScroll();
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const still = reducedMotion();
    if (open) {
      const wasClosing = closing.current.length > 0;
      // 내려가던 중이면 취소하기 전에 지금 위치 · 배경 투명도를 읽어 둔다(맨 아래로 사라졌다 다시 오르지 않게).
      const from = wasClosing
        ? { translate: currentTranslate(dialog, "0 100%"), opacity: currentBackdropOpacity(closing.current, 0) }
        : undefined;
      closing.current.forEach((a) => a.cancel());
      closing.current = [];
      dialog.inert = false;
      dialog.style.translate = "";
      // 열려 있으면 늘 잠가 둔다(한 번만 잠그므로 여러 번 불러도 된다 — 개발 모드의 effect 재실행 뒤에도 풀린 채 남지 않게).
      lockScroll();
      if (dialog.open && !wasClosing) return;
      if (!dialog.open) {
        dialog.showModal();
        if (initialFocus === "close") closeRef.current?.focus();
      } else if (!dialog.contains(document.activeElement)) {
        // 내려가던 시트를 다시 열 때 — 닫히는 동안(inert) 빠진 포커스를 시트 안으로 되돌린다.
        const target = initialFocus === "close" ? closeRef.current : dialog.querySelector<HTMLElement>(FOCUSABLE);
        target?.focus();
      }
      if (!still) {
        try {
          opening.current = slide(dialog, "up", from);
        } catch (error) {
          // 움직이지 못해도 시트는 열려 있다.
          console.error("[bottom-sheet] 열림 애니메이션 실패", error);
        }
      }
      return;
    }
    if (!dialog.open || closing.current.length > 0) return;
    // 올라오던 중이면 지금 그려진 위치를 읽어 거기서부터 내린다(완전히 열린 자리로 튀었다가 내려가지 않게).
    const from = { translate: currentTranslate(dialog, "0 0"), opacity: currentBackdropOpacity(opening.current, 1) };
    opening.current.forEach((a) => a.cancel());
    opening.current = [];
    if (still) {
      dialog.style.translate = "";
      dialog.close();
      return unlockScroll();
    }
    let running: Animation[];
    try {
      running = slide(dialog, "down", from);
    } catch (error) {
      console.error("[bottom-sheet] 닫힘 애니메이션 실패", error);
      dialog.style.translate = "";
      dialog.close();
      return unlockScroll();
    }
    closing.current = running;
    // 내려가는 동안은 눌리지 않게 한다 — 내려가는 시트에서 근무지를 한 번 더 고르지 않게.
    dialog.inert = true;
    const finish = () => {
      // 그사이 다시 열었으면(열림 쪽에서 closing 을 비워 running 과 달라짐) 닫지 않는다.
      if (closing.current !== running) return;
      closing.current = [];
      dialog.close();
      unlockScroll();
      dialog.inert = false;
      dialog.style.translate = "";
      running.forEach((a) => a.cancel());
    };
    // 다 내려간 뒤에 닫는다. 애니메이션이 다른 까닭으로 취소되거나 끝나지 않아도 닫아, 시트가 열린 채 남지 않게 한다.
    const guard = setTimeout(finish, SHEET_CLOSE_MS + 150);
    void Promise.all(running.map((a) => a.finished))
      .then(finish, (error) => {
        if (closing.current === running) console.warn("[bottom-sheet] 닫힘 애니메이션이 취소됨", error);
        finish();
      })
      .finally(() => clearTimeout(guard));
  }, [open, initialFocus]);

  // 시트가 열린 채 화면이 사라지면(다른 화면으로 이동) 잠근 스크롤을 풀어 둔다.
  useEffect(() => () => unlockScroll(), []);

  // 머리 끌기. 아래로만 따라 내려가고(위로는 붙어 있음), 손을 떼면 닫거나 제자리로 돌아간다.
  const dragStart = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!open || e.touches.length !== 1 || !t) return;
    drag.current = { startY: t.clientY, startAt: performance.now(), dy: 0 };
  };
  const dragMove = (e: TouchEvent) => {
    const d = drag.current;
    const t = e.touches[0];
    const dialog = ref.current;
    if (!d || !t || !dialog) return;
    d.dy = Math.max(0, t.clientY - d.startY);
    dialog.style.translate = `0 ${d.dy}px`;
  };
  const dragEnd = () => {
    const d = drag.current;
    const dialog = ref.current;
    drag.current = null;
    if (!d || !dialog || d.dy === 0) return;
    const speed = d.dy / Math.max(1, performance.now() - d.startAt);
    if (d.dy > DRAG_CLOSE_PX || (d.dy > DRAG_FLICK.minPx && speed > DRAG_FLICK.speed)) {
      // 끈 자리에서 그대로 내려간다(닫힘 쪽이 지금 그려진 위치를 읽는다).
      onClose();
      return;
    }
    // 덜 끌었으면 제자리로 돌아간다.
    const from = dialog.style.translate;
    dialog.style.translate = "";
    if (!reducedMotion()) dialog.animate({ translate: [from, "0 0"] }, { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  };

  return (
    <dialog
      ref={ref}
      aria-label={title}
      // Esc 는 브라우저가 바로 닫지 않게 막고 onClose 로 넘겨, 열림 상태를 쓰는 쪽 한 곳에서만 바꾼다.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // 시트 안쪽은 아래 div 가 다 덮으므로, dialog 자신이 눌린 것은 뒤 화면(::backdrop)을 누른 것이다.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      // 내려가는 중(open 이 false)에는 안쪽 누름 · 제출을 막는다. inert 를 지원하지 않는 Safari · 웹뷰에서도 두 번 고르지 않게.
      onClickCapture={(e) => {
        if (open) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onSubmitCapture={(e) => {
        if (open) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgba(23,37,61,0.38)] backdrop:backdrop-blur-[1.5px]"
    >
      {/* overscroll-contain — 시트 안을 끝까지 스크롤해도 뒤 화면으로 스크롤이 넘어가지 않게 */}
      <div className="flex max-h-[90dvh] flex-col overflow-y-auto overscroll-contain rounded-t-[26px] bg-white px-[24px] pb-[max(22px,env(safe-area-inset-bottom))] leading-[1.5] text-staff-text shadow-[0_-8px_28px_rgba(22,25,28,0.16)]">
        {/* 머리(손잡이 · 제목 · 설명) — 잡고 아래로 끌면 닫힌다. touch-none 으로 끄는 동안 브라우저가 스크롤하지 않게 한다 */}
        <div className="-mx-[24px] flex touch-none flex-col px-[24px] pt-[12px]" onTouchStart={dragStart} onTouchMove={dragMove} onTouchEnd={dragEnd} onTouchCancel={dragEnd}>
          <span aria-hidden className="mx-auto h-[4px] w-[40px] shrink-0 rounded-[2px] bg-[#dce1e9]" />
          {eyebrow && <p className="pt-[25px] text-[14px] font-semibold text-staff-text-sub">{eyebrow}</p>}
          <h2 className={`${eyebrow ? "pt-[6px]" : "pt-[25px]"} text-[20px] font-bold break-keep`}>{heading ?? title}</h2>
          {description && (
            <p className="pt-[19px] text-[14px] whitespace-pre-line text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{description}</p>
          )}
        </div>
        <div className="flex flex-col gap-[13px] pt-[20px]">
          {children}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex min-h-[52px] items-center justify-center rounded-[14px] text-[15px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * 시트가 열린 동안 문서(뒤 화면) 스크롤을 잠근다. 시트가 여러 개 겹쳐 열릴 수 있어 센다 — 마지막 시트가 닫힐 때 원래대로 푼다.
 * iOS Safari · 웹뷰는 <dialog> 가 모달이어도 뒤 문서가 손가락에 따라 스크롤되어 html · body 를 함께 막는다.
 */
let scrollLocks = 0;
let savedOverflow: { html: string; body: string } | null = null;
function lockDocumentScroll() {
  if (scrollLocks++ > 0) return;
  const { documentElement: html, body } = document;
  savedOverflow = { html: html.style.overflow, body: body.style.overflow };
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
}
function unlockDocumentScroll() {
  if (scrollLocks === 0 || --scrollLocks > 0) return;
  const { documentElement: html, body } = document;
  html.style.overflow = savedOverflow?.html ?? "";
  body.style.overflow = savedOverflow?.body ?? "";
  savedOverflow = null;
  // 마지막 시트가 실제로 close() 됐다 — 기다리던 알림을 띄운다
  const waiting = afterClose.splice(0);
  waiting.forEach((fn) => fn());
}

const afterClose: (() => void)[] = [];
/**
 * 열린(또는 내려가는 중인) 바텀시트가 모두 실제로 close() 된 뒤에 [fn] 을 부른다. 열린 시트가 없으면 바로 부른다.
 * 시트를 닫으면서 띄우는 알림(토스트)은 이것으로 띄운다 — 모달 시트가 열려 있거나 내려가는 동안은 바깥이 inert 라 알림이 가려지고
 * 화면 낭독기가 놓친다. 고정 시간으로 기다리면 그사이 다른 시트를 열었을 때 알림이 새 시트 뒤에 깔린다(PR #100 리뷰).
 * 닫기(onClose → open=false)와 같은 틱에 불러도 된다 — 시트는 그다음 effect 에서야 닫히기 시작한다.
 */
export function afterSheetsClose(fn: () => void) {
  if (scrollLocks === 0) return fn();
  afterClose.push(fn);
}

/** 「동작 줄이기」 설정. 브라우저 밖(서버 렌더)에서는 부르지 않는다. */
function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 시트를 아래에서 올리거나(up, 260ms) 아래로 내린다(down, SHEET_CLOSE_MS). 뒤 화면(::backdrop)도 함께 흐려지고 걷힌다.
 * 내릴 때는 끝 모습을 붙잡아(fill) 두어, close() 하기 전 한 순간 제자리로 튀어 오르지 않게 한다.
 * ::backdrop 지정이 거부되거나(예외) 옵션을 모르는 브라우저(effect.pseudoElement 가 비어 있음)에서는 시트만 움직인다.
 * [from] 이 있으면(반대로 움직이던 중) 그때 그려진 위치 · 배경 투명도에서 시작한다.
 */
function slide(
  dialog: HTMLDialogElement,
  to: "up" | "down",
  from?: { translate: string; opacity: number },
): Animation[] {
  const up = to === "up";
  const start = from ?? (up ? { translate: "0 100%", opacity: 0 } : { translate: "0 0", opacity: 1 });
  const timing: KeyframeAnimationOptions = up
    ? { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
    : { duration: SHEET_CLOSE_MS, easing: "ease-in", fill: "forwards" };
  const moves = [dialog.animate({ translate: up ? [start.translate, "0 0"] : [start.translate, "0 100%"] }, timing)];
  try {
    const backdrop = dialog.animate({ opacity: up ? [start.opacity, 1] : [start.opacity, 0] }, { ...timing, pseudoElement: "::backdrop" });
    // pseudoElement 옵션을 모르는 브라우저는 예외 없이 시트 본체에 투명도를 건다 — 그때는 지우고 시트만 움직인다.
    if ((backdrop.effect as KeyframeEffect | null)?.pseudoElement === "::backdrop") moves.push(backdrop);
    else backdrop.cancel();
  } catch {
    // ::backdrop 지정을 거부한 브라우저 — 시트만 움직인다.
  }
  return moves;
}

/** 움직이던 배경 애니메이션의 지금 투명도(시작 · 끝 키프레임 사이를 easing 반영 진행값으로). 끝났거나 없으면 [fallback]. */
function currentBackdropOpacity(moving: Animation[], fallback: number): number {
  for (const a of moving) {
    const effect = a.effect as KeyframeEffect | null;
    if (effect?.pseudoElement !== "::backdrop") continue;
    const progress = effect.getComputedTiming().progress;
    const frames = effect.getKeyframes();
    const first = Number(frames[0]?.opacity);
    const last = Number(frames[frames.length - 1]?.opacity);
    if (typeof progress !== "number" || !Number.isFinite(first) || !Number.isFinite(last)) continue;
    return Math.min(1, Math.max(0, first + (last - first) * progress));
  }
  return fallback;
}

/** 지금 화면에 그려진 시트의 translate(애니메이션 중간값 포함). 읽지 못하면 [fallback], 움직임이 없으면 제자리("0 0"). */
function currentTranslate(dialog: HTMLDialogElement, fallback: string): string {
  const value = getComputedStyle(dialog).translate;
  if (!value) return fallback;
  return value === "none" ? "0 0" : value;
}

// 시트 안의 고르기 버튼(Figma node 12:677): 52px · radius 12 · 안 고른 줄 #E4E8EF 테두리 · 15px semibold 보조 글자.
// 고른 것은 체크 동그라미와 aria-pressed 로도 알린다(색만으로 말하지 않는다). disabled 면(보내는 중 등) 흐리게 하고 누르지 못한다.
// 고르기 시트의 한 줄. 왼쪽 정렬, 앞에 아이콘(근무지면 StoreMark)을 둘 수 있다.
// 고른 줄은 남색 테두리 · 옅은 회색 바탕 · 먹색 글자에 오른쪽 끝 남색 체크 동그라미 — 회색 체크 하나로는 고른 줄이 잘 안 보였다(2026-11-24 사용자 지정)
export function SheetOption({
  selected = false,
  disabled = false,
  onClick,
  icon,
  children,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[52px] items-center gap-[10px] rounded-[12px] border px-[14px] text-left text-[15px] font-semibold transition-colors duration-150 ease-out active:bg-staff-primary-inactive disabled:opacity-40 ${
        selected ? "border-staff-navy bg-staff-bg text-staff-text" : "border-[#e4e8ef] bg-white text-staff-text-sub"
      }`}
    >
      {icon}
      {/* 근무지 이름은 자르지 않고 줄을 바꾼다 — 비슷한 지점 이름이 잘리면 서로 갈리지 않는다 */}
      <span className="min-w-0 flex-1 py-[12px] break-keep">{children}</span>
      {selected && (
        <span aria-hidden className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-staff-navy text-white">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2 5 8.6l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
