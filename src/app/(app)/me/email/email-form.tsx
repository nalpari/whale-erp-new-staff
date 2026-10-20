"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Button, Dock, Notice, TextField } from "@/components/common";
import { Countdown, formatLeft, useNow } from "@/app/_components/countdown";
import { INITIAL_EMAIL_STATE, type EmailChangeState, type PinState } from "@/lib/email-change";
import { emailChangeAction } from "./actions";

// 기준: 데모 docs/demo/me 의 email · email-pin(ME-3). 이메일이 로그인 아이디라 새 이메일로 받은 인증번호를 확인한 뒤에만 바뀐다.
// 두 단계를 한 화면의 서버 액션 상태로 바꿔 그린다. 데모의 「남은 시도 5회」는 api 가 주지 않아 보이지 않는다.

/** 단계가 바뀔 때 제목에 초점을 옮긴다. 같은 화면에서 바뀌어 경로 알림이 없고, 누른 버튼이 사라져 초점이 body 로 떨어진다. */
function Lead({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="flex flex-col gap-[6px]">
      <h2 ref={ref} tabIndex={-1} className="text-[22px] font-bold outline-none">
        {title}
      </h2>
      <p className="text-[14px] text-staff-text-sub">{children}</p>
    </div>
  );
}

const BODY = "flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState<EmailChangeState, FormData>(emailChangeAction, INITIAL_EMAIL_STATE);

  // 다시 받으면(deadline 이 바뀜) 새로 붙여 앞서 넣은 옛 번호를 비운다 — 새 번호를 보내면 옛 번호는 더 쓸 수 없다.
  if (state.step === "pin") return <PinStep key={state.deadline} state={state} action={formAction} pending={pending} />;

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className={BODY}>
        <Lead title="이메일을 바꾸면 아이디가 바뀝니다">
          새 이메일로 인증번호를 보냅니다. 확인이 끝나면 다음 로그인부터 새 이메일을 씁니다.
        </Lead>
        <div className="flex items-center gap-[12px] rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
          <span className="text-[13px] font-semibold text-staff-text-sub">지금 아이디</span>
          <span className="min-w-0 flex-1 truncate text-right text-[13px]">{currentEmail}</span>
        </div>
        {/* 인증번호 단계에서 돌아오면 폼이 새로 붙어 defaultValue 로 넣은 값을 되돌린다. */}
        <TextField
          label="새 이메일"
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="새로 쓸 이메일"
          defaultValue={state.newEmail}
          error={state.problem?.field === "newEmail" ? state.problem.message : undefined}
        />
        {state.problem?.field === "form" ? (
          <Alert tone="danger">
            <p>{state.problem.message}</p>
          </Alert>
        ) : (
          <Alert tone="warning">
            <p>
              비밀번호를 잊었을 때 인증번호가 이 주소로 갑니다. <strong>받을 수 있는 주소</strong>인지 확인해 주세요.
            </p>
          </Alert>
        )}
      </div>
      <Dock>
        <Button type="submit" name="intent" value="request" disabled={pending}>
          인증번호 받기
        </Button>
        <Button variant="ghost" href="/me" transitionTypes={["nav-back"]}>
          그대로 두기
        </Button>
      </Dock>
    </form>
  );
}

function PinStep({
  state,
  action,
  pending,
}: {
  state: PinState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  // React 19 폼 액션은 제출 뒤 비제어 칸을 비운다. 틀렸을 때 고쳐 넣기 쉽게 칸은 상태로 든다(다시 받으면 key 로 새로 붙어 비워진다).
  const [pin, setPin] = useState("");
  const { feedback } = state;
  const now = useNow(state.serverNow);
  const resendLeft = now === null ? null : state.resendAt - now;
  const canResend = resendLeft !== null && resendLeft <= 0;

  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className={BODY}>
        {/* 방금 직접 넣은 주소라 가리지 않는다 — 오타를 여기서 알아챌 수 있게(데모는 가렸다). */}
        <Lead title="새 이메일로 보낸 번호를 넣어 주세요">{state.newEmail} 으로 보냈습니다.</Lead>
        <TextField
          label="인증번호"
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={20}
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          error={feedback?.kind === "error" && feedback.field === "pin" ? feedback.message : undefined}
        />
        <div className="text-[12px] text-staff-text-sub">
          <Countdown deadline={state.deadline} serverNow={state.serverNow} />
        </div>
        {feedback?.kind === "error" && feedback.field === "form" && (
          <Alert tone="danger">
            <p>{feedback.message}</p>
          </Alert>
        )}
        {/* 다시 받기에 성공하면 제목은 그대로라 초점이 옮겨 가지 않는다. 화면 낭독기가 읽도록 status 로 둔다. */}
        <div role="status">{feedback?.kind === "notice" && <Notice>{feedback.message}</Notice>}</div>
        <Notice>확인이 끝날 때까지 아이디는 그대로 이전 이메일입니다.</Notice>
      </div>
      {/* 「확인」이 첫 제출 버튼이어야 인증번호 칸에서 Enter 를 눌렀을 때 확인이 된다. */}
      <Dock>
        <Button type="submit" name="intent" value="confirm" disabled={pending}>
          확인
        </Button>
        <Button variant="ghost" type="submit" name="intent" value="resend" disabled={pending || !canResend} formNoValidate>
          {canResend || resendLeft === null ? "인증번호 다시 받기" : `${formatLeft(resendLeft)} 뒤 다시 받기`}
        </Button>
        <Button variant="ghost" type="submit" name="intent" value="edit" disabled={pending} formNoValidate>
          이메일 다시 입력
        </Button>
      </Dock>
    </form>
  );
}
