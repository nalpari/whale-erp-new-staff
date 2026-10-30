"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, RequestSheet, Toast } from "@/components/common";
import { rememberHqReconsentSeen } from "@/lib/hq-reconsent-popup-memory";
import { HQ_SHARING_TERMS, HQ_SHARING_TERMS_VERSION } from "@/lib/hq-sharing-terms";
import { CONSENT_CHANGES } from "@/lib/profile";
import { changeConsentAction } from "../me/actions";

const ROWS = HQ_SHARING_TERMS.map(([label, value]) => ({ label, value }));

// 사업자 제공 다시 동의 팝업(ATT-30 v252, 2026-10-29 재영 — 137 완료 조건 「앱에 들어오면 다시 묻는다」). 옛 문구 버전에 동의해 다시 동의해야
// 하면(needsReconsent) 홈 위에 바뀐 내용을 보이고 「동의합니다」로 새 버전에 동의를 받는다 — 내 정보 카드의 내용 시트와 같은 기록이다.
// 「다음에 하기」는 이 탭에 기억해, 앱을 새로 열거나 오래 있다 돌아오면 다시 뜬다(lib/hq-reconsent-popup-memory). 동의하지 않으려면 내 정보
// 카드에서 철회한다. 동의하면 내 정보 카드와 같은 토스트를 띄우고, 액션이 화면을 다시 받아 needsReconsent 가 풀리면 팝업이 내려간다(home-popups.tsx
// 가 마지막 값을 붙잡아 둬 내려가는 동안 그대로 그린다). 열지 말지 · 순서는 home-popups.tsx 가 정한다.
export function HqReconsentPopup({ open, reconsentKey }: { open: boolean; reconsentKey: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [toast, setToast] = useState<{ key: number; text: string }>();
  // 다시 열리면 지난 실패 문구를 지운다 — 시트는 기억 · 다시 엶 사이에도 붙어 있다(home-popups.tsx 의 keptReconsent)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setError(undefined);
  }
  const agree = () =>
    startTransition(async () => {
      setError(undefined);
      try {
        const result = await changeConsentAction("hq-sharing-agree", HQ_SHARING_TERMS_VERSION);
        if (result.ok) setToast({ key: Date.now(), text: CONSENT_CHANGES["hq-sharing-agree"].done });
        else {
          setError(result.error);
          // 409 면 액션이 홈을 다시 받아 대상이 없어지면 시트가 내려간다 — 시트 안 문구만으로는 보이지 않아 토스트로도 알린다
          setToast({ key: Date.now(), text: result.error });
          // 문구가 바뀌었으면(api 가 앱보다 앞섬) 이 번들로는 다시 눌러도 같다 — 이 탭에서는 다시 띄우지 않는다(새로 고치면 다시 묻는다)
          if (result.hqTermsChanged) rememberHqReconsentSeen(reconsentKey);
        }
      } catch (thrown) {
        unstable_rethrow(thrown);
        console.error("[hq-reconsent] 액션 호출 실패", thrown);
        setError("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
      }
    });
  return (
    <>
      <RequestSheet
        open={open}
        onClose={() => rememberHqReconsentSeen(reconsentKey)}
        title="사업자 제공 동의 내용이 바뀌었습니다"
        rows={ROWS}
        description="다시 동의하기 전에는 본사에 점포별 숫자로만 보입니다. 원하지 않으면 내 정보에서 동의를 철회할 수 있습니다."
        action={
          <>
            {error && (
              <Alert tone="warning">
                <p>{error}</p>
              </Alert>
            )}
            <Button disabled={pending} onClick={agree}>
              동의합니다
            </Button>
          </>
        }
        closeLabel="다음에 하기"
      />
      {toast && <Toast key={toast.key}>{toast.text}</Toast>}
    </>
  );
}
