"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "./bottom-sheet";
import { SubLine } from "./sub-line";

// 확인을 바라는 요청을 알리는 시트(데모 home 의 날인 요청 팝업 sign-req). 제목 아래 한 줄(lead), 안내 바탕 판에 이름 · 값 줄(이름 칸 폭
// 고정 · 값 왼쪽 정렬, 값 아래 꺾은선 줄), 그 아래 덧붙임과 가는 버튼 하나, 맨 아래 닫기(「나중에 하기」). 서명 요청(148) · 근무지 추가
// 요청(144) · 사업자 제공 다시 동의가 문구 · 줄 · 버튼만 바꿔 같이 쓴다. 판은 노란 경고판이었다가 정돈 시안 A안으로 바꿨다(2026-11-20 사용자 지정).
export function RequestSheet({
  open,
  onClose,
  title,
  eyebrow,
  heading,
  lead,
  rows,
  description,
  action,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 제목 위 작은 머리말 · 글자 대신 그릴 제목(BottomSheet 와 같다). */
  eyebrow?: string;
  heading?: ReactNode;
  /** 제목 바로 아래 한 줄(시트 설명 자리). */
  lead?: ReactNode;
  /** 판에 보일 이름 · 값 줄(근무지 · 고용 형태 …). sub 는 값 아래 꺾은선 줄(「5일 남음」). */
  rows: { label: string; value: ReactNode; sub?: ReactNode }[];
  /** 판 아래 덧붙임. */
  description: ReactNode;
  /** 가는 버튼(Button href …). */
  action: ReactNode;
  closeLabel: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} eyebrow={eyebrow} heading={heading} description={lead} closeLabel={closeLabel}>
      <dl className="flex flex-col gap-[10px] rounded-[14px] border border-staff-border bg-staff-info-bg px-[18px] py-[16px]">
        {rows.map(({ label, value, sub }) => (
          <div key={label} className="flex gap-[12px] text-[15px]">
            <dt className="w-[72px] shrink-0 text-staff-text-muted">{label}</dt>
            <dd className="flex min-w-0 flex-1 flex-col gap-[4px] break-keep">
              <span>{value}</span>
              {sub && <SubLine>{sub}</SubLine>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] break-keep text-staff-text-muted">{description}</p>
      {action}
    </BottomSheet>
  );
}
