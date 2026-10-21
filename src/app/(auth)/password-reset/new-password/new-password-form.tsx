"use client";

import { useActionState } from "react";
import { Button, Notice } from "@/components/common";
import { AuthScreen } from "../../_components/auth-screen";
import { Countdown } from "@/app/_components/countdown";
import { NewPasswordFields } from "@/app/_components/new-password-fields";
import { resetPasswordAction, type NewPasswordState } from "../actions";

// 기준: 데모 docs/demo/src/pages/login 의 newpw. newpw-out(핀 무효 401)은 핀 요청 화면의 ?timeout=1 로 보낸다.
export function NewPasswordForm({ email, deadline, serverNow }: { email: string; deadline: number; serverNow: number }) {
  const [state, formAction, pending] = useActionState<NewPasswordState, FormData>(resetPasswordAction, {});

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title="새 비밀번호를 정해 주세요"
        description="현재 비밀번호는 묻지 않습니다. 인증번호로 본인을 확인했습니다. 이 인증번호는 여기서 비밀번호를 정하면 무효가 됩니다."
        dock={
          <>
            <p className="pb-[6px] text-center text-[12px] text-staff-text-muted">인증번호를 받은 때부터 10분 안에 마쳐 주세요</p>
            <Button type="submit" disabled={pending}>
              비밀번호 정하기
            </Button>
          </>
        }
      >
        <div className="text-[12px] text-staff-text-muted">
          <Countdown deadline={deadline} serverNow={serverNow} />
        </div>
        <NewPasswordFields
          email={email}
          newPasswordError={state.field === "newPassword" ? state.error : undefined}
          confirmationError={state.field === "newPassword" ? undefined : state.error}
        />
        <Notice>
          새로 정하면 <strong>다른 기기의 로그인이 모두 끊기고</strong> 잠금도 함께 풀립니다.
        </Notice>
      </AuthScreen>
    </form>
  );
}
