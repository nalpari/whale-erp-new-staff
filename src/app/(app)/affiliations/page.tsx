import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, Badge, Button, Dock, PageHeader } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { employmentLine } from "@/lib/affiliation-requests";
import { getMyAffiliationRequests } from "@/lib/my-profile";
import { kstDateLabel } from "@/lib/profile";
import { acceptAffiliationAction, rejectAffiliationAction } from "./actions";
import { AnswerScreen } from "./answer-screen";

export const metadata: Metadata = { title: "소속 추가 확인 · Whale ERP" };

// 소속 추가 확인 요청(WHALEERP-144). 로그인 뒤 홈 팝업 · 내 정보 - 소속 근무지 · 알림톡 · 메일 링크(STAFF_APP_URL/affiliations,
// 토큰 없음)가 모두 여기로 온다. 로그인하지 않았으면 proxy 가 로그인으로 보냈다가 돌려보낸다.
// 요청이 하나면 바로 확인 화면, 여럿이면 목록에서 고른다(`?id=`). 데모는 하나만 보여 목록은 소속 근무지 목록 모양으로 지었다.
export default async function AffiliationsPage({ searchParams }: PageProps<"/affiliations">) {
  const { id } = await searchParams;
  const items = await getMyAffiliationRequests();

  if (items === null)
    return (
      <Shell>
        <Alert tone="warning">
          <p>소속 추가 요청을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
        </Alert>
      </Shell>
    );

  const picked = typeof id === "string" ? items.find((item) => String(item.invitationId) === id) : items.length === 1 ? items[0] : undefined;
  if (picked)
    return (
      <AnswerScreen
        key={picked.invitationId}
        request={picked}
        acceptAction={acceptAffiliationAction.bind(null, picked.invitationId)}
        rejectAction={rejectAffiliationAction.bind(null, picked.invitationId)}
        backHref={items.length > 1 ? "/affiliations" : "/home"}
        hasOthers={items.length > 1}
      />
    );

  // 고른 요청이 목록에 없다 — 그사이 답했거나 기한이 지났다.
  if (items.length === 0 || typeof id === "string")
    return (
      <Shell>
        <div className="flex flex-col gap-[6px]">
          <h2 className="text-[22px] font-bold">{items.length === 0 ? "확인할 요청이 없습니다" : "끝난 요청입니다"}</h2>
          <p className="text-[14px] text-staff-text-sub">
            이미 답했거나 확인 기한(30일)이 지난 요청은 여기에 보이지 않습니다. 수락한 근무지는 내 정보 - 소속 근무지에서 볼 수 있습니다.
          </p>
        </div>
        {items.length > 0 && <Button href="/affiliations">남은 요청 보기</Button>}
      </Shell>
    );

  return (
    <Shell>
      <div className="flex flex-col gap-[6px]">
        <h2 className="text-[22px] font-bold">확인할 요청 {items.length}건</h2>
        <p className="text-[14px] text-staff-text-sub">근무지를 골라 수락하거나 거절해 주세요. 거절해도 기존 소속과 계정에는 영향이 없습니다.</p>
      </div>
      <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
        {items.map((item) => (
          <li key={item.invitationId}>
            <Link
              href={`/affiliations?id=${item.invitationId}`}
              transitionTypes={["nav-forward"]}
              className={`-mx-[16px] flex items-center gap-[12px] px-[16px] py-[14px] active:bg-staff-primary-inactive ${PRESS}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold break-keep">{item.storeName}</span>
                <span className="block text-[12px] text-staff-text-sub">
                  {employmentLine(item)} · {kstDateLabel(item.expiresAt)}까지
                </span>
              </span>
              <Badge tone="warning">{item.invitationType === "RETURN_CONFIRM" ? "복귀 확인" : "소속 추가 요청"}</Badge>
              <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="소속 추가 확인" backHref="/home" />
      <div className="flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]">{children}</div>
      <Dock>
        <Button variant="ghost" href="/home">
          홈으로
        </Button>
      </Dock>
    </>
  );
}
