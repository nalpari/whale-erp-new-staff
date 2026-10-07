import { useId, type ComponentProps } from "react";
import { FIELD } from "./theme";

type TextFieldProps = {
  label: string;
  // 입력칸 아래 안내 문구. error 가 있으면 error 가 대신 선다.
  help?: string;
  error?: string;
} & Omit<ComponentProps<"input">, "className" | "id">;

// Figma InputField: 라벨(13px semibold, 보조 글자) · 입력칸(h52, radius 12) · 안내(12px, 흐린 글자). 사이 간격 8px.
// 오류면 테두리가 #EF4444 로 바뀌고 안내 자리에 오류 문구가 선다.
export function TextField({ label, help, error, ...rest }: TextFieldProps) {
  const id = useId();
  const note = error ?? help;
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <label htmlFor={id} className="text-[13px] font-semibold text-staff-text-sub">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? `${id}-note` : undefined}
        className={FIELD}
      />
      {note && (
        <p id={`${id}-note`} className={`text-[12px] ${error ? "text-staff-error" : "text-staff-text-muted"}`}>
          {note}
        </p>
      )}
    </div>
  );
}
