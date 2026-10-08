"use client";

import Link from "next/link";
import type { DemoState } from "./use-demo-state";

// 데모 전용 상태 전환 도구. 앱 디자인이 아니라 데모를 보는 도구라 /design 의 「가이드」 버튼처럼 짙은 남색으로 화면 위에 띄운다.
// 네이티브 <details> 라 열고 닫는 데 스크립트가 없다. 목업의 오른쪽 상태 목록에 해당한다.
export function DemoStates({
  states,
  current,
  onChange,
}: {
  states: readonly DemoState[];
  current: string;
  onChange: (id: string) => void;
}) {
  const index = states.findIndex((s) => s.id === current);
  return (
    <details className="group fixed top-[8px] right-[8px] z-50 max-w-[280px] text-[12px] leading-[1.5] text-white">
      <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-[6px] rounded-full bg-staff-navy/85 px-[12px] py-[8px] font-semibold shadow-[0_4px_12px_rgba(24,34,55,0.18)] [&::-webkit-details-marker]:hidden">
        상태 {index + 1}/{states.length}
        {/* 휴대전화 폭에서는 화면 제목을 가리지 않게 번호만 보인다. 데스크톱에서는 기둥 밖이라 이름까지 둔다. */}
        <span className="font-normal text-white/70 max-[600px]:hidden">{states[index]?.label}</span>
      </summary>
      <div className="mt-[6px] max-h-[70dvh] overflow-y-auto rounded-[12px] bg-staff-navy/95 p-[6px] shadow-[0_8px_28px_rgba(22,25,28,0.24)]">
        {states.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={(e) => {
              onChange(s.id);
              (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
            }}
            aria-current={s.id === current}
            className="flex w-full items-baseline gap-[8px] rounded-[8px] px-[10px] py-[7px] text-left hover:bg-white/10 aria-[current=true]:bg-white/15"
          >
            <span className="w-[16px] shrink-0 text-white/50 tabular-nums">{i + 1}</span>
            <span>
              <span className="font-semibold">{s.label}</span>
              {s.note ? <span className="text-white/60"> · {s.note}</span> : null}
            </span>
          </button>
        ))}
        <Link href="/demo" className="mt-[4px] block rounded-[8px] border-t border-white/10 px-[10px] py-[8px] text-white/80 hover:bg-white/10">
          ← 데모 목록
        </Link>
      </div>
    </details>
  );
}
