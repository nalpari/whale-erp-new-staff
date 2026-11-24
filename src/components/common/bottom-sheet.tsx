"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Figma 03.Sheet(node 12:670) 바텀시트. 네이티브 <dialog>(showModal)라 Esc·포커스 가두기·뒤 화면 막기를 브라우저가 맡는다.
// 흰 바탕 · 위 모서리 26 · 위로 그림자, 맨 위 40×4 손잡이(#DCE1E9), 제목 20px bold · 설명 14px 보조 글자 · 좌우 24.
// 뒤 화면은 #17253D 38% + 1.5px 흐림. 열 때 아래에서 올라오고(260ms) 닫을 때 더 빨리 내려간다(200ms).
// 뒤 화면을 누르거나 Esc·닫기를 누르면 onClose 를 부른다. 열림 상태는 쓰는 쪽이 open 으로 들고 있다.
/** 닫힐 때 내려가는 시간(ms, 아래 duration-200). 시트를 차례로 띄우는 쪽이 앞 시트가 다 내려간 뒤 다음을 열 때 쓴다. */
export const SHEET_CLOSE_MS = 200;

export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  heading,
  description,
  closeLabel = "닫기",
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
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

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
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none translate-y-full overflow-visible bg-transparent p-0 transition-[translate,overlay,display] transition-discrete duration-200 ease-in open:translate-y-0 open:duration-[260ms] open:ease-[cubic-bezier(0.23,1,0.32,1)] starting:open:translate-y-full backdrop:bg-[rgba(23,37,61,0.38)] backdrop:opacity-0 backdrop:backdrop-blur-[1.5px] backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0 motion-reduce:transition-none motion-reduce:backdrop:transition-none"
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
