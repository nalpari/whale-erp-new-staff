"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Button, Card, Notice, TextField } from "@/components/common";
import { checkPasswordRules } from "@/lib/password-rules";
import { AuthScreen } from "../../_components/auth-screen";
import { Countdown } from "../_components/countdown";
import { resetPasswordAction, type NewPasswordState } from "../actions";

// 기준: 데모 docs/demo/src/pages/login 의 newpw. newpw-out(핀 무효 401)은 핀 요청 화면의 ?timeout=1 로 보낸다.
export function NewPasswordForm({ email, deadline, serverNow }: { email: string; deadline: number; serverNow: number }) {
  const [state, formAction, pending] = useActionState<NewPasswordState, FormData>(resetPasswordAction, {});
  // 400 뒤에도 입력한 새 비밀번호가 남고 조건 목록이 바로 반응하도록 첫 칸은 상태로 든다
  // (React 19 폼 액션은 제출 뒤 비제어 칸을 비운다).
  const [password, setPassword] = useState("");
  const check = checkPasswordRules(password, email);
  const rules = [
    {
      ok: check.kinds,
      text: (
        <>
          영문 대문자 · 소문자 · 숫자 · 기호 중 <b>두 가지 이상</b>을 섞었습니다
        </>
      ),
    },
    { ok: check.length, text: "세 가지 이상이면 8자, 두 가지면 10자 이상 · 20자 이하" },
    { ok: check.notEmail, text: "이메일 아이디와 겹치지 않기" },
  ];

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
        <div className="flex flex-col gap-[16px]">
          <TextField
            label="새 비밀번호"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={state.field === "newPassword" ? state.error : undefined}
          />
          <TextField
            label="새 비밀번호 확인"
            name="newPasswordConfirmation"
            type="password"
            autoComplete="new-password"
            required
            maxLength={128}
            error={state.field === "newPassword" ? undefined : state.error}
          />
        </div>
        <Card>
          <p className="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p>
          <ul className="flex flex-col pt-[2px]">
            {rules.map((rule, index) => (
              <li
                key={index}
                className={`flex items-center gap-[8px] py-[6px] text-[13px] ${rule.ok ? "font-medium" : "text-staff-text-muted"}`}
              >
                {rule.ok ? (
                  // 맞은 조건은 초록 체크(#16a34a, 배지 「정상」 글자색)
                  <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
                    <Image src="/icons/check.svg" alt="" width={10} height={10} />
                  </span>
                ) : (
                  <span className="size-[16px] shrink-0 rounded-full border border-staff-border" />
                )}
                <span>
                  {rule.text}
                  <span className="sr-only">{rule.ok ? " · 맞음" : " · 아직"}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Notice>
          새로 정하면 <strong>다른 기기의 로그인이 모두 끊기고</strong> 잠금도 함께 풀립니다.
        </Notice>
      </AuthScreen>
    </form>
  );
}
