"use client";

import { useId, useState, type ComponentProps } from "react";
import { MaskIcon } from "./icon";
import { FIELD } from "./theme";

type TextFieldProps = {
  label: string;
  // 입력칸 아래 안내 문구. error 가 있으면 error 가 대신 선다.
  help?: string;
  error?: string;
} & Omit<ComponentProps<"input">, "className" | "id" | "aria-invalid" | "aria-describedby">;

// Figma InputField: 라벨(13px semibold, 보조 글자) · 입력칸(h52, radius 12) · 안내(12px, 흐린 글자). 사이 간격 8px.
// 오류면 테두리가 #EF4444 로 바뀌고 안내 자리에 오류 문구가 선다.
// type="password" 면 칸 오른쪽 끝에 눈 버튼(보이는 아이콘 20px · 누르는 칸 44px)을 두어 비밀번호를 보이고 감춘다. 글자가 버튼 밑으로
// 들어가지 않게 오른쪽 안쪽 여백을 52 로 넓힌다. 제출해도 보이기 상태는 그대로 남는다(칸 하나마다 따로).
export function TextField({ label, help, error, type, ...rest }: TextFieldProps) {
  const id = useId();
  const note = error || help;
  const password = type === "password";
  const [shown, setShown] = useState(false);
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <label htmlFor={id} className="text-[13px] font-semibold text-staff-text-sub">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          type={password && shown ? "text" : type}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? `${id}-note` : undefined}
          className={password ? `${FIELD} pr-[52px]` : FIELD}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={shown}
            aria-controls={id}
            className="absolute top-1/2 right-[4px] flex size-[44px] -translate-y-1/2 items-center justify-center rounded-[10px] text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
          >
            <MaskIcon src={shown ? "/icons/eye-off.svg" : "/icons/eye.svg"} size={20} />
          </button>
        )}
      </div>
      {note && (
        <p id={`${id}-note`} className={`text-[12px] ${error ? "text-staff-error" : "text-staff-text-muted"}`}>
          {note}
        </p>
      )}
    </div>
  );
}
