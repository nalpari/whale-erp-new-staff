"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Alert, BrandLogo, Button, CheckBox, Notice, TextField } from "@/components/common";
import { AuthScreen } from "../_components/auth-screen";
import { loginAction, type LoginState } from "./actions";

// 기준: 데모 docs/demo/src/pages/login 의 login · fail · locked · expired.
// 남은 횟수와 남은 잠금 시간은 api 가 주지 않아 보이지 않는다. 이메일 찾기(`/email-find`)로 가는 링크는 자리가 정해지면 더한다
// (Figma 01.Login 은 버튼 둘).
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
  // 「5분 뒤 다시 시도」로 걷어 낸 잠금 결과. 같은 경로로 가는 링크는 화면을 새로 그리지 않아 상태가 남는다.
  const [dismissed, setDismissed] = useState<LoginState | null>(null);

  if (state.locked && state !== dismissed) {
    return (
      <AuthScreen
        title="잠시 잠겼습니다"
        description={
          <>
            비밀번호를 연속 다섯 번 틀려 계정이 잠겼습니다. <strong>5분 뒤에 다시 시도하거나 비밀번호를 재설정하세요.</strong>
          </>
        }
        dock={
          <>
            <Button href="/password-reset" transitionTypes={["nav-forward"]}>
              비밀번호 재설정
            </Button>
            <Button variant="ghost" onClick={() => setDismissed(state)}>
              5분 뒤 다시 시도
            </Button>
          </>
        }
      >
        <Notice>
          기다리기 어려우면 <strong>비밀번호를 다시 정하면</strong> 바로 들어올 수 있습니다. 새로 정하면 잠금도 함께 풀립니다. 잠긴
          동안에는 비밀번호가 맞아도 들어갈 수 없습니다.
        </Notice>
      </AuthScreen>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
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
