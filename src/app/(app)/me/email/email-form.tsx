"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Button, Dock, Notice, TextField } from "@/components/common";
import { Countdown, formatLeft, useNow } from "@/app/_components/countdown";
import { INITIAL_EMAIL_STATE, type EmailChangeState, type PinState } from "@/lib/email-change";
import { emailChangeAction } from "./actions";

// 기준: 데모 docs/demo/me 의 email · email-pin(ME-3). 이메일이 로그인 아이디라 새 이메일로 받은 인증번호를 확인한 뒤에만 바뀐다.
// 두 단계를 한 화면의 서버 액션 상태로 바꿔 그린다. 데모의 「남은 시도 5회」는 api 가 주지 않아 보이지 않는다.
// 지금 비밀번호(WHALEERP-607, 운영 정책 ACC-13)는 데모에 없어 새 이메일 아래에 더했다.

/** 단계가 바뀔 때 제목에 초점을 옮긴다. 같은 화면에서 바뀌어 경로 알림이 없고, 누른 버튼이 사라져 초점이 body 로 떨어진다. */
// 정돈 시안 ⑲(2026-11-20 사용자 지정): 흰 바탕 · 큰 제목(24, 두 줄) · 설명 15, 현재 아이디는 근무지 상자 모양, 주의 안내는 새 이메일 칸 바로 아래 한 줄.
function Lead({ title, children }: { title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="flex flex-col gap-[8px] break-keep">
      <h2 ref={ref} tabIndex={-1} className="text-[24px] leading-[1.42] font-bold outline-none">
        {title}
      </h2>
      <p className="text-[15px] text-staff-text-sub">{children}</p>
    </div>
  );
}

const BODY = "flex flex-col gap-[20px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState<EmailChangeState, FormData>(emailChangeAction, INITIAL_EMAIL_STATE);
  // 지금 비밀번호는 서버 액션 상태에 싣지 않고(화면으로 되돌아가는 값이다) 여기서 들고, 보낼 때마다 붙인다 — 인증번호 단계의
  // 다시 받기도 비밀번호가 있어야 한다. 상태로 들어 실패한 뒤 · 인증번호 단계에서 돌아온 뒤에도 남는다.
  const [currentPassword, setCurrentPassword] = useState("");
  const send = (formData: FormData) => {
    formData.set("currentPassword", currentPassword);
    formAction(formData);
  };

  // 다시 받으면(deadline 이 바뀜) 새로 붙여 앞서 넣은 옛 번호를 비운다 — 새 번호를 보내면 옛 번호는 더 쓸 수 없다.
  if (state.step === "pin") return <PinStep key={state.deadline} state={state} action={send} pending={pending} />;

  return (
    <form action={send} className="flex flex-1 flex-col bg-white">
      <div className={BODY}>
        <Lead
          title={
            <>
              이메일을 변경하면
              <br />
              로그인 아이디도 변경됩니다
            </>
          }
        >
          새 이메일로 인증번호를 보내드립니다.
          <br />
          인증이 완료되면 변경된 이메일로 로그인할 수 있습니다.
        </Lead>
        <div className="flex items-center gap-[12px] rounded-[16px] border border-staff-border bg-staff-bg py-[12px] pr-[16px] pl-[12px]">
          <span aria-hidden className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-white text-staff-text-sub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </span>
          <p className="flex min-w-0 flex-col">
            <span className="text-[12px] text-staff-text-muted">현재 아이디</span>
            <span className="truncate text-[16px] font-bold">{currentEmail}</span>
          </p>
        </div>
        {/* 인증번호 단계에서 돌아오면 폼이 새로 붙어 defaultValue 로 넣은 값을 되돌린다. */}
        <TextField
          label="새 이메일"
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="새 이메일을 입력해 주세요"
          defaultValue={state.newEmail}
          error={state.problem?.field === "newEmail" ? state.problem.message : undefined}
        />
        {/* 새 이메일 칸에 대한 주의라 그 칸 바로 아래(위 칸과 8 — 칸 안내 간격)에 둔다. 글자색은 경고 판과 같은 #956013 */}
        <p className="-mt-[12px] flex gap-[6px] text-[13px] leading-[1.5] break-keep text-[#956013]">
          <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-[2px] shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.5" />
          </svg>
          <span>비밀번호 재설정 인증번호도 이 이메일로 보내 드립니다. 메일을 받을 수 있는 주소인지 확인해 주세요.</span>
        </p>
        <TextField
          label="현재 비밀번호"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="현재 비밀번호를 입력해 주세요"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={state.problem?.field === "currentPassword" ? state.problem.message : undefined}
        />
        {state.problem?.field === "form" && (
          <Alert tone="danger">
            <p>{state.problem.message}</p>
          </Alert>
        )}
      </div>
      <Dock>
        <Button type="submit" name="intent" value="request" disabled={pending}>
          인증번호 받기
        </Button>
        <Button variant="ghost" href="/me" transitionTypes={["nav-back"]}>
          취소
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
    <form action={action} className="flex flex-1 flex-col bg-white">
      <div className={BODY}>
        {/* 방금 직접 넣은 주소라 가리지 않는다 — 오타를 여기서 알아챌 수 있게(데모는 가렸다). */}
        <Lead title="인증번호 입력">
          {state.newEmail}으로 보낸
          <br />
          인증번호 6자리를 입력해 주세요.
        </Lead>
        <TextField
          label="인증번호"
          name="pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={20}
          placeholder="인증번호 6자리"
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
        <Notice>인증이 끝나기 전까지는 기존 이메일로 로그인합니다.</Notice>
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
          이메일 다시 입력하기
        </Button>
      </Dock>
    </form>
  );
}
