import type { ReactNode } from "react";
import { Notice } from "@/components/common";
import { CardLabel } from "./read-only-field";

// 신고 정보(TAX-8) 화면들이 같이 쓰는 보기 조각 — 데모 docs/demo/tax 의 sunken · values · basis 와 받은 근거 · 사업주 안내 문구.
// 등록된 신고 정보(보기) · 고치기(WHALEERP-333) · 날인 뒤 처음 넣기(150)가 같은 문장을 쓴다. 입력 칸은 tax-profile-fields.tsx.

/** 안내 판(데모 sunken) — 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14, 머리 이름 13px semibold(없어도 된다). */
export function Sunken({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
      {label && <CardLabel>{label}</CardLabel>}
      {children}
    </div>
  );
}

/** 이름 · 값 줄(데모 values) — 13px, 이름은 보조 글자 · 값은 오른쪽, 위아래 9 · 줄 사이 옅은 선. */
export function Values({ rows, flush = false }: { rows: [string, string][]; flush?: boolean }) {
  return (
    <dl className={`flex flex-col divide-y divide-staff-border-light ${flush ? "" : "pt-[8px]"}`}>
      {rows.map(([name, value]) => (
        <div key={name} className="flex items-start gap-[12px] py-[9px] first:pt-0 last:pb-0">
          <dt className="shrink-0 text-[13px] font-medium text-staff-text-sub">{name}</dt>
          <dd className="min-w-0 flex-1 text-right text-[13px] text-staff-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 받은 근거 한 줄(데모 basis) — 12px 보조 글자, <b> 는 기본 글자 bold. */
export function Basis({ children }: { children: ReactNode }) {
  return <p className="pt-[6px] text-[12px] text-staff-text-sub first:pt-0 [&_b]:font-bold [&_b]:text-staff-text">{children}</p>;
}

/**
 * 주민등록번호를 받는 근거(운영 정책 TAX-08). 지금은 처음 넣기 입력만 lineBreak 로 불러 「수집하며,」 뒤에서 줄을 바꾼다(데모 tax).
 * 등록된 신고 정보 보기 화면은 2026-11-20 부터 이 문장 대신 개인정보 보호법 조문(BasisItem)을 보인다.
 */
export const rrnBasis = (lineBreak = false) => (
  <>
    4대보험 신고와 근로소득 원천징수를 위해 <b>법령에 따라</b> 수집하며,{lineBreak ? <br /> : " "}신고 서류를 만들 때만 사용합니다.
  </>
);

/** 급여 계좌를 받는 근거(운영 정책 TAX-08). 쓰는 곳 · 줄바꿈은 rrnBasis 와 같다(처음 넣기 입력만). */
export const accountBasis = (lineBreak = false) => (
  <>
    <b>근로계약에 따라</b> 급여를 지급하기 위해 수집하며,{lineBreak ? <br /> : " "}급여 지급 외에는 사용하지 않습니다.
  </>
);

/** 수집 · 위탁 보관 공통 문구(2026-11-20 사용자 지정) — 점포 이름 없이 「사업주」로 써 신고 정보 화면들이 같은 문장을 쓴다. */
export const TAX_KEEP_TEXT = "입력한 정보는 사업주가 수집하며, WHALE ERP가 위탁받아 암호화하여 보관합니다.";
/** 동의 없이 받는 근거 — 입력 화면(처음 넣기 · 다시 입력)이 공통 문구 뒤에 잇는다. */
export const TAX_NO_CONSENT_TEXT = "해당 정보는 법령 및 근로계약에 따라 수집하며, 별도의 동의는 받지 않습니다.";

/** 수집 · 위탁 보관 안내(처음 넣기). noConsent 면 「별도의 동의는 받지 않습니다」를 잇는다. */
export function TaxOwnerNotice({ noConsent = false }: { noConsent?: boolean }) {
  return (
    <Notice>
      {TAX_KEEP_TEXT}
      {noConsent && (
        <>
          <br />
          {TAX_NO_CONSENT_TEXT}
        </>
      )}
    </Notice>
  );
}

/**
 * 가입 계정의 이름 · 생년월일(데모 form 의 sunken). 보기만 한다 — 주민등록번호 앞자리와 맞춰 보는 것은 rrnBirthMismatch(화면) · api
 * (RRN_BIRTH_MISMATCH)다(운영 정책 TAX-09). birthDate 는 표시용 글자.
 */
// 주민등록번호 칸 바로 위에 흰 상자로 둔다 — 생년월일을 보면서 번호를 넣게(2026-11-23 사용자 지정). 앞자리 안내는 주민등록번호 칸 아래로 옮겼다.
export function TaxIdentity({ realName, birthDate }: { realName: string; birthDate: string }) {
  return (
    <div className="w-full rounded-[12px] border border-staff-border-light bg-white p-[14px]">
      <Values
        flush
        rows={[
          ["이름", realName],
          ["생년월일", birthDate],
        ]}
      />
      <p className="pt-[8px] text-[12px] text-staff-text-muted">가입할 때 입력한 정보입니다.</p>
    </div>
  );
}
