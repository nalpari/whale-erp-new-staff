"use client";

import { useState } from "react";
import { BottomSheet, Button, DangerButton } from "@/components/common";
import { forgetAffiliationPopup } from "../home/affiliation-popup";
import { logoutAction } from "./actions";

// 기준: 데모 docs/demo/src/pages/me 의 logout 시트. 내 정보 맨 아래에 둔다(S-PHHICH 확정, WHALEERP-193 · 167).
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
        {/* 소속 추가 요청 팝업의 「다음에 하기」 기억을 지워 다시 로그인하면 팝업이 뜨게 한다(WHALEERP-144). */}
        <form action={logoutAction} onSubmit={forgetAffiliationPopup}>
          <DangerButton type="submit">로그아웃</DangerButton>
        </form>
      </BottomSheet>
    </>
  );
}
