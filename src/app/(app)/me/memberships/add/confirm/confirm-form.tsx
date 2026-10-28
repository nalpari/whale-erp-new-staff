"use client";

import { useActionState, useState } from "react";
import { Alert, Button } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { HqSharingConsent, InvitationSummary } from "@/app/(auth)/join/screens";
import { acceptMyInvitationAction, type AcceptState } from "../actions";
import { BackToMemberships, MyInvitationProblem } from "../screens";

// 근무지 추가의 초대 확인(WHALEERP-604). 가입의 초대 확인(가이드 ②)과 같은 카드에, 가맹 점포면 본사 제공 동의(선택)를 함께 받는다.
// 계정 정보 · 인적사항 · 약관은 다시 받지 않는다(api 603).
export function AddConfirmForm({
  storeName,
  employmentType,
  expiresOn,
  asksHqSharingConsent,
}: {
  storeName: string;
  employmentType: string;
  expiresOn: string;
  asksHqSharingConsent: boolean;
}) {
  const [state, formAction, pending] = useActionState<AcceptState, FormData>(acceptMyInvitationAction, { step: "input" });
  const [hqSharing, setHqSharing] = useState(false);

  if (state.step === "locked") return <MyInvitationProblem problem={{ kind: "locked", lock: state }} />;
  if (state.step !== "input") return <MyInvitationProblem problem={{ kind: state.step }} />;

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title="근무지를 더할까요?"
        description={
          <>
            <strong>{storeName}</strong>에서 함께 일하자고 초대를 보냈습니다.
          </>
        }
        dock={
          <>
            <Button type="submit" disabled={pending}>
              근무지 추가
            </Button>
            <BackToMemberships />
          </>
        }
      >
        <InvitationSummary storeName={storeName} employmentType={employmentType} expiresOn={expiresOn} />
        {asksHqSharingConsent && <HqSharingConsent checked={hqSharing} onChange={setHqSharing} />}
        {state.error && <Alert tone="danger">{state.error}</Alert>}
      </AuthScreen>
    </form>
  );
}
