import type { ComponentProps, ReactNode } from "react";

// 디자인 샘플 전용 유닛. /design 은 하나씩, /design/full 은 조합해서 보여준다.
// 실제 화면으로 옮길 때 검증된 것만 꺼내 쓴다.

export function Plate({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[0.72rem] uppercase tracking-[0.36em] text-plate">
      {children}
    </span>
  );
}

export function StartButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="h-14 w-full bg-start font-sans text-[0.95rem] font-semibold tracking-[0.02em] text-panel transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
    />
  );
}

export function QuietButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="h-11 px-3 font-sans text-sm text-plate-dim transition-colors hover:text-plate"
    />
  );
}

export function Field({
  id,
  label,
  ...input
}: { id: string; label: string } & ComponentProps<"input">) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-sans text-[0.82rem] tracking-[0.02em] text-plate-dim"
      >
        {label}
      </label>
      <input
        id={id}
        {...input}
        className="slot mt-3 h-12 w-full px-4 font-mono text-[0.95rem] text-plate outline-none"
      />
    </div>
  );
}

export function Readout({ value }: { value: number }) {
  return (
    <span
      className={`font-mono text-5xl font-medium tabular-nums sm:text-6xl ${
        value > 0 ? "lit" : "text-plate-dim"
      }`}
    >
      {value}
    </span>
  );
}

export function Alarm({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="border-l border-alarm pl-4 font-sans text-sm leading-relaxed text-alarm"
    >
      {children}
    </p>
  );
}

export function ItemRow({
  sku,
  name,
  unit,
  stock,
}: {
  sku: string;
  name: string;
  unit: string;
  stock: number;
}) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 border-t border-seam py-7 sm:grid-cols-[14rem_1fr_4rem_auto]">
      <span className="font-mono text-sm tracking-[0.08em] text-plate">{sku}</span>
      <span className="order-last col-span-2 font-sans text-lg leading-tight text-plate sm:order-none sm:col-span-1 sm:text-xl">
        {name}
      </span>
      <span className="hidden font-mono text-[0.72rem] uppercase tracking-[0.2em] text-plate-dim sm:block">
        {unit}
      </span>
      <span className="row-span-2 self-center text-right sm:row-span-1">
        <Readout value={stock} />
      </span>
    </li>
  );
}

// PRODUCT.md 의 실제 품목 2건. 샘플에서도 없는 데이터를 지어내지 않는다.
export const SAMPLE_ITEMS = [
  { sku: "WIRE-COIL-5T", name: "강선 코일 5T", unit: "EA", stock: 99 },
  { sku: "PLATE-SS400", name: "열연강판 SS400", unit: "EA", stock: 0 },
];
