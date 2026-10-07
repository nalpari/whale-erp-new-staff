"use client";

import { useId } from "react";
import { EASE_OUT } from "./theme";

// Figma 09.알림설정 스위치(node 17:1248): 48×28 알약. 켜짐은 남보라 + 흰 손잡이 오른쪽, 꺼짐은 옅은 남보라 + 손잡이 왼쪽.
// 손잡이 22px · 안쪽 3px · 아주 옅은 그림자. 잠긴 스위치(disabled)는 켜짐·꺼짐을 그대로 보여 주고 흐리게(50%) 그려 누를 수 없게 한다.
// (Figma 는 잠긴 「항상 켜짐」을 옅은 꺼짐 모양으로 그렸으나, 화면과 읽기 도구가 서로 다른 상태를 말하게 되어 바꿨다.)
export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  describedBy,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-200 ${EASE_OUT} ${checked ? "bg-staff-primary" : "bg-staff-primary-inactive"} disabled:opacity-50`}
    >
      <span
        className={`absolute top-[3px] left-[3px] size-[22px] rounded-full bg-white shadow-[0_3px_14px_rgba(36,56,89,0.02)] transition-transform duration-200 ${EASE_OUT} ${checked ? "translate-x-[20px]" : ""}`}
      />
    </button>
  );
}

// 설정 한 줄(node 17:1208): 위아래 17 · 사이 12 · 제목 15px semibold · 설명 12px 보조 글자 · 오른쪽 스위치.
// 줄 사이 선은 감싸는 목록이 긋는다(divide-y #E8EDF3).
export function SwitchRow({
  title,
  description,
  checked,
  onChange,
  locked = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  locked?: boolean;
}) {
  const id = useId();
  return (
    <li className="flex items-center gap-[12px] py-[17px] leading-[1.5]">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[15px] font-semibold text-staff-text">{title}</p>
        <p id={id} className="pt-[2px] text-[12px] text-staff-text-sub">
          {description}
        </p>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={locked} label={title} describedBy={id} />
    </li>
  );
}
