"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Alert, BrandLogo, Button, CheckBox, Notice, TextField } from "@/components/common";
import { useNow } from "@/app/_components/countdown";
import { forgetAffiliationPopup } from "@/lib/affiliation-popup-memory";
import { forgetSignRequestPopup } from "@/lib/sign-request-popup-memory";
import { forgetHqReconsentPopup } from "@/lib/hq-reconsent-popup-memory";
import { type AttemptLock, lockCountdown } from "@/lib/attempt-lock";
import { isEmailShape } from "@/lib/email-change";
import { useFieldCheck } from "@/app/_components/use-field-check";
import { AuthScreen } from "../_components/auth-screen";
import { useFocusedTitle } from "../_components/use-focused-title";
import { loginAction, type LoginState } from "./actions";

// 기준: 데모 docs/demo/src/pages/login 의 login · fail · locked · expired.
// 잠긴 화면은 api 429 의 해제 시각(lockExpiresAt)까지 남은 시간을 보인다. 남은 횟수는 api 가 주지 않아 보이지 않는다.
// 잠긴 화면은 데모 locked 를 따른다 — 경고 판의 남은 시간 · 주 버튼 「비밀번호 재설정」 · 보조 버튼(2026-11-18 데모 기준).
// 보조 버튼은 데모의 「5분 뒤 다시 시도」 대신 남은 시간을 그대로 보인다 — 다시 잠기면 5분보다 적게 남아 고정 문구가 틀린다.
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
  // 브라우저 말풍선 대신 칸 아래 문구(use-field-check). 문구는 서버 액션과 같다.
  const fields = useFieldCheck((data) => {
    const email = String(data.get("email") ?? "").trim();
    return {
      email: !email ? "이메일을 입력해 주세요" : isEmailShape(email) ? undefined : "이메일 형식을 확인해 주세요",
      password: data.get("password") ? undefined : "비밀번호를 입력해 주세요",
    };
  });

  if (state.locked && state !== dismissed) {
    return <Locked lock={state} onRetry={() => setDismissed(state)} />;
  }

  return (
    // 로그인하면 소속 추가 요청 팝업(WHALEERP-144) · 서명 요청 팝업(148) · 사업자 제공 다시 동의 팝업의 「나중에」 기억을 지워 로그인 뒤
    // 팝업이 다시 뜨게 한다.
    <form
      action={formAction}
      noValidate
      onChange={fields.clear}
      onSubmit={(event) => {
        if (!fields.check(event)) return;
        forgetAffiliationPopup();
        forgetSignRequestPopup();
        forgetHqReconsentPopup();
      }}
      className="flex flex-1 flex-col"
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <AuthScreen
        top={expired ? undefined : <BrandLogo />}
        // 기본 화면은 데모 login 처럼 로고 아래 제목 · 설명이 없다(제목은 화면 낭독기에만). 만료 안내는 실제 상황이라 둔다
        title={expired ? "로그인이 만료되었습니다" : "로그인"}
        titleHidden={!expired}
        description={
          expired ? "접속이 끝나 다시 로그인해야 합니다. 오래 쓰지 않았거나 다른 곳에서 비밀번호를 바꾼 경우입니다." : undefined
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
            placeholder="가입한 이메일을 입력해 주세요"
            defaultValue={state.email}
            error={fields.messageOf("email", state.field === "email" ? state.error : undefined)}
          />
          <TextField
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            placeholder="비밀번호를 입력해 주세요"
            error={fields.messageOf("password", state.field === "password" ? state.error : undefined)}
          />
          <div className="-my-[8px] flex flex-wrap gap-x-[20px]">
            <CheckBox name="saveEmail" checked={saveEmail} onChange={setSaveEmail}>
              아이디 저장하기
            </CheckBox>
            <CheckBox name="autoLogin" checked={autoLogin} onChange={setAutoLogin}>
              자동로그인
            </CheckBox>
          </div>
        </div>
        {/* 아무 일도 없을 때는 판을 두지 않는다 — 「30일 동안 다시 묻지 않습니다」 안내는 기본 · 만료 화면 모두 뺐다(2026-10-20 노영주). */}
        {state.field === "form" ? (
          <Alert tone="danger">{state.error}</Alert>
        ) : state.field === "password" ? (
          <Notice>5회 틀리면 5분 동안 로그인할 수 없습니다.</Notice>
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
      title="로그인이 잠시 잠겼습니다"
      // 5분은 잠그는 규칙으로만 말한다. 잠긴 뒤 다시 시도한 경우도 이 화면이라 언제 풀리는지는 아래 남은 시간으로 말한다.
      description={
        <>
          비밀번호를 5회 틀려 5분 동안 로그인할 수 없습니다.
          <br />
          <strong>비밀번호를 재설정하면 바로 로그인할 수 있습니다.</strong>
        </>
      }
      dock={
        <>
          <Button href="/password-reset" transitionTypes={["nav-forward"]}>
            비밀번호 재설정
          </Button>
          <Button variant="ghost" disabled={waiting} onClick={onRetry}>
            {waiting ? `다시 로그인 · ${text} 뒤` : "다시 로그인"}
          </Button>
        </>
      }
    >
      {/* 남은 시간은 데모 locked 처럼 경고 판에 보인다. */}
      <Alert tone="warning">
        <p className="text-[14px] font-semibold">남은 시간</p>
        <p className="text-[28px] font-bold tabular-nums">{text}</p>
      </Alert>
    </AuthScreen>
  );
}
