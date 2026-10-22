"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/common";
import { AuthScreen, CONNECTION_FAILED_MESSAGE } from "../_components/auth-screen";
import { useFocusedTitle } from "../_components/use-focused-title";
import { openInviteLinkAction } from "../join/actions";

// 열리면 주소의 #token= 을 읽어 서버 액션에 넘긴다. 모양이 맞으면 액션이 쿠키에 두고 초대 확인으로 보내 주소에서 토큰이 사라진다
// (재설정 링크와 같은 방식, password-reset/link). 넘기지 못했을 때(휴대폰 연결이 끊김)만 이 화면에 남아 다시 시도한다.
export function InviteLinkScreen() {
  const [result, setResult] = useState<"invalid" | "error" | null>(null);
  const [opening, startOpening] = useTransition();
  const opened = useRef(false);

  const open = useCallback(() => {
    startOpening(async () => {
      const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("token");
      let next: "invalid" | "error";
      try {
        // 넘기면 액션이 redirect 해 여기로 돌아오지 않는다.
        next = (await openInviteLinkAction(fromHash)).status;
      } catch (error) {
        // 서버 액션 요청 자체가 실패하면 fetch 의 TypeError 다. 그 밖의 오류는 (auth)/error.tsx 가 받는다.
        if (!(error instanceof TypeError)) throw error;
        console.error("[invite] 서버 액션 요청 실패", error);
        next = "error";
      }
      // await 뒤의 상태 변경은 다시 transition 으로 감싸야 opening=false 와 한 번에 그려진다.
      startOpening(() => setResult(next));
    });
  }, []);

  useEffect(() => {
    // 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 한 번만 넘긴다.
    if (opened.current) return;
    opened.current = true;
    open();
  }, [open]);

  if (!result || opening) return <Opening />;
  if (result === "invalid") return <InvalidLink />;
  return <OpenFailed onRetry={open} />;
}

function Opening() {
  return (
    <AuthScreen
      title="초대를 확인하는 중입니다"
      description="잠시만 기다려 주세요."
      dock={
        <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
          로그인으로 돌아가기
        </Button>
      }
    />
  );
}

function OpenFailed({ onRetry }: { onRetry: () => void }) {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="초대를 확인하지 못했습니다"
      description={CONNECTION_FAILED_MESSAGE}
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

// 주소에 토큰이 없거나 모양이 틀렸다(링크가 잘렸거나 다른 곳에 옮겨 적음). 초대 코드로도 같은 초대를 열 수 있다.
function InvalidLink() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="초대 링크를 열지 못했습니다"
      description="링크가 잘렸거나 바뀐 것 같습니다. 알림톡 · 문자의 링크를 다시 누르거나, 같이 받은 초대 코드로 가입해 주세요."
      dock={
        <>
          <Button href="/join" transitionTypes={["nav-forward"]}>
            초대 코드로 가입
          </Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    />
  );
}
