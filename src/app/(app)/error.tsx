"use client";

import { useEffect } from "react";
import { Alert, Button, Dock } from "@/components/common";
import { LogoutSheet } from "./me/logout-sheet";

// 로그인한 화면의 예상하지 못한 오류. 기본 영문 오류 화면 대신 한글 안내와 「다시 시도」를 보인다.
// 서버 쪽 원문은 instrumentation.ts 가 남기고, 화면에는 digest(서버 로그를 찾는 번호)만 보인다.
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <div className="flex flex-col gap-[16px] px-[24px] pt-[52px] pb-[24px] leading-[1.5]">
        <h1 className="text-[28px] font-bold">화면을 열지 못했습니다</h1>
        <p className="text-[14px] text-staff-text-sub">잠시 뒤 다시 시도해 주세요. 계속되면 근무지 점포에 알려 주세요.</p>
        {error.digest && <Alert tone="warning">오류 번호 {error.digest}</Alert>}
      </div>
      <Dock>
        <Button onClick={() => retry()}>다시 시도</Button>
        <Button variant="ghost" href="/home">
          홈으로
        </Button>
        {/* 로그아웃은 내 정보 맨 아래에만 있어, 내 정보를 열지 못해도 여기서 나갈 수 있게 둔다(공용 기기, 2026-10-20 노영주). */}
        <LogoutSheet />
      </Dock>
    </>
  );
}
