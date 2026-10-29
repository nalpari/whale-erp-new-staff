"use client";

import { useActionState, useState } from "react";
import { Alert, Button } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { HqSharingConsent, InvitationSummary } from "@/app/(auth)/join/screens";
import type { AcceptState } from "../actions";
import { BackToMemberships, InvitationEnded, InvitationJoined } from "../screens";

// 받은 초대 확인(WHALEERP-604). 가입의 초대 확인(가이드 ②)과 같은 카드에, 가맹 점포면 본사 제공 동의(선택)를 함께 받는다.
// 계정 정보 · 인적사항 · 약관은 다시 받지 않는다(api 603).
export function AcceptInvitationForm({
  action,
  storeName,
  employmentType,
  expiresOn,
  asksHqSharingConsent,
}: {
  /** 초대 id 를 붙인 서버 액션(acceptMyInvitationAction.bind) — 서버 화면에서 붙여 넘긴다(신고 정보 고치기 화면 주석과 같은 까닭). */
  action: (previous: AcceptState, formData: FormData) => Promise<AcceptState>;
  storeName: string;
  employmentType: string;
  expiresOn: string;
  asksHqSharingConsent: boolean;
}) {
  const [state, formAction, pending] = useActionState<AcceptState, FormData>(action, { step: "input" });
  const [hqSharing, setHqSharing] = useState(false);

  if (state.step === "ended") return <InvitationEnded />;
  if (state.step === "joined") return <InvitationJoined />;

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
        {"error" in state && state.error && <Alert tone="danger">{state.error}</Alert>}
      </AuthScreen>
    </form>
  );
}
