"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Alert, BrandLogo, Button, Card, CheckBox, Notice, TextField } from "@/components/common";
import { useNow } from "@/app/_components/countdown";
import { forgetAffiliationPopup } from "@/lib/affiliation-popup-memory";
import { type AttemptLock, lockCountdown } from "@/lib/attempt-lock";
import { AuthScreen } from "../_components/auth-screen";
import { useFocusedTitle } from "../_components/use-focused-title";
import { loginAction, type LoginState } from "./actions";

// 기준: 데모 docs/demo/src/pages/login 의 login · fail · locked · expired.
// 잠긴 화면은 api 429 의 해제 시각(lockExpiresAt)까지 남은 시간을 보인다. 남은 횟수는 api 가 주지 않아 보이지 않는다.
// 잠긴 화면은 데모 locked 와 달리 이메일 찾기 막힘 화면의 배치를 따른다 — 남은 시간 판 · 주 버튼 「다시 로그인」 · 보조 버튼
// 「비밀번호 재설정」(2026-10-21 노영주).
// 이메일 찾기(`/email-find`)는 이 화면에 버튼이 없고 비밀번호 재설정 화면의 이메일 칸 아래에서 들어간다(데모, 2026-10-20 재영).
// unavailable 은 proxy 의 갱신이 401 · 400 아닌 이유(연결 실패 · 시간 초과 · 429 · 5xx)로 실패한 경우다(접속이 끝났는지 모른다).
// next 는 로그인한 뒤 돌아갈 화면이다(WHALEERP-166, 없으면 홈). 숨은 칸으로 액션에 넘긴다.
// 아이디 저장 · 자동 로그인 체크 박스는 기본이 끔이다(2026-10-20 노영주). 저장된 이메일(savedEmail)이 있으면 칸을 채우고 아이디 저장을 켠다.
export function LoginForm({
  expired,
  reset,
  unavailable,
  next,
  savedEmail,
}: {
  expired: boolean;
  reset: boolean;
  unavailable: boolean;
  next: string | null;
  savedEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, { email: savedEmail ?? "" });
  // React 19 폼 액션은 제출 뒤 칸을 처음 값으로 되돌린다. 실패한 뒤에도 고른 값이 남도록 상태로 든다.
  const [saveEmail, setSaveEmail] = useState(savedEmail !== null);
  const [autoLogin, setAutoLogin] = useState(false);
  // 「다시 로그인」으로 걷어 낸 잠금 결과. 같은 결과 객체로는 잠금 화면을 다시 그리지 않는다(새로 제출해 잠기면 새 객체다).
  const [dismissed, setDismissed] = useState<LoginState | null>(null);

  if (state.locked && state !== dismissed) {
    return <Locked lock={state} onRetry={() => setDismissed(state)} />;
  }

  return (
    // 로그인하면 소속 추가 요청 팝업(WHALEERP-144)의 「다음에 하기」 기억을 지워 로그인 뒤 팝업이 다시 뜨게 한다.
    <form action={formAction} onSubmit={forgetAffiliationPopup} className="flex flex-1 flex-col">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <AuthScreen
        top={expired ? undefined : <BrandLogo />}
        title={expired ? "로그인이 만료되었습니다" : "다시 오셨네요"}
        description={
          expired
            ? "접속이 끝나 다시 로그인해야 합니다. 오래 쓰지 않았거나 다른 곳에서 비밀번호를 바꾼 경우입니다."
            : "근무 정보와 출퇴근을 확인하려면 로그인하세요."
        }
        dock={
          <>
            <Button type="submit" disabled={pending}>
              로그인
              <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
            </Button>
            <Button variant="ghost" href="/password-reset" transitionTypes={["nav-forward"]}>
              비밀번호를 잊으셨나요
            </Button>
            {/* 앱을 직접 연 직원의 가입 시작(WHALEERP-141, 가이드 ①). 초대 링크로 오면 이 화면을 거치지 않는다. */}
            <Button variant="ghost" href="/join" transitionTypes={["nav-forward"]}>
              초대 코드로 가입
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[16px]">
          <TextField
            label="이메일"
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            placeholder="이메일을 입력해 주세요"
            defaultValue={state.email}
            help={state.error ? undefined : "가입할 때 정한 아이디입니다"}
            error={state.field === "email" ? state.error : undefined}
          />
          <TextField
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            placeholder="비밀번호를 입력해 주세요"
            error={state.field === "password" ? state.error : undefined}
          />
          <div className="-my-[8px] flex flex-wrap gap-x-[20px]">
            <CheckBox name="saveEmail" checked={saveEmail} onChange={setSaveEmail}>
              아이디 저장
            </CheckBox>
            <CheckBox name="autoLogin" checked={autoLogin} onChange={setAutoLogin}>
              자동 로그인
            </CheckBox>
          </div>
        </div>
        {/* 아무 일도 없을 때는 판을 두지 않는다 — 「30일 동안 다시 묻지 않습니다」 안내는 기본 · 만료 화면 모두 뺐다(2026-10-20 노영주). */}
        {state.field === "form" ? (
          <Alert tone="danger">{state.error}</Alert>
        ) : state.field === "password" ? (
          <Notice>
            연속 <strong>5</strong>회 틀리면 5분 동안 잠깁니다.
          </Notice>
        ) : state.error ? null : unavailable ? (
          <Alert tone="warning">
            지금 서버에 연결하지 못해 접속을 확인하지 못했습니다. <strong>잠시 뒤 다시 열어 주세요.</strong>
          </Alert>
        ) : reset ? (
          <Notice>
            비밀번호를 바꿨습니다. <strong>새 비밀번호로 로그인해 주세요.</strong> 다른 기기는 모두 로그아웃되었습니다.
          </Notice>
        ) : null}
      </AuthScreen>
    </form>
  );
}

function Locked({ lock, onRetry }: { lock: AttemptLock; onRetry: () => void }) {
  const titleRef = useFocusedTitle();
  // 버튼을 언제 여는지는 lockCountdown 이 정한다. 이 버튼은 submit 이 아니라 화면만 닫는 onClick 이라, 하이드레이션 전에는
  // 열려 있어도 눌러 아무 일이 없고 JS 가 없으면 끝까지 그렇다(그때는 비밀번호 재설정으로 간다). 잠긴 채 다시 제출해도
  // api 가 다시 잠금으로 답할 뿐이다.
  const { text, waiting } = lockCountdown(lock, useNow(lock.serverNow));
  return (
    <AuthScreen
      titleRef={titleRef}
      title="잠시 잠겼습니다"
      // 잠긴 뒤 다시 시도한 경우도 이 화면이라 「5분 뒤」라고 적지 않고 아래 남은 시간으로 말한다.
      description={
        <>
          비밀번호를 연속 다섯 번 틀려 계정이 잠겼습니다. <strong>잠금이 풀린 뒤에 다시 시도하거나 비밀번호를 재설정하세요.</strong>
        </>
      }
      dock={
        <>
          <Button disabled={waiting} onClick={onRetry}>
            {waiting ? `다시 로그인 · ${text} 뒤` : "다시 로그인"}
          </Button>
          <Button variant="ghost" href="/password-reset" transitionTypes={["nav-forward"]}>
            비밀번호 재설정
          </Button>
        </>
      }
    >
      {/* 남은 시간 판과 버튼 배치는 이메일 찾기의 막힘 화면(email-find-form.tsx Locked)과 맞춘다(2026-10-21 노영주). */}
      <Card>
        <div className="flex flex-col items-center text-center">
          <p className="text-[13px] font-semibold text-staff-text-sub">다시 시도까지</p>
          <p className="pt-[4px] text-[32px] font-bold tabular-nums">{text}</p>
          <p className="pt-[6px] text-[12px] text-staff-text-muted">잠그는 시간은 5분입니다.</p>
        </div>
      </Card>
      <Notice>
        기다리기 어려우면 <strong>비밀번호를 다시 정하면</strong> 바로 들어올 수 있습니다. 새로 정하면 잠금도 함께 풀립니다. 잠긴
        동안에는 비밀번호가 맞아도 들어갈 수 없습니다.
      </Notice>
    </AuthScreen>
  );
}
