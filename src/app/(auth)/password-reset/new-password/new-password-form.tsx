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
        title="새 비밀번호 설정"
        description="새로 사용할 비밀번호를 입력해 주세요."
        dock={
          <Button type="submit" disabled={pending}>
            비밀번호 변경
          </Button>
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
          변경하면 <strong>다른 기기에서는 모두 로그아웃</strong>됩니다.
          <br />
          계정 잠금도 함께 해제됩니다.
        </Notice>
      </AuthScreen>
    </form>
  );
}
