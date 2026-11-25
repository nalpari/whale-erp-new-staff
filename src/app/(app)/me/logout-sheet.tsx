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
      {/* 나가기 아이콘(16px) + 글자의 테두리 버튼 — 로그인 화면 [초대 코드로 가입]과 같은 모양(2026-11-25 사용자 지정, 전엔 ghost) */}
      <Button variant="outline" onClick={() => setOpen(true)}>
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
        <form action={logoutAction} noValidate>
          <DangerButton type="submit">로그아웃</DangerButton>
        </form>
      </BottomSheet>
    </>
  );
}
