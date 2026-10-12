"use client";

import { useActionState } from "react";
import { Alert, Button, Notice, TextField } from "@/components/common";
import { AuthScreen } from "../../_components/auth-screen";
import { Countdown, useNow } from "../_components/countdown";
import { resendPinAction, verifyPinAction, type PinState, type ResendState } from "../actions";

// 기준: 데모 docs/demo/src/pages/login 의 pin · pin-out. 10분이 지난 것(pin-out)은 서버가 그릴 때 이미 지났으면 expired 로,
// 화면을 연 채로 지나면 시계로 안다.
// 틀림 · 5회로 닫힘은 api 가 가르지 않아(같은 401) pin-closed 를 따로 두지 않고 입력칸 오류 한 문구로 합쳤다.
// 남은 시도 횟수는 api 가 주지 않아 보이지 않는다.
export function PinForm({
  expired,
  maskedEmail,
  issuedAt,
  serverNow,
  validMs,
  resendMs,
}: {
  /** 서버가 그릴 때 이미 10분이 지났는지. 화면을 연 채로 지나는 것은 시계가 맡는다. */
  expired: boolean;
  maskedEmail: string;
  issuedAt: number;
  /** 이 화면을 그린 순간의 서버 시각. 휴대폰 시계가 틀려도 issuedAt 과 같은 시계로 세게 한다. */
  serverNow: number;
  validMs: number;
  resendMs: number;
}) {
  const [state, formAction, pending] = useActionState<PinState, FormData>(verifyPinAction, { pin: "" });
  const [resend, resendAction, resending] = useActionState<ResendState, FormData>(resendPinAction, {});
  const now = useNow(serverNow);
  // 다시 받으면 서버가 쿠키의 issuedAt 을 새로 쓰고, 이 화면은 서버 컴포넌트가 다시 그려 새 값을 받는다.
  const resendLeft = now === null ? resendMs : Math.max(0, issuedAt + resendMs - now);
  // 다시 받은 뒤에는 앞 핀으로 낸 오류가 새 안내를 가리지 않게 한다.
  const pinError = "error" in state && state.issuedAt === issuedAt ? state.error : undefined;

  if (expired || (now !== null && now >= issuedAt + validMs)) {
    return (
      <form action={resendAction} className="flex flex-1 flex-col">
        <AuthScreen
          title="인증번호가 만료되었습니다"
          description="보낸 지 10분이 지났습니다. 다시 받아 주세요."
          dock={
            <>
              <Button type="submit" disabled={resending}>
                인증번호 다시 받기
              </Button>
              <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        >
          {resend.error ? (
            <Alert tone="danger">{resend.error}</Alert>
          ) : (
            <Alert tone="warning">
              남은 시도가 있어도 <strong>10분이 지나면 만료</strong>됩니다.
            </Alert>
          )}
        </AuthScreen>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        title="인증번호를 넣어 주세요"
        description={
          <>
            <span className="tabular-nums">{maskedEmail}</span> 으로 여섯 자리를 보냈습니다.
          </>
        }
        dock={
          <>
            <Button type="submit" disabled={pending}>
              확인
            </Button>
            {/* formAction 은 submit 버튼에서만 동작한다(공통 Button 의 기본은 type="button"). */}
            <Button
              variant="ghost"
              type="submit"
              formAction={resendAction}
              formNoValidate
              disabled={resending || resendLeft > 0}
            >
              {resendLeft > 0 ? `다시 받기 · ${Math.ceil(resendLeft / 1000)}초 뒤` : "다시 받기"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[8px]">
          <TextField
            label="인증번호"
            name="pin"
            type="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            required
            maxLength={20}
            defaultValue={state.pin}
            error={pinError ?? resend.error}
            help={resend.notice}
          />
          <div className="text-[12px] text-staff-text-muted">
            <Countdown deadline={issuedAt + validMs} serverNow={serverNow} />
          </div>
        </div>
        <Notice>
          메일이 오지 않으면 스팸함을 확인해 주세요. 1분 뒤 다시 받을 수 있고, 하루 10번까지 받을 수 있습니다. 다시 받으면{" "}
          <strong>앞서 보낸 인증번호는 바로 무효</strong>가 됩니다.
        </Notice>
      </AuthScreen>
    </form>
  );
}
