"use client";

import { useId, useState, type ReactNode } from "react";
import { Alert } from "./alert";
import { BottomSheet } from "./bottom-sheet";
import { DangerButton } from "./danger-button";

// 확인을 바라는 요청을 알리는 시트(데모 home 의 날인 요청 팝업 sign-req 모양). 경고 짝 색(#FFF6E5 · #956013) 판에 이름 · 값 줄,
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
      <dl className="flex flex-col divide-y divide-[#f5e3c0] rounded-[12px] bg-[#fff6e5] px-[14px] py-[4px]">
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

// 거절 · 거부 사유를 받는 시트(데모 contract 의 거부 사유 시트 모양). 사유는 선택이라 비워도 확정할 수 있고, 확정은 되돌릴 수 없어
// 오류색 버튼이다. 사유는 폼의 reason 칸으로 action 에 실린다. 소속 추가 거절(144)이 쓰고, 근로계약서 거부(JOIN-5)도 문구만 바꿔 쓴다.
// 사유는 상태로 든다 — React 19 폼 액션은 제출 뒤 칸을 비우는데, 실패하면 적은 사유를 그대로 두어 다시 누르게 한다.
export function ReasonSheet({
  open,
  onClose,
  title,
  description,
  label,
  placeholder,
  help,
  maxLength,
  confirmLabel,
  closeLabel = "취소",
  action,
  pending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  help: string;
  maxLength: number;
  confirmLabel: string;
  closeLabel?: string;
  action: (formData: FormData) => void;
  pending: boolean;
  /** 확정이 실패했을 때(요청 제한 · 연결 실패 등)의 문구. */
  error?: string;
}) {
  const id = useId();
  const [reason, setReason] = useState("");
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description} closeLabel={closeLabel}>
      <form action={action} className="flex flex-col gap-[13px]">
        <div className="flex flex-col gap-[8px]">
          <label htmlFor={id} className="text-[13px] font-semibold text-staff-text-sub">
            {label} <span className="font-medium text-staff-placeholder">(선택)</span>
          </label>
          <textarea
            id={id}
            name="reason"
            rows={3}
            maxLength={maxLength}
            placeholder={placeholder}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-describedby={`${id}-help`}
            className="min-h-[76px] w-full resize-y rounded-[12px] border border-staff-border bg-white px-[14px] py-[12px] text-[16px] text-staff-text outline-none! transition-[border-color] duration-150 ease-out placeholder:text-staff-placeholder focus:border-staff-primary"
          />
          <p id={`${id}-help`} className="text-[12px] text-staff-text-muted">
            {help}
          </p>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <DangerButton type="submit" disabled={pending}>
          {confirmLabel}
        </DangerButton>
      </form>
    </BottomSheet>
  );
}
