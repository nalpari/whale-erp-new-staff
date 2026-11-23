"use client";

import { Button, MaskIcon, RequestSheet } from "@/components/common";
import { rememberSeen } from "@/lib/affiliation-popup-memory";
import type { PopupSummary } from "@/lib/affiliation-requests";

// 근무지 추가 요청 팝업(WHALEERP-144, 2026-10-26 재영). 답하지 않은 요청이 있으면 홈 위에 띄운다 — 서명 요청 팝업(데모 home 의 sign-req)과
// 같은 판이다. 「나중에 하기」를 누르면 본 요청을 이 탭에 기억해 다시 띄우지 않는다(lib/affiliation-popup-memory) — 하나에 답해 줄어도
// 그대로 닫혀 있고, 새 요청이 오거나 앱을 새로 열거나 다시 로그인하면 다시 뜬다.
// 닫아도 내 정보 - 내 근무지에서 요청을 찾아 확인 화면(/affiliations)으로 갈 수 있다.
// 정돈 시안 B안(2026-11-20 사용자 지정): 요청이 하나일 때 머리말 「새 근무지 초대」, 제목 「○○에서 / 근무지 초대를 보냈습니다」(근무지
// 이름만 남보라), 판에 고용 형태 · 답변 기한(아래 꺾은선 줄에 남은 날). 요청이 여럿이거나 복귀 확인일 때의 머리말 · 제목 · 줄은
// lib/affiliation-requests.ts 의 popupSummary 를 본다.
// 열지 말지(기억 · 서명 요청 팝업과의 순서)는 home-popups.tsx 가 정한다.
export function AffiliationPopup({ summary, open }: { summary: PopupSummary; open: boolean }) {
  const [first, ...rest] = summary.headingRest.split("\n");
  return (
    <RequestSheet
      open={open}
      onClose={() => rememberSeen(summary.key)}
      title={summary.title}
      eyebrow={summary.eyebrow}
      heading={
        summary.storeName ? (
          <>
            <span className="text-staff-primary">{summary.storeName}</span>
            {first}
            {rest.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
          </>
        ) : undefined
      }
      rows={summary.rows}
      description={
        <>
          초대를 수락하면 내 근무지에 추가됩니다.
          <br />
          지금 수락하지 않아도 ‘내 정보 &gt; 내 근무지’에서 다시 확인할 수 있습니다.
        </>
      }
      action={
        <Button href="/affiliations" transitionTypes={["nav-forward"]}>
          <MaskIcon src="/icons/store-line.svg" size={14} />
          확인하러 가기
        </Button>
      }
      closeLabel="나중에 하기"
    />
  );
}
