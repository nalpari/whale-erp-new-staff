"use client";

import { useActionState, type ReactNode } from "react";
import { Alert, Button, Card, Notice, TextField } from "@/components/common";
import { AuthScreen } from "../_components/auth-screen";
import { useFocusedTitle } from "../_components/use-focused-title";
import { useNow } from "@/app/_components/countdown";
import { type AttemptLock, lockCountdown } from "@/lib/attempt-lock";
import { findEmailAction, type EmailFindState, type EmailFindValues } from "./actions";

// 기준: 데모 docs/demo/src/pages/login 의 find · found · find-fail · find-lock (LOGIN-8 · 9 · 10).
// 남은 시도 횟수(데모의 「남은 시도는 2번」)는 api 가 주지 않아 보이지 않는다.
// 생년월일은 데모처럼 글자 칸이다. 숫자 8자리도 받아 서버 액션이 YYYY-MM-DD 로 바꾼다.
// 결과 화면의 「다시 넣기」도 같은 서버 액션으로 제출한다(넣은 값을 숨은 칸에 실어 보냄). 그래서 JS 없이 보낸 경우에도
// 동작하고, 넣은 값이 칸에 되돌아온다.

const EMPTY: EmailFindValues = { name: "", phone: "", birthDate: "" };

export function EmailFindForm() {
  const [state, formAction, pending] = useActionState<EmailFindState, FormData>(findEmailAction, { step: "input", values: EMPTY });

  if (state.step === "found") return <Found emails={state.emails} />;
  if (state.step === "not-found")
    return (
      <RetryForm action={formAction} values={state.values}>
        <NotFound pending={pending} />
      </RetryForm>
    );
  if (state.step === "locked")
    return (
      <RetryForm action={formAction} values={state.values}>
        <Locked lock={state} pending={pending} />
      </RetryForm>
    );

  const { values } = state;
  const error = state.error ? state : null;
  return (
    // 결과 화면에서 돌아오면 폼이 새로 붙어 defaultValue 로 넣은 값을 되돌린다.
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title="로그인 이메일을 찾습니다"
        description={
          <>
            가입할 때 <strong>본인인증으로 확인된 세 가지</strong>를 넣으면 그 이메일을 찾아 드립니다.
          </>
        }
        dock={
          <>
            <Button type="submit" disabled={pending}>
              이메일 찾기
            </Button>
            <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
              로그인으로 돌아가기
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[16px]">
          <TextField
            label="이름"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={50}
            defaultValue={values.name}
            error={error?.field === "name" ? error.error : undefined}
          />
          <TextField
            label="휴대전화번호"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={13}
            placeholder="010-1234-5678"
            defaultValue={values.phone}
            error={error?.field === "phone" ? error.error : undefined}
          />
          <TextField
            label="생년월일"
            name="birthDate"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            required
            maxLength={12}
            placeholder="1999-04-12"
            defaultValue={values.birthDate}
            help="가입 때 본인인증으로 확정된 값과 같아야 합니다."
            error={error?.field === "birthDate" ? error.error : undefined}
          />
        </div>
        {error?.field === "form" ? (
          <Alert tone="danger">{error.error}</Alert>
        ) : (
          <Notice>세 값이 모두 맞아야 알려 드립니다. 하나라도 다르면 어느 값이 틀렸는지는 알려 주지 않습니다.</Notice>
        )}
      </AuthScreen>
    </form>
  );
}

/** 결과 화면의 「다시 넣기」 폼. 넣은 값을 숨은 칸에 실어 같은 액션으로 보내면, 액션은 api 를 부르지 않고 입력 화면을 돌려준다. */
function RetryForm({ action, values, children }: { action: (formData: FormData) => void; values: EmailFindValues; children: ReactNode }) {
  return (
    <form action={action} className="flex flex-1 flex-col">
      <input type="hidden" name="intent" value="retry" />
      <input type="hidden" name="name" value={values.name} />
      <input type="hidden" name="phone" value={values.phone} />
      <input type="hidden" name="birthDate" value={values.birthDate} />
      {children}
    </form>
  );
}

function Found({ emails }: { emails: string[] }) {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="가입된 이메일입니다"
      dock={
        <>
          <Button href="/login" transitionTypes={["nav-back"]}>
            로그인하러 가기
          </Button>
          <Button variant="ghost" href="/password-reset" transitionTypes={["nav-forward"]}>
            비밀번호도 다시 정하기
          </Button>
        </>
      }
    >
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">로그인 이메일 {emails.length}개</p>
        <ul className="pt-[4px]">
          {/* 가린 값은 겹칠 수 있다(kim1a · kim2a → ki**a). 순서는 api 가 정한 가입 순서라 자리로 구분한다. */}
          {emails.map((email, index) => (
            <li key={`${index}:${email}`} className="border-b border-staff-border-light py-[10px] text-[16px] font-semibold tabular-nums last:border-b-0">
              {email}
            </li>
          ))}
        </ul>
        <p className="pt-[6px] text-[12px] text-staff-text-muted">
          @ 앞은 처음 두 글자와 마지막 한 글자만 보이고 나머지는 글자 수만큼 가립니다. 도메인으로 어느 메일함인지 알아볼 수 있습니다.
        </p>
      </Card>
      <Notice>
        <strong>다음에 할 일</strong>
        <br />이 이메일로 로그인하세요. 비밀번호가 기억나지 않으면 이 주소로 인증번호를 받아 다시 정할 수 있습니다.
      </Notice>
    </AuthScreen>
  );
}

function NotFound({ pending }: { pending: boolean }) {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="맞는 계정을 찾지 못했습니다"
      description="세 값이 가입 때 확인된 값과 다릅니다."
      dock={
        <>
          <Button type="submit" disabled={pending}>
            다시 넣기
          </Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    >
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">이럴 때가 많습니다</p>
        <ul className="flex flex-col pt-[2px] text-[13px] font-medium">
          <li className="border-b border-staff-border-light py-[8px]">휴대전화번호가 가입 뒤에 바뀐 경우</li>
          <li className="py-[8px]">이름의 띄어쓰기나 생년월일이 다른 경우</li>
        </ul>
        <p className="pt-[6px] text-[12px] text-staff-text-muted">
          다섯 번 틀리면 5분 동안 막습니다. 그때는 근무지 점포에 직접 방문해 물어 주세요.
        </p>
      </Card>
    </AuthScreen>
  );
}

function Locked({ lock, pending }: { lock: AttemptLock; pending: boolean }) {
  const titleRef = useFocusedTitle();
  // 버튼을 언제 여는지는 lockCountdown 이 정한다. 이 버튼은 submit 이라 JS 가 없어도 동작하고, 일찍 누르면 api 가 다시 막힘으로 답할 뿐이다.
  const { text, waiting } = lockCountdown(lock, useNow(lock.serverNow));
  return (
    <AuthScreen
      titleRef={titleRef}
      title="잠시 막았습니다"
      description="다섯 번 틀렸습니다. 아래 시간이 지나면 다시 시도할 수 있습니다."
      dock={
        <>
          <Button type="submit" disabled={waiting || pending}>
            {waiting ? `다시 넣기 · ${text} 뒤` : "다시 넣기"}
          </Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    >
      <Card>
        <div className="flex flex-col items-center text-center">
          <p className="text-[13px] font-semibold text-staff-text-sub">다시 시도까지</p>
          <p className="pt-[4px] text-[32px] font-bold tabular-nums">{text}</p>
          <p className="pt-[6px] text-[12px] text-staff-text-muted">막는 시간은 5분입니다. 로그인 잠금과 같은 규칙입니다.</p>
        </div>
      </Card>
      <Notice>
        <strong>근무지 점포에 직접 방문해 물어 주세요.</strong> 본인이 맞는지 얼굴을 보고 확인한 뒤에만 알려 드립니다. 전화나 메시지로는
        알려 드릴 수 없습니다. 이메일은 알지만 그 메일함을 쓸 수 없을 때도 같습니다.
      </Notice>
    </AuthScreen>
  );
}
