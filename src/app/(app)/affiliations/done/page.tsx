import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Button, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { Sunken, Values } from "@/app/_components/tax-profile-parts";
import { closedMessage, parseResult } from "@/lib/affiliation-requests";
import { getMyAffiliationRequests } from "@/lib/my-profile";

export const metadata: Metadata = { title: "소속 추가 확인 · Whale ERP" };

// 소속 추가 확인 요청에 답한 뒤의 화면(WHALEERP-144) — 소속 추가 완료(데모 join 의 addsite-done) · 거절 · 더 답할 수 없는 요청.
// 액션이 결과를 주소에 실어 이리 보낸다(resultHref). 액션 상태로 그리면 토큰 갱신 · 하이드레이션 전 제출로 화면을 다시 그릴 때 결과가
// 사라져서다. 주소로 들어오는 값이라 정한 것만 받고(parseResult), 맞지 않으면 확인 화면으로 보낸다.
// 수락 완료의 「계약서 날인하러 가기」는 직원 앱 계약 화면(#146)이 아직 없어 홈으로 보내고 안내만 둔다(2026-10-27).

const BODY = "flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]";

export default async function AffiliationDonePage({ searchParams }: PageProps<"/affiliations/done">) {
  const result = parseResult(await searchParams);
  if (!result) redirect("/affiliations");
  // 남은 요청이 있으면 목록으로 돌아가는 버튼을 둔다. 못 받았으면 홈으로만.
  const hasOthers = ((await getMyAffiliationRequests())?.length ?? 0) > 0;
  const dock = (
    <Dock>
      {hasOthers && <Button href="/affiliations">다른 요청 보기</Button>}
      <Button variant={hasOthers ? "ghost" : "primary"} href="/home">
        홈으로
      </Button>
    </Dock>
  );

  if (result.kind === "accepted")
    return (
      <>
        <PageHeader title="소속 추가 완료" backHref="/home" />
        <div className={`${BODY} text-center`}>
          <Lead title={`${result.storeName} 소속이 추가되었습니다`}>
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

  const { title, message } =
    result.kind === "rejected"
      ? { title: "소속 추가를 거절했습니다", message: "기존 소속과 계정은 그대로입니다. 함께 온 근로계약서는 거부로 닫혔습니다." }
      : closedMessage(result.reason);
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

/** 화면 첫 제목 + 설명(데모 lead). */
function Lead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h2 className="text-[22px] font-bold">{title}</h2>
      <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{children}</p>
    </div>
  );
}
