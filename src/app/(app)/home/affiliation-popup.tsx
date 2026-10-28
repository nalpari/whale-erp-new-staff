"use client";

import { useSyncExternalStore } from "react";
import { Button, MaskIcon, RequestSheet } from "@/components/common";
import { readSeen, rememberSeen, subscribeSeen } from "@/lib/affiliation-popup-memory";
import { isPopupDismissed } from "@/lib/affiliation-requests";

// 소속 추가 요청 팝업(WHALEERP-144, 2026-10-26 재영). 답하지 않은 요청이 있으면 홈 위에 띄운다 — 날인 요청 팝업(데모 home 의 sign-req)과
// 같은 모양이다. 「다음에 하기」를 누르면 본 요청을 이 탭에 기억해 다시 띄우지 않는다(lib/affiliation-popup-memory) — 하나에 답해 줄어도
// 그대로 닫혀 있고, 새 요청이 오거나 앱을 새로 열거나 다시 로그인하면 다시 뜬다.
// 닫아도 내 정보 - 소속 근무지에서 요청을 찾아 확인 화면(/affiliations)으로 갈 수 있다.
export function AffiliationPopup({
  requestKey,
  rows,
}: {
  /** 지금 요청들의 id 묶음 — 닫을 때 기억해, 새 요청이 오면 다시 띄운다. */
  requestKey: string;
  /** 판에 보일 줄(popupSummary). */
  rows: { label: string; value: string }[];
}) {
  // 서버 그림에서는 닫아 두고(저장소를 모른다) 브라우저에서 읽어 연다 — 열 때 시트가 아래에서 올라온다.
  const dismissed = useSyncExternalStore(subscribeSeen, () => isPopupDismissed(requestKey, readSeen()), () => true);
  return (
    <RequestSheet
      open={!dismissed}
      onClose={() => rememberSeen(requestKey)}
      title="소속 추가 요청이 있습니다."
      rows={rows}
      description="수락하기 전에는 소속이 바뀌지 않습니다. 지금 확인하지 않아도 내 정보 - 소속 근무지에서 다시 볼 수 있습니다."
      action={
        <Button href="/affiliations" transitionTypes={["nav-forward"]}>
          <MaskIcon src="/icons/store-small.svg" size={14} />
          확인하러 가기
        </Button>
      }
      closeLabel="다음에 하기"
    />
  );
}
