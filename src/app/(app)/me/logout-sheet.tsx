"use client";

import { useState } from "react";
import { BottomSheet, Button, DangerButton } from "@/components/common";
import { logoutAction } from "./actions";
import { LineIcon } from "./me-rows";

// 기준: 데모 docs/demo/src/pages/me 의 logout 시트. 내 정보 맨 아래에 둔다(S-PHHICH 확정, WHALEERP-193 · 167).
export function LogoutSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* 정돈 시안 ⑬ — 나가기 아이콘(16px) + 글자의 ghost 버튼 */}
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <LineIcon name="logout" size={16} />
        로그아웃
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="로그아웃하시겠습니까?"
        description="다시 로그인하려면 이메일과 비밀번호가 필요합니다."
        closeLabel="취소"
      >
        <form action={logoutAction}>
          <DangerButton type="submit">로그아웃</DangerButton>
        </form>
      </BottomSheet>
    </>
  );
}
