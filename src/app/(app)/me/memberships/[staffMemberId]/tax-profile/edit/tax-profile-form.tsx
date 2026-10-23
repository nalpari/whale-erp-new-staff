"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { Alert, Button, Dock } from "@/components/common";
import { PayrollAccountFields, RrnField } from "@/app/_components/tax-profile-fields";
import { TaxIdentity, TaxOwnerNotice } from "@/app/_components/tax-profile-parts";
import type { CodeValue } from "@/lib/codes";
import {
  RRN_BIRTH_MISMATCH,
  readTaxProfileForm,
  rrnBirthMismatch,
  validateTaxProfileEdit,
  type TaxProfileEditState,
  type TaxProfileField,
} from "@/lib/tax-profile";
import { saveTaxProfileAction } from "./actions";

// 기준: 데모 docs/demo/tax 의 form(· mismatch). 이 화면은 이미 낸 신고 정보를 고친다(WHALEERP-333) — 칸은 모두 비어 있고,
// 넣은 쪽만 보낸다(주민등록번호만 · 급여 계좌만 · 둘 다). 데모와 다른 점: 급여 계좌는 은행 고르기와 계좌번호 두 칸이고,
// 제목 · 버튼이 고치기 문맥이다. 주민등록번호 앞 6자리 · 뒷자리 첫 자리가 가리키는 생년월일이 가입 생년월일과 다르면 데모처럼 칸 아래 오류와 함께 저장을 막는다.
// 값은 이 화면이 상태로 든다 — 서버 액션은 실패해도 넣은 값을 되돌려 주지 않는다(주민등록번호 원문을 화면으로 다시 내리지 않게).
export function TaxProfileForm({
  staffMemberId,
  storeName,
  realName,
  birthDate,
  birthDateLabel,
  banks,
  backHref,
}: {
  staffMemberId: string;
  storeName: string;
  realName: string;
  /** 가입 생년월일 YYYY-MM-DD — 주민등록번호 앞자리를 맞춰 본다. */
  birthDate: string;
  birthDateLabel: string;
  banks: readonly CodeValue[];
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState<TaxProfileEditState, FormData>(
    saveTaxProfileAction.bind(null, staffMemberId),
    {},
  );
  const [rrnFront, setRrnFront] = useState("");
  const [rrnBack, setRrnBack] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  // 화면에서 먼저 거른 오류. 보내기 전에 걸러 잘못된 값(주민등록번호 포함)을 서버로 보내지 않는다. 서버 액션도 다시 거른다.
  const [local, setLocal] = useState<TaxProfileEditState["problem"]>();
  // 값을 고치기 시작하면 지난 서버 오류는 맞지 않는 안내라 가린다 — 그때의 상태를 적어 두고, 다음 응답(새 상태)부터 다시 보인다.
  // 다시 보내는 동안(pending)도 가린다.
  const [dismissed, setDismissed] = useState<TaxProfileEditState | null>(null);
  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setLocal(undefined);
    setDismissed(state);
  };
  const mismatch = rrnBirthMismatch(rrnFront, rrnBack, birthDate);
  const problem = local ?? (pending || state === dismissed ? undefined : state.problem);
  const errorOf = (field: TaxProfileField) => (problem?.field === field ? problem.message : undefined);

  // <form action> 이 아니라 onSubmit 으로 보낸다 — React 19 는 폼 액션이 끝나면 폼을 되돌려(reset) 고른 은행 같은 칸이 상태와
  // 어긋나게 비워진다. 실패해도 넣은 값이 그대로 남아야 고쳐 넣기 쉽다.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const checked = validateTaxProfileEdit(readTaxProfileForm(formData));
    if (!("body" in checked)) {
      setLocal(checked.problem);
      return;
    }
    setLocal(undefined);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col" autoComplete="off">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[22px] font-bold">바꿀 값만 새로 넣어 주세요</h2>
          <p className="text-[14px] text-staff-text-sub">
            비워 둔 쪽은 지금 값 그대로 둡니다. 신고 서류와 급여 이체에 그대로 쓰이니 다시 한 번 확인해 주세요.
          </p>
        </div>
        <RrnField
          front={rrnFront}
          back={rrnBack}
          onFrontChange={edit(setRrnFront)}
          onBackChange={edit(setRrnBack)}
          help="뒷자리는 본인에게도 다시 보여주지 않습니다. 고치려면 새로 넣습니다."
          error={mismatch ? RRN_BIRTH_MISMATCH : errorOf("rrn")}
        />
        <PayrollAccountFields
          banks={banks}
          bankCode={bankCode}
          accountNumber={accountNumber}
          onBankChange={edit(setBankCode)}
          onAccountChange={edit(setAccountNumber)}
          help="예금주가 본인이어야 합니다. 계좌를 바꾸면 다음 급여부터 새 계좌로 들어갑니다."
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
          저장하기
        </Button>
        <Button variant="ghost" href={backHref} transitionTypes={["nav-back"]}>
          그대로 두기
        </Button>
      </Dock>
    </form>
  );
}
