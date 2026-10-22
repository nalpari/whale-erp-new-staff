"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Notice, TextField } from "@/components/common";
import { INVITE_CODE_LENGTH, formatPhone, normalizeInviteCode } from "@/lib/join";
import { AuthScreen } from "../_components/auth-screen";
import { checkInviteCodeAction, type InviteCodeState } from "./actions";
import { AccountExists, CodeLocked, EndedInvitation, JoinSteps, JoinedInvitation } from "./screens";

// 기준: 목업 join 의 code · code-fail · code-locked (JOIN-7).
// 번호는 숫자만 받아 하이픈을 화면이 넣고, 코드는 대문자로 맞춘다. 두 칸이 다 차야 「다음」이 켜진다.
// 틀리면 어느 칸이 틀렸는지 알리지 않고 버튼 위에 한 문구만 보인다. 맞으면 서버 액션이 초대 확인(/join/invitation)으로 보낸다.
// 칸은 상태로 든다 — React 19 폼 액션은 제출 뒤 칸을 비우는데, 틀렸을 때 넣은 값을 그대로 두고 고치게 한다.
export function InviteCodeForm() {
  const [state, formAction, pending] = useActionState<InviteCodeState, FormData>(checkInviteCodeAction, { step: "input" });
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  // 「다시 넣기」 · 「새 초대 코드 넣기」로 걷어 낸 결과. 같은 결과 객체로는 그 화면을 다시 그리지 않는다(로그인 잠금과 같다).
  const [dismissed, setDismissed] = useState<InviteCodeState | null>(null);

  if (state.step === "locked" && state !== dismissed) return <CodeLocked lock={state} onRetry={() => setDismissed(state)} />;
  if (state.step === "ended" && state !== dismissed) return <EndedInvitation onRetry={() => setDismissed(state)} />;
  if (state.step === "joined") return <JoinedInvitation />;
  if (state.step === "has-account") return <AccountExists />;

  const error = state.step === "input" ? state : null;
  const digits = phone.replace(/\D/g, "").length;
  const filled = digits >= 10 && code.length === INVITE_CODE_LENGTH;
  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        eyebrow={<JoinSteps via="code" step="초대 코드" />}
        title="초대 코드를 넣어 주세요"
        description="초대를 받은 휴대전화번호와 8자리 초대 코드를 함께 넣습니다."
        dock={
          <>
            <Button type="submit" disabled={pending || !filled}>
              다음
            </Button>
            <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
              로그인으로 돌아가기
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[16px]">
          <TextField
            label="휴대전화번호"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={13}
            placeholder="010-1234-5678"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            help="초대를 받은 번호입니다. 숫자만 넣으면 하이픈은 저절로 들어갑니다."
            error={error?.field === "phone" ? error.error : undefined}
          />
          <TextField
            label="초대 코드"
            name="code"
            type="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            required
            placeholder="K7M4Q9TX"
            value={code}
            // 띄어 쓴 코드(「K7M4 Q9TX」)를 붙여 넣어도 공백을 뺀 8자리가 남게 칸이 아니라 여기서 자른다.
            onChange={(event) => setCode(normalizeInviteCode(event.target.value).slice(0, INVITE_CODE_LENGTH))}
            help="8자리입니다. 두 칸을 모두 채우면 「다음」이 켜집니다."
            error={error?.field === "code" ? error.error : undefined}
          />
        </div>
        {error?.field === "form" ? (
          <Alert tone="danger">{error.error}</Alert>
        ) : (
          <Notice>초대 코드는 근무지에서 보낸 알림톡 · 문자에 있습니다. 받지 못했으면 근무지에 다시 보내 달라고 요청해 주세요.</Notice>
        )}
      </AuthScreen>
    </form>
  );
}
