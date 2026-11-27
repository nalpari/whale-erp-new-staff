"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, Button, Dock, IconTile, MaskIcon } from "@/components/common";
import { PayrollAccountFields, RrnField, focusTaxProfileField } from "@/app/_components/tax-profile-fields";
import { TaxIdentity, TaxOwnerNotice } from "@/app/_components/tax-profile-parts";
import type { CodeValue } from "@/lib/codes";
import {
  RRN_BIRTH_MISMATCH,
  TAX_PROFILE_ALREADY_SUBMITTED,
  readTaxProfileForm,
  rrnBirthMismatch,
  validateTaxProfileCreate,
  type TaxProfileEditState,
  type TaxProfileField,
} from "@/lib/tax-profile";

// 날인 뒤 신고 정보 처음 넣기(WHALEERP-150). 기준: 데모 docs/demo/tax 의 intro · form · why. 건너뛰는 길을 두지 않는다(TAX-4) —
// 안내에도 입력에도 「나중에」 버튼이 없다. 앱 전체를 막지는 않는다(2026-10-28 김민식: 흐름 안에서만 막기).

// 입력할 정보 두 가지와 쓰는 곳 — 칸마다 근거를 따로 알린다(TAX-08). 전엔 「이용 목적」 세 줄이라 입력 칸과 이어지지 않았다(2026-11-23 사용자 지정).
const FIELDS = [
  { title: "주민등록번호", sub: "4대보험 신고(가입 대상인 경우) · 근로소득 원천징수" },
  { title: "급여 계좌", sub: "매달 급여 이체" },
];

/** 끝 글자에 받침이 있는지 — 닫는 괄호 · 따옴표 · 공백은 건너뛴다. 숫자는 읽는 소리(영 · 일 · 삼 · 육 · 칠 · 팔 · 십은 받침), 영문 등 판단할 수 없으면 null. */
const hasBatchim = (word: string): boolean | null => {
  const t = word.replace(/[\s)\]}」』"'’”]+$/u, "");
  const ch = t.charAt(t.length - 1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code >= 0 && code <= 11171) return code % 28 !== 0;
  if (/[0-9]/.test(ch)) return "0136780".includes(ch);
  return null;
};

/** 「웨일카페 강남역점과」 · 「웨일카페와」 — 받침에 따라 과 · 와, 판단할 수 없으면(영문으로 끝남) 「와(과)」. */
const withGwa = (name: string) => {
  const b = hasBatchim(name);
  return `${name}${b === null ? "와(과)" : b ? "과" : "와"}`;
};

/** 안내(데모 intro). formHref 는 입력 단계(`?step=form`). */
export function TaxProfileIntro({ storeName, formHref, signed }: { storeName: string; formHref: string; signed: boolean }) {
  // 정돈(2026-11-23 사용자 지정): 흰 바탕 · 입력할 정보 두 줄 · 암호화 안내는 상자 없이 · [입력하기]는 안내 바로 아래.
  // 「입력해야 일을 시작할 수 있습니다」는 뺐다 — 입력하지 않아도 앱 사용을 막지 않는다.
  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-[24px] bg-white px-[24px] pt-[20px] pb-[32px] leading-[1.5] break-keep">
        <div className="flex flex-col items-center gap-[8px] text-center">
          <span className="mb-[6px] flex">
            <IconTile src="/icons/id-card-line.svg" size={44} />
          </span>
          <h2 className="text-[20px] font-bold">신고 정보를 입력해 주세요</h2>
          <p className="text-[14px] text-staff-text-sub">
            {/* 「근로계약이 완료되었습니다」는 서명 완료 화면에서 넘어왔을 때만 — 내 정보에서 서명 전에 들어오면 사실과 달라진다(PR #73 리뷰) */}
            {signed ? (
              <>{withGwa(storeName)} 근로계약이 완료되었습니다.</>
            ) : (
              <>
                <strong className="text-staff-text">{storeName}</strong>에 제출할 정보입니다.
              </>
            )}
          </p>
        </div>
        <section className="rounded-[16px] border border-staff-border-light px-[18px] py-[14px]">
          <p className="text-[13px] text-staff-text-sub">입력할 정보</p>
          <ul className="flex flex-col divide-y divide-staff-border-light">
            {FIELDS.map((f) => (
              <li key={f.title} className="py-[12px] last:pb-[2px]">
                <span className="block text-[15px] font-semibold">{f.title}</span>
                <span className="block text-[13px] text-staff-text-sub">{f.sub}</span>
              </li>
            ))}
          </ul>
        </section>
        <p className="flex gap-[8px] text-[13px] text-staff-text-sub">
          <span className="mt-[3px] flex shrink-0 text-staff-text-sub">
            <MaskIcon src="/icons/shield.svg" size={14} flipY />
          </span>
          <span>
            입력한 정보는 <strong className="text-staff-text">암호화하여 안전하게 보관</strong>합니다.
            <br />
            관리자에게는 주민등록번호 일부만 표시되며, 급여 계좌는 급여 이체를 위해 전체 정보가 표시됩니다.
          </span>
        </p>
        {/* [입력하기] 하나만 — 「주민등록번호를 따로 받는 이유」 링크 · 시트는 위 안내와 같은 말을 되풀이해 뺐다(2026-11-23 사용자 지정) */}
        <Button href={formHref} transitionTypes={["nav-forward"]}>
          입력하기
        </Button>
      </div>
    </>
  );
}

/**
 * 입력(데모 form). 고치기(edit/tax-profile-form.tsx)와 같은 칸 · 같은 제출 방식이고, 셋 다 필수 · 지금 비밀번호 칸이 없다.
 * - form 에 action(서버 액션)을 함께 준다 — 하이드레이션 전 제출이 기본 GET 이 되어 원문이 주소에 남지 않게(tax-profile-fields 주석).
 * - 하이드레이션 뒤에는 onSubmit 이 직접 보낸다(React 19 폼 reset 이 고른 은행을 비우지 않게).
 * - 저장 버튼 중복 클릭을 막는다 — pending 은 다음 그림에서야 켜져 같은 순간의 두 번째 클릭을 막지 못해 ref 로도 막는다. 그래도
 *   두 번 가면 액션이 400 을 다시 읽어 완료로 처리한다(api #138).
 */
export function TaxProfileCreateForm({
  action,
  viewHref,
  storeName,
  realName,
  birthDate,
  birthDateLabel,
  banks,
}: {
  /** 소속 id 를 붙인 서버 액션(createTaxProfileAction.bind) — 서버 화면에서 붙여 넘긴다(고치기 화면 주석과 같은 까닭). */
  action: (previous: TaxProfileEditState, formData: FormData) => Promise<TaxProfileEditState>;
  /** 이 소속의 신고 정보 보기 화면 */
  viewHref: string;
  /** 이 소속의 근무지 이름 — 어느 근무지에 내는 정보인지 맨 위에 적는다(TAX-07, 고치기 화면과 같은 줄) */
  storeName: string;
  realName: string;
  birthDate: string;
  birthDateLabel: string;
  banks: readonly CodeValue[];
}) {
  const [state, formAction, pending] = useActionState<TaxProfileEditState, FormData>(action, {});
  const [rrnFront, setRrnFront] = useState("");
  const [rrnBack, setRrnBack] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [local, setLocal] = useState<TaxProfileEditState["problem"]>();
  const [dismissed, setDismissed] = useState<TaxProfileEditState | null>(null);
  const sending = useRef(false);
  // 응답(새 상태)이 오면 다시 보낼 수 있다. 성공하면 액션이 완료 화면으로 보내 돌아오지 않는다.
  useEffect(() => {
    sending.current = false;
  }, [state]);
  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setLocal(undefined);
    setDismissed(state);
  };
  const mismatch = rrnBirthMismatch(rrnFront, rrnBack, birthDate);
  const problem = local ?? (pending || state === dismissed ? undefined : state.problem);
  const errorOf = (field: TaxProfileField) => (problem?.field === field ? problem.message : undefined);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    const formData = new FormData(event.currentTarget);
    const checked = validateTaxProfileCreate(readTaxProfileForm(formData));
    if (!("body" in checked)) {
      setLocal(checked.problem);
      if (checked.problem) focusTaxProfileField(event.currentTarget, checked.problem.field);
      return;
    }
    setLocal(undefined);
    sending.current = true;
    startTransition(() => formAction(formData));
  };

  return (
    // noValidate — 브라우저 말풍선 대신 onSubmit 이 거른 오류를 칸 아래에 보인다(2026-11-23 사용자 결정).
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-1 flex-col bg-white" autoComplete="off">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]">
        <div>
          <p className="mb-[8px] text-[14px] font-semibold text-staff-primary">{storeName}</p>
          <div className="flex flex-col gap-[6px]">
            <h2 className="text-[22px] font-bold">주민등록번호와 급여 계좌</h2>
            <p className="text-[14px] text-staff-text-sub">본인 명의의 주민등록번호와 계좌만 입력할 수 있습니다.</p>
          </div>
        </div>
        <TaxIdentity realName={realName} birthDate={birthDateLabel} />
        <RrnField
          help="주민등록번호 앞자리는 생년월일과 같아야 합니다."
          front={rrnFront}
          back={rrnBack}
          onFrontChange={edit(setRrnFront)}
          onBackChange={edit(setRrnBack)}
          required
          error={mismatch ? RRN_BIRTH_MISMATCH : errorOf("rrn")}
        />
        <PayrollAccountFields
          help=""
          banks={banks}
          bankCode={bankCode}
          accountNumber={accountNumber}
          onBankChange={edit(setBankCode)}
          onAccountChange={edit(setAccountNumber)}
          required
          bankError={errorOf("bank")}
          accountError={errorOf("account")}
        />
        {problem?.field === "form" && (
          <Alert tone="danger">
            <p>{problem.message}</p>
            {/* 이미 낸 신고 정보(응답이 끊긴 앞 제출 · 다른 기기)는 보기 화면에서 확인한다. */}
            {problem.message === TAX_PROFILE_ALREADY_SUBMITTED && (
              <Link href={viewHref} replace className="mt-[4px] inline-flex min-h-[44px] items-center font-semibold underline underline-offset-2">
                낸 신고 정보 보기
              </Link>
            )}
          </Alert>
        )}
        <TaxOwnerNotice noConsent />
      </div>
      <Dock>
        {/* 은행 목록을 받지 못하면 계좌 칸이 막혀 셋 다 필수인 처음 넣기는 보낼 수 없다 — 칸의 안내가 사정을 말한다. */}
        <Button type="submit" disabled={pending || mismatch || banks.length === 0}>
          등록하기
        </Button>
      </Dock>
    </form>
  );
}
