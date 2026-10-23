"use client";

import { useId } from "react";
import { MaskIcon } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import type { CodeValue } from "@/lib/codes";
import { ACCOUNT_BASIS, Basis, RRN_BASIS } from "./tax-profile-parts";

// 신고 정보 입력 칸(데모 docs/demo/tax 의 form). 고치기(WHALEERP-333)와 날인 뒤 처음 넣기(150)가 같이 쓴다.
// 값은 쓰는 쪽이 상태로 들고, <form action> 대신 onSubmit 으로 보낸다 — React 19 폼 액션의 reset 은 제어 칸이어도 select 를 비워
// 상태와 어긋난다. 서버 액션 상태로 되돌려 받으면 원문이 화면으로 다시 내려간다. 자동 완성은 모두 끈다.
// 주의(150 등 쓰는 쪽): 이 칸을 담는 <form> 에는 onSubmit 만 두지 말고 action 에 서버 액션도 준다 — 하이드레이션 전에 누르면
// action 없는 폼은 기본 GET 이라 원문이 주소 · 방문 기록 · 접근 로그에 남는다(PR #26 리뷰). 고치기 화면 tax-profile-form.tsx 가 예다.
// 뒷자리 칸은 type="password" 가 아니다 — 저장 뒤 브라우저가 「비밀번호 저장」을 띄워 원문이 브라우저 · 동기화에 남을 수 있어,
// 글자 칸에 CSS 로 가린다(-webkit-text-security) · 비밀번호 관리자 확장도 무시하게 한다(data-1p-ignore · data-lpignore).
// CSS 가림은 값을 바꾸지 않아 복사 · 잘라내기 · 끌어 옮기기로 원문이 나간다(비밀번호 칸은 브라우저가 막는다) — 그래서 뒷자리 칸은
// copy · cut · dragstart 를 막는다(PR #26 참고, 2026-10-23 노영주). 붙여넣기는 막지 않는다 — 본인이 다른 곳에서 옮겨 넣을 수 있게.
// 화면 낭독기는 막지 않는다 — 넣는 본인에게 넣은 숫자를 읽어 주는 것이 입력 확인이고, 초점을 받는 입력 칸은 aria-hidden 으로 가릴 수
// 없다(가리면 칸 이름조차 읽지 않는다). 이 칸은 본인의 기기에서 본인이 넣는 값이라 낭독기의 소리는 비밀번호 칸과 같은 정도로 본다.
// required 는 처음 넣기(셋 다 필수)용이다. 고치기는 비워 둔 쪽을 그대로 두어 끈다.

const LEGEND = "pb-[8px] text-[13px] font-semibold text-staff-text-sub";
/** 뒷자리 칸의 복사 · 잘라내기 · 끌어 옮기기를 막는다(위 주석). */
const blockCopy = (event: { preventDefault(): void }) => event.preventDefault();
const noteClass = (error?: string) => `text-[12px] ${error ? "text-staff-error" : "text-staff-text-muted"}`;

/**
 * 주민등록번호 — 받은 근거 · 앞 6자리(보임) · 뒤 7자리(가림) · 안내. error 는 모양 오류(RRN_SHAPE) · 가입 생년월일 불일치(화면 계산
 * rrnBirthMismatch 또는 api RRN_BIRTH_MISMATCH) · 그 밖의 api 사유이고, 안내 자리에 서며 앞칸을 빨갛게 한다.
 */
export function RrnField({
  front,
  back,
  onFrontChange,
  onBackChange,
  required = false,
  help = "본인의 번호만 넣을 수 있습니다.",
  error,
  disabled,
}: {
  front: string;
  back: string;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  required?: boolean;
  help?: string;
  error?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const note = error || help;
  return (
    <div className="flex flex-col gap-[8px]">
      <Basis>{RRN_BASIS}</Basis>
      <fieldset className="flex flex-col gap-[8px]" disabled={disabled}>
        <legend className={LEGEND}>주민등록번호{required && "*"}</legend>
        <div className="flex items-center gap-[8px]">
          <input
            name="rrnFront"
            aria-label="주민등록번호 앞 6자리"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            required={required}
            value={front}
            onChange={(event) => onFrontChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-note`}
            className={FIELD}
          />
          <span aria-hidden="true" className="text-staff-text-muted">
            –
          </span>
          <input
            name="rrnBack"
            aria-label="주민등록번호 뒤 7자리"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            onCopy={blockCopy}
            onCut={blockCopy}
            onDragStart={blockCopy}
            maxLength={7}
            required={required}
            value={back}
            onChange={(event) => onBackChange(event.target.value)}
            aria-describedby={`${id}-note`}
            className={`${FIELD} [-webkit-text-security:disc]`}
          />
        </div>
        <p id={`${id}-note`} role={error ? "alert" : undefined} className={noteClass(error)}>
          {note}
        </p>
      </fieldset>
    </div>
  );
}

/**
 * 급여 계좌 — 받은 근거 · 은행(공통코드 BANK) · 계좌번호 · 안내. 은행 목록을 받지 못하면(banks 가 빔) 은행을 고를 수 없어
 * 칸을 막고 그 사정을 안내 자리에 쓴다.
 */
export function PayrollAccountFields({
  banks,
  bankCode,
  accountNumber,
  onBankChange,
  onAccountChange,
  required = false,
  help = "예금주가 본인이어야 합니다. 급여는 이 계좌로 들어갑니다.",
  bankError,
  accountError,
  disabled,
}: {
  banks: readonly CodeValue[];
  bankCode: string;
  accountNumber: string;
  onBankChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  required?: boolean;
  help?: string;
  bankError?: string;
  accountError?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const unavailable = banks.length === 0;
  const error = bankError || accountError;
  const note = error || (unavailable ? "은행 목록을 불러오지 못해 지금은 계좌를 넣을 수 없습니다. 잠시 뒤 다시 열어 주세요." : help);
  return (
    <div className="flex flex-col gap-[8px]">
      <Basis>{ACCOUNT_BASIS}</Basis>
      <fieldset className="flex flex-col gap-[8px]" disabled={disabled || unavailable}>
        <legend className={LEGEND}>급여 계좌{required && "*"}</legend>
        <div className="relative">
          <select
            name="bankCode"
            aria-label="은행"
            autoComplete="off"
            required={required}
            value={bankCode}
            onChange={(event) => onBankChange(event.target.value)}
            aria-invalid={bankError ? true : undefined}
            aria-describedby={`${id}-note`}
            className={`${FIELD} appearance-none pr-[44px] ${bankCode ? "" : "text-staff-placeholder!"}`}
          >
            <option value="">은행 고르기</option>
            {banks.map((bank) => (
              <option key={bank.value} value={bank.value} className="text-staff-text">
                {bank.label}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-staff-text-sub">
            <MaskIcon src="/icons/chevron-down.svg" size={16} />
          </span>
        </div>
        <input
          name="payrollAccountNumber"
          aria-label="계좌번호"
          inputMode="numeric"
          autoComplete="off"
          maxLength={20}
          placeholder="계좌번호(숫자만)"
          required={required}
          value={accountNumber}
          onChange={(event) => onAccountChange(event.target.value)}
          aria-invalid={accountError ? true : undefined}
          aria-describedby={`${id}-note`}
          className={FIELD}
        />
        <p id={`${id}-note`} role={error ? "alert" : undefined} className={noteClass(error)}>
          {note}
        </p>
      </fieldset>
    </div>
  );
}
