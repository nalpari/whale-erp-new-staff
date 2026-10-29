"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Button, MaskIcon, RequestSheet, SHEET_CLOSE_MS } from "@/components/common";
import { readSeen, subscribeSeen } from "@/lib/affiliation-popup-memory";
import { isPopupDismissed } from "@/lib/affiliation-requests";
import { forgetHqReconsentPopup, readHqReconsentSeen, subscribeHqReconsentSeen } from "@/lib/hq-reconsent-popup-memory";
import {
  forgetSignRequestPopup,
  readSignRequestSeen,
  rememberSignRequestSeen,
  subscribeSignRequestReopen,
  subscribeSignRequestSeen,
  takeSignRequestReopen,
} from "@/lib/sign-request-popup-memory";
import { isSignRequestDismissed } from "@/lib/sign-request-seen";
import { AffiliationPopup } from "./affiliation-popup";
import { HqReconsentPopup } from "./hq-reconsent-popup";

type Rows = { label: string; value: string }[];
type Sheet = "sign" | "affiliation" | "reconsent";

/**
 * 홈 위 팝업 셋 — 서명 요청(WHALEERP-148), 소속 추가 요청(144), 사업자 제공 다시 동의(ATT-30 v252). 한 번에 하나만, 서명 요청 → 소속
 * 추가 요청 → 다시 동의 순이다(순서의 근거는 home/page.tsx 의 HomeRequests). 규칙은 셋이다.
 * - 보고 있는 시트는 그대로 둔다 — 그사이 다른 쪽 기억이 지워지거나 홈을 다시 받아도, 닫을(「다음에 하기」 · 가기) 때까지.
 * - 한 시트를 닫으면 다 내려간 뒤(SHEET_CLOSE_MS) 다음 시트를 연다 — 겹쳐 보이지 않게.
 * - 백그라운드에서 오래 있다 다시 보이면(HOME-4 「앱을 다시 엶」, 홈에 없을 때 돌아왔으면 홈을 그릴 때) 홈을 먼저 다시 받고 서명 요청
 *   기억을 지운다 — 받는 동안은 새로 띄우지 않아 지난 데이터(그사이 서명한 계약)로 띄우지 않는다. 다시 동의 기억도 함께 지운다
 *   (「화면으로 돌아올 때」 다시 묻는다, 2026-10-29 재영).
 * 서버 그림에서는 모두 닫아 두고(저장소를 모른다) 브라우저에서 읽어 연다.
 */
export function HomePopups({
  sign,
  affiliation,
  reconsent,
}: {
  sign: { key: string; href: string; rows: Rows } | null;
  affiliation: { key: string; rows: Rows } | null;
  /** 다시 동의가 필요하면 직원이 동의한 버전(닫을 때 기억) */
  reconsent: { key: string } | null;
}) {
  const router = useRouter();
  // 다시 동의는 마지막 값을 붙잡아 둔다 — 동의하면 홈을 다시 받아 null 이 되는데, 바로 빼면 시트가 내려가지 않고 사라지고 성공 토스트도 잃는다
  const [keptReconsent, setKeptReconsent] = useState(reconsent);
  if (reconsent && reconsent.key !== keptReconsent?.key) setKeptReconsent(reconsent);
  const [refreshing, startRefresh] = useTransition();
  useEffect(() => {
    const reopen = () => {
      if (!takeSignRequestReopen()) return;
      startRefresh(() => router.refresh());
      forgetSignRequestPopup();
      forgetHqReconsentPopup();
    };
    reopen();
    return subscribeSignRequestReopen(reopen);
  }, [router]);

  const waiting: Record<Sheet, boolean> = {
    sign: useSyncExternalStore(
      subscribeSignRequestSeen,
      () => sign !== null && !isSignRequestDismissed(sign.key, readSignRequestSeen()),
      () => false,
    ),
    affiliation: useSyncExternalStore(
      subscribeSeen,
      () => affiliation !== null && !isPopupDismissed(affiliation.key, readSeen()),
      () => false,
    ),
    reconsent: useSyncExternalStore(
      subscribeHqReconsentSeen,
      () => reconsent !== null && readHqReconsentSeen() !== reconsent.key,
      () => false,
    ),
  };
  // 보고 있는 시트(잠금). 그것이 닫히면 내려가는 동안(closing) 비워 둔다.
  const [shown, setShown] = useState<Sheet | null>(null);
  const [closing, setClosing] = useState(false);
  const pick: Sheet | null = waiting.sign ? "sign" : waiting.affiliation ? "affiliation" : waiting.reconsent ? "reconsent" : null;
  const next = shown && waiting[shown] ? shown : shown || closing || refreshing ? null : pick;
  // 렌더 중 상태 맞추기 — 바뀔 때만. 보던 시트가 닫혔으면 내려가는 시간을 둔다.
  if (next !== shown) {
    setShown(next);
    if (shown) setClosing(true);
  }
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), SHEET_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  return (
    <>
      {sign && <SignRequestSheet open={next === "sign"} requestKey={sign.key} href={sign.href} rows={sign.rows} />}
      {affiliation && <AffiliationPopup open={next === "affiliation"} requestKey={affiliation.key} rows={affiliation.rows} />}
      {keptReconsent && <HqReconsentPopup open={next === "reconsent"} reconsentKey={keptReconsent.key} />}
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
