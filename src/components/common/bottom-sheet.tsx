"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Figma 03.Sheet(node 12:670) 바텀시트. 네이티브 <dialog>(showModal)라 Esc·포커스 가두기·뒤 화면 막기를 브라우저가 맡는다.
// 흰 바탕 · 위 모서리 26 · 위로 그림자, 맨 위 40×4 손잡이(#DCE1E9), 제목 20px bold · 설명 14px 보조 글자 · 좌우 24.
// 뒤 화면은 #17253D 38% + 1.5px 흐림. 열 때 아래에서 올라오고(260ms) 닫을 때 더 빨리 내려간다(200ms).
// 움직임은 Web Animations(element.animate)로 준다 — CSS 만으로는(@starting-style · overlay) 닫힐 때 <dialog> 가 바로 사라지는
// 브라우저(Safari · 일부 웹뷰)가 있어 실기기에서 애니메이션이 없어 보였다(2026-11-26 실기기 확인). 닫을 때는 다 내려간 뒤에 close() 한다.
// 「동작 줄이기」를 켠 사람에게는 움직이지 않고 바로 열고 닫는다.
// 뒤 화면을 누르거나 Esc·닫기를 누르면 onClose 를 부른다. 열림 상태는 쓰는 쪽이 open 으로 들고 있다.
/** 닫힐 때 내려가는 시간(ms, 아래 slide() 의 down). 시트를 차례로 띄우는 쪽이 앞 시트가 다 내려간 뒤 다음을 열 때 쓴다. */
export const SHEET_CLOSE_MS = 200;

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
  // 내려가는 중인 애니메이션 — 그사이 다시 열면 멈추고 아래에서 다시 올린다.
  const closing = useRef<Animation[]>([]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const still = reducedMotion();
    if (open) {
      const wasClosing = closing.current.length > 0;
      closing.current.forEach((a) => a.cancel());
      closing.current = [];
      dialog.inert = false;
      if (dialog.open && !wasClosing) return;
      if (!dialog.open) {
        dialog.showModal();
        if (initialFocus === "close") closeRef.current?.focus();
      }
      if (!still) {
        try {
          slide(dialog, "up");
        } catch (error) {
          // 움직이지 못해도 시트는 열려 있다.
          console.error("[bottom-sheet] 열림 애니메이션 실패", error);
        }
      }
      return;
    }
    if (!dialog.open || closing.current.length > 0) return;
    if (still) return dialog.close();
    let running: Animation[];
    try {
      running = slide(dialog, "down");
    } catch (error) {
      console.error("[bottom-sheet] 닫힘 애니메이션 실패", error);
      return dialog.close();
    }
    closing.current = running;
    // 내려가는 동안은 눌리지 않게 한다 — 내려가는 시트에서 근무지를 한 번 더 고르지 않게.
    dialog.inert = true;
    const finish = () => {
      // 그사이 다시 열었으면(열림 쪽에서 closing 을 비워 running 과 달라짐) 닫지 않는다.
      if (closing.current !== running) return;
      closing.current = [];
      dialog.close();
      dialog.inert = false;
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
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgba(23,37,61,0.38)] backdrop:backdrop-blur-[1.5px]"
    >
      <div className="flex max-h-[90dvh] flex-col overflow-y-auto rounded-t-[26px] bg-white px-[24px] pt-[12px] pb-[max(22px,env(safe-area-inset-bottom))] leading-[1.5] text-staff-text shadow-[0_-8px_28px_rgba(22,25,28,0.16)]">
        <span aria-hidden className="mx-auto h-[4px] w-[40px] shrink-0 rounded-[2px] bg-[#dce1e9]" />
        {eyebrow && <p className="pt-[25px] text-[14px] font-semibold text-staff-text-sub">{eyebrow}</p>}
        <h2 className={`${eyebrow ? "pt-[6px]" : "pt-[25px]"} text-[20px] font-bold break-keep`}>{heading ?? title}</h2>
        {description && (
          <p className="pt-[19px] text-[14px] whitespace-pre-line text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{description}</p>
        )}
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

/** 「동작 줄이기」 설정. 브라우저 밖(서버 렌더)에서는 부르지 않는다. */
function reducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 시트를 아래에서 올리거나(up, 260ms) 아래로 내린다(down, SHEET_CLOSE_MS). 뒤 화면(::backdrop)도 함께 흐려지고 걷힌다.
 * 내릴 때는 끝 모습을 붙잡아(fill) 두어, close() 하기 전 한 순간 제자리로 튀어 오르지 않게 한다.
 * ::backdrop 지정이 거부되면(예외) 시트만 움직인다. pseudoElement 옵션 자체를 모르는 브라우저는 예외 없이 시트가 함께 흐려질 수 있다.
 */
function slide(dialog: HTMLDialogElement, to: "up" | "down"): Animation[] {
  const up = to === "up";
  const timing: KeyframeAnimationOptions = up
    ? { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
    : { duration: SHEET_CLOSE_MS, easing: "ease-in", fill: "forwards" };
  const moves = [dialog.animate({ translate: up ? ["0 100%", "0 0"] : ["0 0", "0 100%"] }, timing)];
  try {
    moves.push(dialog.animate({ opacity: up ? [0, 1] : [1, 0] }, { ...timing, pseudoElement: "::backdrop" }));
  } catch {
    // ::backdrop 지정을 거부한 브라우저 — 시트만 움직인다.
  }
  return moves;
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
