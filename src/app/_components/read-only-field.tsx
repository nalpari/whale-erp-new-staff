import { useId, type ReactNode } from "react";

// 읽기 전용 칸(데모 me 의 readOnlyField · 목업 input--ro): 입력칸과 같은 52px · radius 12 지만 안내 바탕 · 옅은 테두리 ·
// 보조 글자로 고칠 수 없음을 보인다. action 이 있으면 오른쪽에 96px 칸을 둔다(44px 외곽선 버튼).
// wrap 이면 긴 값(주소)이 잘리지 않게 줄을 바꾸는 칸으로 그린다 — 입력칸은 한 줄이라 끝이 잘린다.
export function ReadOnlyField({
  label,
  value,
  help,
  action,
  wrap = false,
}: {
  label: string;
  value: string;
  help?: string;
  action?: ReactNode;
  wrap?: boolean;
}) {
  const id = useId();
  const box = "w-full min-w-0 rounded-[12px] border border-staff-border-light bg-staff-info-bg px-[14px] text-[16px] text-staff-text-sub";
  return (
    <div className="flex flex-col gap-[8px]">
      <label id={`${id}-label`} htmlFor={wrap ? undefined : id} className="text-[13px] font-semibold text-staff-text-sub">
        {label}
      </label>
      <div className="flex items-center gap-[8px]">
        {wrap ? (
          <p
            id={id}
            role="textbox"
            aria-readonly
            aria-labelledby={`${id}-label`}
            aria-describedby={help ? `${id}-help` : undefined}
            className={`${box} flex min-h-[52px] items-center py-[12px] leading-[1.5] break-keep`}
          >
            {value}
          </p>
        ) : (
          <input id={id} readOnly value={value} aria-describedby={help ? `${id}-help` : undefined} className={`${box} h-[52px] outline-none!`} />
        )}
        {action && <div className="w-[96px] shrink-0">{action}</div>}
      </div>
      {help && (
        <p id={`${id}-help`} className="text-[12px] text-staff-text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

/** 카드 머리 이름(데모 label) — 13px semibold 보조 글자. */
export function CardLabel({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold text-staff-text-sub">{children}</p>;
}
