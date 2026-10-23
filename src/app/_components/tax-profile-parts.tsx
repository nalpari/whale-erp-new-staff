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

/** 주민등록번호를 받는 근거(운영 정책 TAX-08). */
export const RRN_BASIS = (
  <>
    4대보험 취득 신고와 근로소득 원천징수를 위해 <b>법령에 따라</b> 받습니다. 동의 없이 받으며, 신고 서류를 만들 때만 씁니다.
  </>
);

/** 급여 계좌를 받는 근거(운영 정책 TAX-08). */
export const ACCOUNT_BASIS = (
  <>
    <b>근로계약에 따라</b> 급여를 보내기 위해 받습니다. 급여 지급 외에는 쓰지 않습니다.
  </>
);

/**
 * 사업주 · 위탁 보관 안내. storeName 은 그 소속의 점포다. noConsent 면 입력 화면(데모 form)처럼 「동의 항목이 없습니다」를 잇는다.
 */
export function TaxOwnerNotice({ storeName, noConsent = false }: { storeName: string; noConsent?: boolean }) {
  return (
    <Notice>
      이 정보는 <strong>{storeName}(사업주)</strong>이 받으며, WHALE ERP 는 {storeName}의 위탁을 받아 암호화해 보관합니다.
      {noConsent && (
        <>
          {" "}
          둘 다 동의로 받고 말고를 정하는 값이 아니라 <strong>동의 항목이 없습니다.</strong>
        </>
      )}
    </Notice>
  );
}

/**
 * 가입 계정의 이름 · 생년월일(데모 form 의 sunken). 보기만 한다 — 주민등록번호 앞자리와 맞춰 보는 것은 rrnBirthMismatch(화면) · api
 * (RRN_BIRTH_MISMATCH)다(운영 정책 TAX-09). birthDate 는 표시용 글자.
 */
export function TaxIdentity({ realName, birthDate }: { realName: string; birthDate: string }) {
  return (
    <Sunken>
      <Values
        flush
        rows={[
          ["이름", realName],
          ["생년월일", birthDate],
        ]}
      />
      <p className="pt-[8px] text-[12px] text-staff-text-muted">가입 때 넣은 계정 값입니다. 앞자리가 다르면 넣을 수 없습니다.</p>
    </Sunken>
  );
}
