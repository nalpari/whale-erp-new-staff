"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";

// Figma 03.Sheet(node 12:670) 바텀시트. 네이티브 <dialog>(showModal)라 Esc·포커스 가두기·뒤 화면 막기를 브라우저가 맡는다.
// 흰 바탕 · 위 모서리 26 · 위로 그림자, 맨 위 40×4 손잡이(#DCE1E9), 제목 20px bold · 설명 14px 보조 글자 · 좌우 24.
// 뒤 화면은 #17253D 38% + 1.5px 흐림. 열 때 아래에서 올라오고(260ms) 닫을 때 더 빨리 내려간다(200ms).
// 뒤 화면을 누르거나 Esc·닫기를 누르면 onClose 를 부른다. 열림 상태는 쓰는 쪽이 open 으로 들고 있다.
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  closeLabel = "닫기",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
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
        <h2 className="pt-[25px] text-[20px] font-bold">{title}</h2>
        {description && <p className="pt-[19px] text-[14px] text-staff-text-sub">{description}</p>}
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

// 시트 안의 고르기 버튼(Figma node 12:677): 52px · radius 12 · #E4E8EF 테두리 · 15px semibold 보조 글자.
// 지금 고른 것은 글자 옆에 19px 체크(사이 9). 색이 아니라 체크와 aria-pressed 로 고른 것을 알린다.
export function SheetOption({ selected = false, onClick, children }: { selected?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="flex min-h-[52px] items-center justify-center gap-[9px] rounded-[12px] border border-[#e4e8ef] bg-white px-[18px] text-[15px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
    >
      {children}
      {selected && <Image src="/icons/check-sub.svg" alt="" width={19} height={19} className="-scale-y-100" />}
    </button>
  );
}
