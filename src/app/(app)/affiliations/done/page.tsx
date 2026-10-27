import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { Sunken, Values } from "@/app/_components/tax-profile-parts";
import { closedMessage, parseResult, type AnswerResult } from "@/lib/affiliation-requests";
import { getMyAffiliationRequests } from "@/lib/my-profile";
import { BODY, Lead } from "../screen-parts";

// 소속 추가 확인 요청에 답한 뒤의 화면(WHALEERP-144) — 소속 추가 완료(데모 join 의 addsite-done) · 거절 · 더 답할 수 없는 요청.
// 액션이 결과를 주소에 실어 이리 보낸다(resultHref). 액션 상태로 그리면 토큰 갱신 · 하이드레이션 전 제출로 화면을 다시 그릴 때 결과가
// 사라져서다. 주소로 들어오는 값이라 정한 것만 받고(parseResult), 맞지 않으면 홈으로 보낸다 — 확인 화면으로 보내면 남은 요청 하나가
// 바로 열려 버튼 앞에 선다. 점포 이름은 주소에 싣지 않아(남이 만든 링크로 가짜 결과를 보일 수 있다) 문구에 넣지 않는다.
// 수락 완료의 「계약서 날인하러 가기」는 직원 앱 계약 화면(#146)이 아직 없어 홈으로 보내고 안내만 둔다(2026-10-27).

/** 결과마다의 제목 — 화면 제목(문서 title)과 첫 제목에 같이 쓴다. 문서 title 이 바뀌어야 화면 낭독기가 결과를 알린다. */
function titleOf(result: AnswerResult): string {
  if (result.kind === "accepted") return "소속이 추가되었습니다";
  if (result.kind === "rejected") return "소속 추가를 거절했습니다";
  return closedMessage(result.reason).title;
}

export async function generateMetadata({ searchParams }: PageProps<"/affiliations/done">): Promise<Metadata> {
  const result = parseResult(await searchParams);
  return { title: `${result ? titleOf(result) : "소속 추가 확인"} · Whale ERP` };
}

export default async function AffiliationDonePage({ searchParams }: PageProps<"/affiliations/done">) {
  const result = parseResult(await searchParams);
  if (!result) redirect("/home");
  const title = titleOf(result);
  // 「다른 요청 보기」는 남은 요청을 받아야 정한다. 받는 동안 결과를 먼저 보이게 그 줄만 따로 기다린다.
  const dock = (
    <Suspense fallback={<DoneDock hasOthers={false} />}>
      <LoadedDock />
    </Suspense>
  );

  if (result.kind === "accepted")
    return (
      <>
        <PageHeader title="소속 추가 완료" backHref="/home" />
        <div className={`${BODY} text-center`}>
          <Lead title={title}>
            기존 계정은 그대로이고, 계정의 이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부만 이 근무지의 새 직원 레코드에 이어졌습니다.
          </Lead>
          <Sunken>
            <Values
              flush
              rows={[
                ["넘어간 것", "이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부"],
                ["넘어가지 않은 것", "계약 · 급여 · 출퇴근"],
              ]}
            />
          </Sunken>
          <div className="text-left">
            {/* 날인 화면(#146)이 생기면 이 안내 대신 「계약서 날인하러 가기」로 그 계약(api 응답의 contractIds)에 보낸다. */}
            <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
              {result.contractCount > 0 ? (
                <>
                  이 소속의 <strong>근로계약서가 발송되었습니다.</strong> 날인해야 근무가 시작됩니다.
                </>
              ) : (
                <>근로계약서가 도착하면 알림으로 알려 드립니다. 날인해야 근무가 시작됩니다.</>
              )}
            </Notice>
          </div>
        </div>
        {dock}
      </>
    );

  const message =
    result.kind === "rejected"
      ? "기존 소속과 계정은 그대로입니다. 함께 온 근로계약서는 거부로 닫혔습니다."
      : closedMessage(result.reason).message;
  return (
    <>
      <PageHeader title="소속 추가 확인" backHref="/home" />
      <div className={BODY}>
        <Lead title={title}>{message}</Lead>
      </div>
      {dock}
    </>
  );
}

/** 남은 요청이 있으면 「다른 요청 보기」를 더한다. 못 받았으면 홈으로만. */
async function LoadedDock() {
  const hasOthers = ((await getMyAffiliationRequests())?.length ?? 0) > 0;
  return <DoneDock hasOthers={hasOthers} />;
}

function DoneDock({ hasOthers }: { hasOthers: boolean }) {
  return (
    <Dock>
      {hasOthers && <Button href="/affiliations">다른 요청 보기</Button>}
      <Button variant={hasOthers ? "ghost" : "primary"} href="/home">
        홈으로
      </Button>
    </Dock>
  );
}
