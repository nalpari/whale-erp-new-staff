"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Card, TextField } from "@/components/common";
import { AuthScreen } from "../_components/auth-screen";
import { requestPinAction, type RequestPinState } from "./actions";

// 기준: 데모 docs/demo/src/pages/login 의 forgot(이메일 칸 아래 이메일 찾기 링크 포함) · newpw-out(새 비밀번호 화면을 열거나 저장할 때 10분이 지났거나,
// 저장할 때 핀이 닫혔거나 이미 써서 돌아온 경우). 데모 문구는 「바꾸지 않았습니다」라고 단정하지만, 첫 저장이 성공했는데
// 응답만 끊겨 다시 저장한 경우에도 여기로 오므로 단정하지 않게 고쳤다.
export function RequestPinForm({ timedOut }: { timedOut: boolean }) {
  const [state, formAction, pending] = useActionState<RequestPinState, FormData>(requestPinAction, { email: "" });

  if (timedOut) {
    return (
      <AuthScreen
        title="시간이 지났습니다"
        description={
          <>
            인증번호 유효 시간 10분이 지났거나 더 사용할 수 없는 인증번호입니다.
            <br />
            <strong>새 인증번호를 받아 다시 시도해 주세요.</strong>
          </>
        }
        dock={
          <>
            <Button href="/password-reset" transitionTypes={["nav-back"]}>
              인증번호 다시 받기
            </Button>
            <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
              로그인으로 돌아가기
            </Button>
          </>
        }
      >
        <Alert tone="warning">방금 비밀번호를 변경했다면 새 비밀번호로 로그인해 주세요.</Alert>
      </AuthScreen>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title="비밀번호 재설정"
        description={
          <>
            가입한 이메일로 <strong>인증번호</strong>를 보내 드립니다.
          </>
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
          placeholder="가입한 이메일을 입력해 주세요"
          defaultValue={state.email}
          error={state.error}
        />
        {/* 이메일 찾기(LOGIN-8)는 로그인 화면이 아니라 여기 이메일 칸 아래에서 들어간다(데모 forgot, 2026-10-20 재영). */}
        <Link
          href="/email-find"
          transitionTypes={["nav-forward"]}
          className="-mt-[8px] flex min-h-[44px] items-center self-start text-[14px] font-semibold text-staff-text-sub underline underline-offset-2"
        >
          이메일이 기억나지 않나요?
        </Link>
        <Card>
          <p className="text-[13px] font-semibold text-staff-text-sub">이메일을 사용할 수 없다면</p>
          <p className="pt-[6px] text-[13px] text-staff-text-sub">
            관리자에게 알리면 관리자가 초기화를 요청하고, 재설정 링크를 이메일로 받습니다.
            <br />
            <strong className="font-bold text-staff-text">메일함을 사용할 수 없다면 근무지에 직접 방문해 문의해 주세요.</strong> 관리자가
            이메일을 대신 변경할 수는 없습니다.
          </p>
          {/* 가입을 마치지 않은 직원은 계정이 없어 인증번호가 가지 않는다. 화면은 계정 유무를 드러내지 않으려고 누구에게나
              「보냈습니다」로 넘어가므로, 미가입자를 가려 안내할 수 없어 모두에게 보이는 안내로 둔다(WHALEERP-174, 2026-10-13 노영주). */}
          <p className="mt-[12px] border-t border-staff-border-light pt-[12px] text-[13px] font-semibold text-staff-text-sub">
            아직 가입을 마치지 않았다면
          </p>
          <p className="pt-[6px] text-[13px] text-staff-text-sub">
            받은 초대 링크로 가입을 먼저 마쳐 주세요.
            <br />
            링크가 만료되었다면 근무지에 다시 초대해 달라고 요청해 주세요.
          </p>
        </Card>
      </AuthScreen>
    </form>
  );
}
