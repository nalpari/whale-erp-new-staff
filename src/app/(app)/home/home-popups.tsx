"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Button, MaskIcon, RequestSheet } from "@/components/common";
import { readSeen, subscribeSeen } from "@/lib/affiliation-popup-memory";
import { isPopupDismissed } from "@/lib/affiliation-requests";
import {
  readSignRequestSeen,
  rememberSignRequestSeen,
  subscribeSignRequestReopen,
  subscribeSignRequestSeen,
} from "@/lib/sign-request-popup-memory";
import { isSignRequestDismissed } from "@/lib/sign-request-seen";
import { AffiliationPopup } from "./affiliation-popup";

type Rows = { label: string; value: string }[];
type Showing = "sign" | "affiliation" | null;

/**
 * 홈 위 팝업 둘 — 서명 요청(WHALEERP-148)과 소속 추가 요청(144). 한 번에 하나만, 서명 요청이 먼저다(순서의 근거는 home/page.tsx 의
 * HomeRequests). 지금 보이는 소속 추가 요청 시트는 그사이 서명 요청 기억이 지워져도(백그라운드에서 오래 있다 돌아옴) 닫지 않는다 —
 * 보고 있는 것을 끝낸 뒤 서명 요청이 뜬다. 서버 그림에서는 둘 다 닫아 두고(저장소를 모른다) 브라우저에서 읽어 연다.
 */
export function HomePopups({
  sign,
  affiliation,
}: {
  sign: { key: string; href: string; rows: Rows } | null;
  affiliation: { key: string; rows: Rows } | null;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  // 백그라운드에서 오래 있다 다시 보이면(HOME-4 「앱을 다시 엶」) 홈을 다시 받는다 — 받는 동안 서명 요청을 닫아 두어 지난 데이터로
  // 띄우지 않는다. 받은 결과로 팝업이 뜨거나(아직 서명 대기) 안 뜬다(그사이 서명함).
  useEffect(() => subscribeSignRequestReopen(() => startRefresh(() => router.refresh())), [router]);

  const signWaiting = useSyncExternalStore(
    subscribeSignRequestSeen,
    () => sign !== null && !isSignRequestDismissed(sign.key, readSignRequestSeen()),
    () => false,
  );
  const affiliationWaiting = useSyncExternalStore(
    subscribeSeen,
    () => affiliation !== null && !isPopupDismissed(affiliation.key, readSeen()),
    () => false,
  );
  // 다시 받는 동안은 새로 띄우지 않는다(지난 데이터).
  const wanted: Showing = refreshing ? null : signWaiting ? "sign" : affiliationWaiting ? "affiliation" : null;
  // 보이던 소속 추가 시트는 그대로 둔다(닫을 때까지). 렌더 중 상태 맞추기 — 이전 값과 다를 때만 바꾼다.
  const [showing, setShowing] = useState<Showing>(null);
  const next: Showing = showing === "affiliation" && affiliationWaiting ? "affiliation" : wanted;
  if (next !== showing) setShowing(next);

  return (
    <>
      {sign && <SignRequestSheet open={next === "sign"} requestKey={sign.key} href={sign.href} rows={sign.rows} />}
      {affiliation && <AffiliationPopup open={next === "affiliation"} requestKey={affiliation.key} rows={affiliation.rows} />}
    </>
  );
}

// 서명 요청 팝업(데모 home 의 sign-req · HOME-1). 서명을 기다리는 근로계약서가 있으면 홈 위에 띄우고, 「서명하러 가기」는 데모처럼 그
// 계약서 상세로 간다 — 상세에서 조항을 보고 서명한다. 「다음에 하기」는 이 탭에만 기억해 서명하기 전까지 앱을 열 때마다 다시 뜬다
// (HOME-4). 기한 임박 알림은 따로 보내지 않는다 — 이 팝업과 발송 알림으로 알린다.
function SignRequestSheet({ open, requestKey, href, rows }: { open: boolean; requestKey: string; href: string; rows: Rows }) {
  return (
    <RequestSheet
      open={open}
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
