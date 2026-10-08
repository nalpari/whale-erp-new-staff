"use client";

import { useActionState } from "react";
import { Button, Card, Notice, TextField } from "@/components/common";
import { AuthScreen } from "../_components/auth-screen";
import { requestPinAction, type RequestPinState } from "./actions";

// 기준: 데모 /demo/login 의 forgot · newpw-out(10분이 지나 돌아온 경우).
export function RequestPinForm({ timedOut }: { timedOut: boolean }) {
  const [state, formAction, pending] = useActionState<RequestPinState, FormData>(requestPinAction, { email: "" });
  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title={timedOut ? "시간이 지났습니다" : "비밀번호를 다시 정합니다"}
        description={
          timedOut ? (
            "인증번호를 받은 지 10분이 지나 비밀번호를 바꾸지 않았습니다. 인증번호를 다시 받아 주세요."
          ) : (
            <>
              가입할 때 정한 이메일로 <strong>인증번호</strong>를 보냅니다. 관리자를 거치지 않아도 됩니다.
            </>
          )
        }
        dock={
          <>
            <Button type="submit" disabled={pending}>
              인증번호 받기
            </Button>
            <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
              로그인으로 돌아가기
            </Button>
          </>
        }
      >
        <TextField
          label="이메일"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          defaultValue={state.email}
          help="가입할 때 정한 아이디를 넣어 주세요"
          error={state.error}
        />
        <Notice>
          인증번호는 보낸 때부터 <strong>10분</strong> 동안 쓸 수 있습니다. 새 비밀번호도 이 10분 안에 정해 주세요.
        </Notice>
        <Card>
          <p className="text-[13px] font-semibold text-staff-text-sub">이메일을 쓸 수 없다면</p>
          <p className="pt-[6px] text-[13px] text-staff-text-sub">
            관리자에게 알리면 관리자가 초기화를 요청합니다. 그때는 재설정 링크가 이메일로 갑니다.{" "}
            <strong className="font-bold text-staff-text">그 메일함 자체를 쓸 수 없으면 근무지 점포에 직접 방문해 물어 주세요</strong> —
            관리자가 이메일을 대신 고치지는 못합니다.
          </p>
        </Card>
      </AuthScreen>
    </form>
  );
}
