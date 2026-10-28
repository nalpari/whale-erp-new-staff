"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Alert, BottomSheet, Button, Card, Dock, MaskIcon, Notice } from "@/components/common";
import { CardLabel } from "@/app/_components/read-only-field";
import { PayrollAccountFields, RrnField } from "@/app/_components/tax-profile-fields";
import { TaxIdentity, TaxOwnerNotice } from "@/app/_components/tax-profile-parts";
import type { CodeValue } from "@/lib/codes";
import {
  RRN_BIRTH_MISMATCH,
  readTaxProfileForm,
  rrnBirthMismatch,
  validateTaxProfileCreate,
  type TaxProfileEditState,
  type TaxProfileField,
} from "@/lib/tax-profile";

// 날인 뒤 신고 정보 처음 넣기(WHALEERP-150). 기준: 데모 docs/demo/tax 의 intro · form · why. 건너뛰는 길을 두지 않는다(TAX-4) —
// 안내에도 입력에도 「나중에」 버튼이 없다. 앱 전체를 막지는 않는다(2026-10-28 김민식: 흐름 안에서만 막기).

const PURPOSES = [
  { icon: "/icons/shield.svg", flipY: true, title: "4대보험 자격취득 신고", sub: "국민연금 · 건강보험 · 고용보험 · 산재보험" },
  { icon: "/icons/contract.svg", flipY: false, title: "근로소득 원천징수", sub: "급여에서 뗀 세금 신고" },
  { icon: "/icons/nav-pay.svg", flipY: false, title: "급여 지급", sub: "매달 급여를 받을 계좌" },
];

/** 안내(데모 intro). formHref 는 입력 단계(`?step=form`). */
export function TaxProfileIntro({ storeName, formHref }: { storeName: string; formHref: string }) {
  const [why, setWhy] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        <div className="flex flex-col items-center gap-[8px] text-center">
          <span className="text-staff-text-sub">
            <MaskIcon src="/icons/contract.svg" size={28} />
          </span>
          <h2 className="text-[22px] font-bold">신고 정보를 넣어 주세요</h2>
          <p className="text-[14px] text-staff-text-sub">
            근로계약을 맺었습니다 — <strong className="text-staff-text">{storeName}</strong>
            <br />
            4대보험 신고와 급여 지급에 필요한 정보입니다.
          </p>
        </div>
        <Card>
          <CardLabel>쓰는 곳</CardLabel>
          <ul className="flex flex-col divide-y divide-staff-border-light pt-[10px]">
            {PURPOSES.map((p) => (
              <li key={p.title} className="flex items-center gap-[12px] py-[10px] first:pt-0 last:pb-0">
                <span className="text-staff-text-sub">
                  <MaskIcon src={p.icon} size={20} flipY={p.flipY} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">{p.title}</span>
                  <span className="block text-[12px] text-staff-text-sub">{p.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
          넣은 정보는 <strong>암호화해 보관</strong>합니다. 관리자에게는 일부를 가린 형태로만 보이고, 신고 서류를 만들 때만 씁니다.
        </Notice>
        <Button variant="ghost" onClick={() => setWhy(true)}>
          주민등록번호를 따로 받는 이유
        </Button>
      </div>
      <Dock>
        <Button href={formHref} transitionTypes={["nav-forward"]}>
          <MaskIcon src="/icons/pencil.svg" size={14} />
          넣기
        </Button>
        <p className="py-[2px] text-center text-[12px] text-staff-text-muted">신고 정보를 넣어야 이 근무지에서 일을 시작할 수 있습니다</p>
      </Dock>
      <BottomSheet open={why} onClose={() => setWhy(false)} title="주민등록번호를 따로 받는 이유">
        <div className="flex flex-col gap-[12px] text-[14px] text-staff-text-sub">
          <p>근로계약서에는 임금 · 근로시간 · 휴일 · 연차 같은 근로조건만 적습니다. 본인 확인은 이름과 생년월일로 충분합니다.</p>
          <p>
            주민등록번호는 법령이 허용한 목적으로만 쓸 수 있습니다. 4대보험 신고와 원천징수 밖에 쓰이지 않도록 계약서와 따로 받습니다.
          </p>
          <Notice>관리자는 직원의 주민등록번호를 직접 넣지 않습니다.</Notice>
        </div>
      </BottomSheet>
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
  storeName,
  realName,
  birthDate,
  birthDateLabel,
  banks,
}: {
  /** 소속 id 를 붙인 서버 액션(createTaxProfileAction.bind) — 서버 화면에서 붙여 넘긴다(고치기 화면 주석과 같은 까닭). */
  action: (previous: TaxProfileEditState, formData: FormData) => Promise<TaxProfileEditState>;
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
      return;
    }
    setLocal(undefined);
    sending.current = true;
    startTransition(() => formAction(formData));
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="flex flex-1 flex-col" autoComplete="off">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[22px] font-bold">주민등록번호와 급여 계좌</h2>
          <p className="text-[14px] text-staff-text-sub">신고와 급여 이체에 그대로 쓰이니 정확히 넣어 주세요.</p>
        </div>
        <RrnField
          front={rrnFront}
          back={rrnBack}
          onFrontChange={edit(setRrnFront)}
          onBackChange={edit(setRrnBack)}
          required
          error={mismatch ? RRN_BIRTH_MISMATCH : errorOf("rrn")}
        />
        <PayrollAccountFields
          banks={banks}
          bankCode={bankCode}
          accountNumber={accountNumber}
          onBankChange={edit(setBankCode)}
          onAccountChange={edit(setAccountNumber)}
          required
          bankError={errorOf("bank")}
          accountError={errorOf("account")}
        />
        <TaxIdentity realName={realName} birthDate={birthDateLabel} />
        {problem?.field === "form" && (
          <Alert tone="danger">
            <p>{problem.message}</p>
          </Alert>
        )}
        <TaxOwnerNotice storeName={storeName} noConsent />
      </div>
      <Dock>
        <Button type="submit" disabled={pending || mismatch}>
          등록하기
        </Button>
      </Dock>
    </form>
  );
}
