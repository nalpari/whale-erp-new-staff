"use client";

import { useSyncExternalStore } from "react";
import { Button, MaskIcon, RequestSheet } from "@/components/common";
import { isSignRequestDismissed } from "@/lib/sign-request";
import { readSignRequestSeen, rememberSignRequestSeen, subscribeSignRequestSeen } from "@/lib/sign-request-popup-memory";

/** 서명 요청 팝업을 닫아 두었는가(이 탭에서 「다음에 하기」). 서버 그림에서는 닫아 둔다(저장소를 모른다). 소속 추가 요청 팝업도 이것을 보고 기다린다. */
export function useSignRequestDismissed(requestKey: string | null): boolean {
  return useSyncExternalStore(
    subscribeSignRequestSeen,
    () => requestKey === null || isSignRequestDismissed(requestKey, readSignRequestSeen()),
    () => true,
  );
}

// 서명 요청 팝업(WHALEERP-148, 데모 home 의 sign-req · HOME-1). 서명을 기다리는 근로계약서가 있으면 홈 위에 띄우고, 「서명하러 가기」는
// 그 계약서의 서명 화면으로 간다. 「다음에 하기」는 이 탭에만 기억해 서명하기 전까지 앱을 열 때마다 다시 뜬다(HOME-4). 기한 임박 알림은
// 따로 보내지 않는다 — 이 팝업과 발송 알림으로 알린다.
export function SignRequestPopup({
  requestKey,
  href,
  rows,
}: {
  /** 지금 서명을 기다리는 계약 묶음(sign-request.ts 의 key) — 닫을 때 기억한다. */
  requestKey: string;
  href: string;
  rows: { label: string; value: string }[];
}) {
  const dismissed = useSignRequestDismissed(requestKey);
  return (
    <RequestSheet
      open={!dismissed}
      onClose={() => rememberSignRequestSeen(requestKey)}
      title="서명할 계약서가 도착했습니다"
      rows={rows}
      description="서명해야 근무가 시작됩니다. 지금 확인하지 않아도 계약서 화면에서 다시 볼 수 있습니다."
      action={
        <Button href={href} transitionTypes={["nav-forward"]}>
          <MaskIcon src="/icons/contract.svg" size={14} />
          서명하러 가기
        </Button>
      }
      closeLabel="다음에 하기"
    />
  );
}
