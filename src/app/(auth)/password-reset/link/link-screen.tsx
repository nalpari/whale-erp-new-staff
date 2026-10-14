"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Alert, Button, Notice } from "@/components/common";
import { AuthScreen, CONNECTION_FAILED_MESSAGE } from "../../_components/auth-screen";
import { NewPasswordFields } from "../_components/new-password-fields";
import { openLinkAction, resetPasswordWithLinkAction, type LinkPasswordState, type OpenLinkState } from "../actions";

// 기준: 데모 docs/demo/src/pages/login 의 temp(새 비밀번호) · link-used(쓸 수 없는 링크).
// 열리면 주소의 #token= 을 읽어 확인한다. 쓸 수 있으면 토큰을 서버 쿠키로 옮기고, 확인이 끝나면(쓸 수 있든 없든) 주소에서 지운다
// (화면 기록 · 공유 · 어깨너머로 남지 않게) — 연결 실패일 때만 남긴다. 확인을 마친 뒤 새로고침하면 주소에 토큰이 없으므로 서버 액션이
// 쿠키의 토큰으로 다시 확인한다.
export function LinkScreen() {
  const [link, setLink] = useState<OpenLinkState | null>(null);
  const [checking, startChecking] = useTransition();
  const opened = useRef(false);

  const check = useCallback(() => {
    startChecking(async () => {
      const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("token");
      let result: OpenLinkState;
      try {
        result = await openLinkAction(fromHash);
      } catch (error) {
        // 휴대폰 연결이 끊겨 서버 액션 요청 자체가 실패하면 fetch 의 TypeError 다. api 연결 실패와 같은 화면(다시 시도)으로 보낸다.
        // 그 밖의 오류는 (auth)/error.tsx 가 받는다.
        if (!(error instanceof TypeError)) throw error;
        console.error("[password-reset-link] 서버 액션 요청 실패", error);
        result = { status: "error", error: CONNECTION_FAILED_MESSAGE };
      }
      // 연결 실패면 주소의 토큰을 남겨 「다시 시도」 · 새로고침으로 이어 갈 수 있게 한다.
      // state 는 null 로 넘긴다 — Next 가 이 호출을 라우터 주소에 반영한다. 라우터의 state 를 그대로 넘기면 라우터는 옛 주소(#token 포함)를
      // 들고 있다가 서버 액션 응답을 반영할 때 되돌려 놓는다.
      if (result.status !== "error" && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      // await 뒤의 상태 변경은 다시 transition 으로 감싸야 checking=false 와 한 번에 그려진다.
      startChecking(() => setLink(result));
    });
  }, []);

  useEffect(() => {
    // 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 확인은 링크를 소진하지 않지만 요청 제한을 아끼려고 한 번만 부른다.
    if (opened.current) return;
    opened.current = true;
    check();
  }, [check]);

  // 화면마다 컴포넌트를 나눴다. 같은 AuthScreen 을 이어 쓰면 확인 중 → 결과로 바뀔 때 다시 붙지 않아 초점을 옮길 때를 놓친다.
  if (!link || (checking && link.status === "error")) return <CheckingLink />;
  if (link.status === "invalid") return <InvalidLink />;
  if (link.status === "error") return <LinkError message={link.error} onRetry={check} />;
  return <LinkPasswordForm />;
}

/**
 * 결과 화면이 붙으면 제목으로 초점을 옮긴다. 주소가 그대로라 화면 읽기 사용자는 바뀐 줄 모르고, 누른 버튼(다시 시도 · 제출)이
 * 사라지면 초점이 body 로 떨어진다.
 */
function useTitleFocus() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);
  return titleRef;
}

function CheckingLink() {
  return (
    <AuthScreen
      title="링크를 확인하는 중입니다"
      description="잠시만 기다려 주세요."
      dock={
        <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
          로그인으로 돌아가기
        </Button>
      }
    />
  );
}

function LinkError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const titleRef = useTitleFocus();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="링크를 확인하지 못했습니다"
      description={message}
      dock={
        <>
          <Button onClick={onRetry}>다시 시도</Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    />
  );
}

function LinkPasswordForm() {
  const titleRef = useTitleFocus();
  const [state, formAction, pending] = useActionState<LinkPasswordState, FormData>(resetPasswordWithLinkAction, {});
  // 정하는 사이 링크가 무효가 됐다(기한 · 새 링크로 대체 · 다른 링크나 인증번호로 이미 정함 · 쿠키 30분 지남).
  if ("invalid" in state) return <InvalidLink />;

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <AuthScreen
        titleRef={titleRef}
        title="새 비밀번호를 정해 주세요"
        description="관리자가 보낸 재설정 링크로 들어왔습니다. 지금 쓰던 비밀번호는 묻지 않습니다."
        dock={
          <Button type="submit" disabled={pending}>
            비밀번호 정하기
          </Button>
        }
      >
        <Alert tone="warning">
          이 링크는 보낸 때로부터 <strong>24시간</strong> 동안, <strong>한 번만</strong> 쓸 수 있습니다. 이 링크나 인증번호로 비밀번호를
          정하고 나면 바로 무효가 됩니다. 관리자는 새 비밀번호를 정하지 못합니다.
        </Alert>
        <NewPasswordFields
          email={null}
          newPasswordError={state.field === "newPassword" ? state.error : undefined}
          confirmationError={state.field === "newPassword" ? undefined : state.error}
        />
        <Notice>
          새로 정하면 <strong>다른 기기의 로그인이 모두 끊기고</strong> 잠금도 함께 풀립니다.
        </Notice>
      </AuthScreen>
    </form>
  );
}

// 없음 · 만료 · 이미 씀 · 새 링크로 대체 · 탈퇴를 api 가 가르지 않는다(운영 정책 ACC-19). 같은 문구로 막는다.
// 첫 문장은 링크 쿠키(30분)만 지난 경우 — 링크는 아직 쓸 수 있어 메일의 링크를 다시 누르면 된다(2026-10-14 노영주).
function InvalidLink() {
  const titleRef = useTitleFocus();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="이 링크는 쓸 수 없습니다"
      description="메일에서 받은 링크를 다시 눌러 보세요. 그래도 안 되면 관리자에게 재설정 링크를 다시 청하거나, 비밀번호 찾기에서 인증번호를 받아 직접 정해 주세요. 기억나는 비밀번호가 있으면 그대로 로그인하셔도 됩니다."
      dock={
        <>
          <Button href="/password-reset" transitionTypes={["nav-forward"]}>
            인증번호로 직접 정하기
          </Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    />
  );
}
