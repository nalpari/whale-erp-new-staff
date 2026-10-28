"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Notice, TextField } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { CodeLocked, EndedInvitation } from "@/app/(auth)/join/screens";
import { INVITE_CODE_LENGTH, normalizeInviteCode } from "@/lib/join";
import { checkMyInviteCodeAction, type AddCodeState } from "./actions";
import { AlreadyJoined, BackToMemberships } from "./screens";

// 근무지 추가의 초대 코드 입력(WHALEERP-604). 가입 첫 단계(join/invite-code-form.tsx)와 같고 휴대전화번호 칸만 없다 — api 가
// 계정의 번호로 찾는다. 맞으면 서버 액션이 초대 확인(add/confirm)으로 보낸다. 코드 칸은 상태로 든다(틀렸을 때 넣은 값을 둔다).
export function AddCodeForm() {
  const [state, formAction, pending] = useActionState<AddCodeState, FormData>(checkMyInviteCodeAction, { step: "input" });
  const [code, setCode] = useState("");
  // 「다시 넣기」 · 「새 초대 코드 넣기」로 걷어 낸 결과. 같은 결과 객체로는 그 화면을 다시 그리지 않는다.
  const [dismissed, setDismissed] = useState<AddCodeState | null>(null);

  if (state.step === "locked" && state !== dismissed)
    return <CodeLocked lock={state} onRetry={() => setDismissed(state)} leave={<BackToMemberships />} />;
  if (state.step === "ended" && state !== dismissed)
    return <EndedInvitation onRetry={() => setDismissed(state)} leave={<BackToMemberships />} />;
  if (state.step === "joined") return <AlreadyJoined />;

  const error = state.step === "input" ? state : null;
  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title="초대 코드를 넣어 주세요"
        description="다른 근무지에서 받은 8자리 초대 코드를 넣으면 그 근무지를 이 계정에 더합니다."
        dock={
          <>
            <Button type="submit" disabled={pending || code.length !== INVITE_CODE_LENGTH}>
              다음
            </Button>
            <BackToMemberships />
          </>
        }
      >
        <TextField
          label="초대 코드"
          name="code"
          type="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          required
          placeholder="K7M4Q9TX"
          value={code}
          // 띄어 쓴 코드(「K7M4 Q9TX」)를 붙여 넣어도 공백을 뺀 8자리가 남게 칸이 아니라 여기서 자른다.
          onChange={(event) => setCode(normalizeInviteCode(event.target.value).slice(0, INVITE_CODE_LENGTH))}
          help="8자리입니다. 휴대전화번호는 이 계정의 번호로 찾습니다."
          error={error?.field === "code" ? error.error : undefined}
        />
        {error?.field === "form" ? (
          <Alert tone="danger">{error.error}</Alert>
        ) : (
          <Notice>초대 코드는 근무지에서 보낸 알림톡 · 문자에 있습니다. 받지 못했으면 근무지에 다시 보내 달라고 요청해 주세요.</Notice>
        )}
      </AuthScreen>
    </form>
  );
}
