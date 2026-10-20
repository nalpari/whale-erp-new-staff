"use client";

import { useActionState, useState } from "react";
import { Button, Dock, Notice, TextField } from "@/components/common";
import { NewPasswordFields } from "@/app/_components/new-password-fields";
import type { PasswordChangeState, PasswordField } from "@/lib/password-change";
import { changePasswordAction } from "./actions";

// 기준: 데모 docs/demo/me 의 password(ME-4). 넣는 동안 조건 목록이 맞음 · 아직을 보이고(src/lib/password-rules.ts),
// 저장이 실패하면 api 사유를 그 칸 아래에 보인다. 조건 판정은 api 가 한다.
export function PasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<PasswordChangeState, FormData>(changePasswordAction, {});
  // React 19 폼 액션은 제출 뒤 비제어 칸을 비운다. 새 비밀번호 규칙 위반 뒤에도 지금 비밀번호를 다시 넣지 않게 상태로 든다.
  const [currentPassword, setCurrentPassword] = useState("");
  const errorOf = (field: PasswordField) => (state.problem?.field === field ? state.problem.message : undefined);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">
        <TextField
          label="지금 비밀번호"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errorOf("currentPassword")}
        />
        <NewPasswordFields
          email={email}
          newPasswordError={errorOf("newPassword")}
          confirmationError={errorOf("confirmation")}
        />
        <Notice>
          바꾸면 <strong>이 휴대전화의 로그인은 이어지고</strong>, 다른 기기에서는 다시 로그인해야 합니다.
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
