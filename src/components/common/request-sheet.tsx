"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "./bottom-sheet";

// 확인을 바라는 요청을 알리는 시트(데모 home 의 날인 요청 팝업 sign-req 모양). Alert 경고 판과 같은 색(#FFF6E5 · #956013, 줄 사이 흰 선) 판에 이름 · 값 줄,
// 그 아래 설명과 가는 버튼 하나, 맨 아래 닫기(「다음에 하기」). 소속 추가 요청(WHALEERP-144)이 쓰고, 날인 요청 팝업(148)도
// 문구 · 줄 · 버튼만 바꿔 같은 것을 쓴다.
export function RequestSheet({
  open,
  onClose,
  title,
  rows,
  description,
  action,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 판에 보일 이름 · 값 줄(근무지 · 고용 형태 …). */
  rows: { label: string; value: ReactNode }[];
  description: ReactNode;
  /** 가는 버튼(Button href …). */
  action: ReactNode;
  closeLabel: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} closeLabel={closeLabel}>
      <dl className="flex flex-col divide-y divide-white rounded-[12px] bg-[#fff6e5] px-[14px] py-[4px]">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-[12px] py-[10px]">
            <dt className="shrink-0 text-[13px] font-semibold text-[#956013]">{label}</dt>
            <dd className="min-w-0 flex-1 text-right text-[13px] break-keep">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[14px] text-staff-text-sub">{description}</p>
      {action}
    </BottomSheet>
  );
}
