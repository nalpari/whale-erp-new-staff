"use client";

import { useSyncExternalStore } from "react";
import { Button, MaskIcon, RequestSheet } from "@/components/common";
import { employmentLine, isPopupDismissed, mergeSeenKey } from "@/lib/affiliation-requests";

// 소속 추가 요청 팝업(WHALEERP-144, 2026-10-26 재영). 답하지 않은 요청이 있으면 홈 위에 띄운다 — 날인 요청 팝업(데모 home 의 sign-req)과
// 같은 모양이다. 「다음에 하기」를 누르면 본 요청을 이 탭(sessionStorage)에 기억해 다시 띄우지 않는다 — 하나에 답해 줄어도 그대로 닫혀 있고,
// 새 요청이 오거나 앱을 새로 열거나 로그아웃한 뒤 다시 로그인하면 다시 뜬다.
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

const readSeen = () => memory ?? readDismissed();

function dismiss(key: string) {
  const seen = mergeSeenKey(key, readSeen());
  try {
    sessionStorage.setItem(STORAGE_KEY, seen);
  } catch {
    // 위와 같다. 이번 화면에서만 닫힌다.
    memory = seen;
  }
  listeners.forEach((listener) => listener());
}

/** 로그아웃할 때 본 요청을 잊는다 — 같은 탭에서 다시 로그인하면 팝업이 다시 뜬다. */
export function forgetAffiliationPopup() {
  memory = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 막은 브라우저 — 기억한 것도 없다.
  }
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
  const dismissed = useSyncExternalStore(subscribe, () => isPopupDismissed(requestKey, readSeen()), () => true);
  return (
    <RequestSheet
      open={!dismissed}
      onClose={() => dismiss(requestKey)}
      title="소속 추가 요청이 있습니다."
      rows={[
        { label: "점포", value: others > 0 ? `${storeName} 외 ${others}곳` : storeName },
        // 여럿이면 첫 요청의 고용 형태만 보이지 않고 요청 수를 보인다. 비었을 때 문구는 확인 화면 · 목록(employmentLine)과 같다.
        others > 0
          ? { label: "요청", value: `${others + 1}건` }
          : { label: "고용 형태", value: employmentLine({ employmentTypeLabel, jobTitle: null }) },
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
