"use client";

import { useSyncExternalStore } from "react";
import { Button, MaskIcon, RequestSheet } from "@/components/common";

// 소속 추가 요청 팝업(WHALEERP-144, 2026-10-26 재영). 답하지 않은 요청이 있으면 홈 위에 띄운다 — 날인 요청 팝업(데모 home 의 sign-req)과
// 같은 모양이다. 「다음에 하기」를 누르면 이 탭(sessionStorage)에서는 다시 띄우지 않고, 앱을 새로 열거나 새 요청이 오면 다시 뜬다.
// 닫아도 내 정보 - 소속 근무지에서 요청을 찾아 확인 화면(/affiliations)으로 갈 수 있다.

const STORAGE_KEY = "staff:affiliation-popup-dismissed";
const listeners = new Set<() => void>();
/** 저장소를 쓸 수 없을 때 이 화면에서만 기억하는 값. */
let memory: string | null = null;

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // 저장소를 막은 브라우저 — 기억하지 못할 뿐 팝업은 뜬다.
    return null;
  }
}

function dismiss(key: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // 위와 같다. 이번 화면에서만 닫힌다.
    memory = key;
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function AffiliationPopup({
  requestKey,
  storeName,
  employmentTypeLabel,
  others,
}: {
  /** 지금 요청들의 id 묶음 — 닫을 때 기억해, 새 요청이 오면 다시 띄운다. */
  requestKey: string;
  storeName: string;
  employmentTypeLabel: string | null;
  /** 이 요청 말고 더 있는 요청 수. */
  others: number;
}) {
  // 서버 그림에서는 닫아 두고(저장소를 모른다) 브라우저에서 읽어 연다 — 열 때 시트가 아래에서 올라온다.
  const dismissed = useSyncExternalStore(subscribe, () => (memory ?? readDismissed()) === requestKey, () => true);
  return (
    <RequestSheet
      open={!dismissed}
      onClose={() => dismiss(requestKey)}
      title="소속 추가 요청이 있습니다."
      rows={[
        { label: "점포", value: others > 0 ? `${storeName} 외 ${others}곳` : storeName },
        { label: "고용 형태", value: employmentTypeLabel ?? "미정" },
      ]}
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
