import Image from "next/image";
import { EASE_OUT } from "@/components/common/theme";

// TO-DO 체크칸 모양의 체크박스. 28px · radius 2, 꺼짐 옅은 남보라 · 켜짐 남보라에 흰 체크. 누르는 칸은 사방 8px 넓혀 44px.
// onChange 가 없으면 누를 수 없다.
export function CheckBox({ checked, onChange, label }: { checked: boolean; onChange?: (checked: boolean) => void; label: string }) {
  return (
    <label
      className={`relative flex size-[28px] shrink-0 items-center justify-center rounded-[2px] transition-colors duration-150 ${EASE_OUT} ${
        checked ? "bg-staff-primary" : "bg-staff-primary-inactive"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={!onChange}
        aria-label={label}
        className="absolute -inset-[8px] appearance-none rounded-[10px]"
      />
      <Image src={checked ? "/icons/todo-check-on.svg" : "/icons/todo-check-off.svg"} alt="" width={12} height={9} className="pointer-events-none" />
    </label>
  );
}
