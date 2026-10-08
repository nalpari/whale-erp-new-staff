"use client";

import { useState } from "react";
import { BottomSheet, Button, DangerButton } from "@/components/common";
import { logoutAction } from "./actions";

// 기준: 데모 /demo/login 의 logout 시트. 실제 자리는 내 정보 맨 아래(WHALEERP-193)이고, 그때까지 임시 홈에 둔다.
export function LogoutSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        로그아웃
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="로그아웃할까요"
        description="다시 들어오려면 이메일과 비밀번호가 필요합니다. 출퇴근을 찍어야 할 때 번거로울 수 있습니다."
        closeLabel="그대로 두기"
      >
        <form action={logoutAction}>
          <DangerButton type="submit">로그아웃</DangerButton>
        </form>
      </BottomSheet>
    </>
  );
}
