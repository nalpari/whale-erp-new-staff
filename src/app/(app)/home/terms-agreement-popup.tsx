"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, BottomSheet, Button } from "@/components/common";
import { TermsChecklist } from "@/app/_components/terms-checklist";
import type { StaffTermsItem } from "@/lib/my-profile";
import { NO_TERMS_CHECKED, requiredTermsAgreed, type ShownTermsVersions } from "@/lib/staff-terms";
import { logoutAction } from "../me/actions";
import { agreeTermsAction } from "./actions";

// 홈 약관 동의 팝업(운영 정책 ACC-23, WHALEERP-774) — 약관 동의를 받기 전에 가입한 직원(내 정보 needsTermsAgreement)에게 홈 위에 다른
// 팝업보다 먼저 띄운다. 관리자 웹이 플랫폼 등록 BP 의 첫 로그인에 받는 약관 동의 팝업과 같은 방식이다. 닫을 수 없고(뒤 화면 · Esc · 끌어
// 내리기로 닫히지 않음) 필수 둘에 동의해야 내려간다 — 맨 아래 버튼은 로그아웃이다. 열지 말지 · 순서는 home-popups.tsx 가 정한다.
export function TermsAgreementPopup({ open, terms, versions }: { open: boolean; terms: StaffTermsItem[]; versions: ShownTermsVersions }) {
  const [checks, setChecks] = useState(NO_TERMS_CHECKED);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const agree = () =>
    startTransition(async () => {
      setError(undefined);
      try {
        const result = await agreeTermsAction(versions, checks.marketing);
        if (!result.ok && result.error) setError(result.error);
      } catch (thrown) {
        unstable_rethrow(thrown);
        console.error("[terms-agreement] 액션 호출 실패", thrown);
        setError("서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
      }
    });
  return (
    <BottomSheet
      open={open}
      dismissible={false}
      onClose={() => startTransition(() => logoutAction())}
      title="약관에 동의해 주세요"
      description="직원 앱을 계속 쓰려면 필수 약관에 동의해야 합니다."
      closeLabel="로그아웃"
    >
      <TermsChecklist terms={terms} checks={checks} onChange={setChecks} />
      {error && (
        <Alert tone="warning">
          <p>{error}</p>
        </Alert>
      )}
      <Button disabled={pending || !requiredTermsAgreed(checks)} onClick={agree}>
        동의하고 시작하기
      </Button>
    </BottomSheet>
  );
}
