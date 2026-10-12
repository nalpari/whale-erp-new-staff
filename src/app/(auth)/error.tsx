"use client";

import { useEffect } from "react";
import { Alert, Button } from "@/components/common";
import { AuthScreen } from "./_components/auth-screen";

// 로그인 · 비밀번호 재설정의 예상하지 못한 오류. 기본 영문 오류 화면 대신 한글 안내와 「다시 시도」를 보인다.
// 서버 쪽 원문은 instrumentation.ts 가 남기고, 화면에는 digest(서버 로그를 찾는 번호)만 보인다.
export default function AuthError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthScreen
      title="화면을 열지 못했습니다"
      description="잠시 뒤 다시 시도해 주세요. 계속되면 근무지 점포에 알려 주세요."
      dock={
        <>
          <Button onClick={() => retry()}>다시 시도</Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    >
      {error.digest && <Alert tone="warning">오류 번호 {error.digest}</Alert>}
    </AuthScreen>
  );
}
