"use client";

import { useEffect } from "react";
import { Toast } from "@/components/common";

/**
 * 하위 화면에서 바꾸고 돌아왔을 때의 알림(`/me?changed=` · 신고 정보 `?changed=1`). 띄운 뒤 주소에서 `?changed=` 를 지운다(path 로) —
 * 남겨 두면 새로 고침 · 뒤로 가기로 돌아올 때마다 다시 뜬다. state 를 null 로 줘야 Next 라우터가 바뀐 주소를 안다(재설정 링크 화면과 같다).
 */
export function ChangedToast({ path = "/me", children }: { path?: string; children: string }) {
  useEffect(() => {
    history.replaceState(null, "", path);
  }, [path]);
  return <Toast>{children}</Toast>;
}
