"use client";

import { useActionState, useState } from "react";
import { Button, Dock, Notice, TextField } from "@/components/common";
import { NewPasswordFields } from "@/app/_components/new-password-fields";
import { useFieldCheck } from "@/app/_components/use-field-check";
import type { PasswordChangeState, PasswordField } from "@/lib/password-change";
import { changePasswordAction } from "./actions";

// 기준: 데모 docs/demo/me 의 password(ME-4). 넣는 동안 조건 목록이 맞음 · 아직을 보이고(src/lib/password-rules.ts),
// 저장이 실패하면 api 사유를 그 칸 아래에 보인다. 조건 판정은 api 가 한다.
export function PasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<PasswordChangeState, FormData>(changePasswordAction, {});
  // React 19 폼 액션은 제출 뒤 비제어 칸을 비운다. 새 비밀번호 규칙 위반 뒤에도 지금 비밀번호를 다시 넣지 않게 상태로 든다.
  const [currentPassword, setCurrentPassword] = useState("");
  // 브라우저 말풍선 대신 칸 아래 문구(use-field-check). 빈 칸만 거르고(문구는 서버 액션과 같다) 규칙 · 일치는 서버 액션이 거른다.
  const fields = useFieldCheck((data) => ({
    currentPassword: data.get("currentPassword") ? undefined : "현재 비밀번호를 입력해 주세요",
    newPassword: data.get("newPassword") ? undefined : "새 비밀번호를 입력해 주세요",
    newPasswordConfirmation: data.get("newPasswordConfirmation") ? undefined : "새 비밀번호 확인을 입력해 주세요",
  }));
  const serverErrorOf = (field: PasswordField) => (state.problem?.field === field ? state.problem.message : undefined);

  return (
    <form action={formAction} noValidate onSubmit={fields.check} onChange={fields.clear} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]">
        <TextField
          label="현재 비밀번호"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="현재 비밀번호 입력"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={fields.messageOf("currentPassword", serverErrorOf("currentPassword"))}
        />
        <NewPasswordFields
          email={email}
          newPasswordError={fields.messageOf("newPassword", serverErrorOf("newPassword"))}
          confirmationError={fields.messageOf("newPasswordConfirmation", serverErrorOf("confirmation"))}
        />
        <Notice>
          비밀번호 변경 후에도 <strong>현재 기기에서는 로그인이 유지</strong>되며, 다른 기기에서는 다시 로그인해야 합니다.
        </Notice>
      </div>
      <Dock>
        <Button type="submit" disabled={pending}>
          변경하기
        </Button>
        <Button variant="ghost" href="/me" transitionTypes={["nav-back"]}>
          취소
        </Button>
      </Dock>
    </form>
  );
}
