"use client";

import { useEffect } from "react";
import { Toast } from "@/components/common";

/**
 * 하위 화면에서 바꾸고 돌아왔을 때의 알림(`/me?changed=`). 띄운 뒤 주소에서 `?changed=` 를 지운다 — 남겨 두면 새로 고침 ·
 * 뒤로 가기로 돌아올 때마다 다시 뜬다. state 를 null 로 줘야 Next 라우터가 바뀐 주소를 안다(재설정 링크 화면과 같다).
 */
export function ChangedToast({ children }: { children: string }) {
  useEffect(() => {
    history.replaceState(null, "", "/me");
  }, []);
  return <Toast>{children}</Toast>;
}
