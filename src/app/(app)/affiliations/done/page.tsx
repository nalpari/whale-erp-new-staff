import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Button, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { Sunken, Values } from "@/app/_components/tax-profile-parts";
import { contentOf, parseResult } from "@/lib/affiliation-requests";
import { readAcceptedStore } from "@/lib/invitation-cookie";
import { BODY, Lead } from "../screen-parts";

// 소속 추가 확인 요청에 답한 뒤의 화면(WHALEERP-144) — 소속 추가 완료(데모 join 의 addsite-done) · 거절 · 더 답할 수 없는 요청.
// 액션이 결과를 주소에 실어 이리 보낸다(resultHref). 액션 상태로 그리면 토큰 갱신 · 하이드레이션 전 제출로 화면을 다시 그릴 때 결과가
// 사라져서다. 주소로 들어오는 값이라 정한 것만 받고(parseResult), 맞지 않으면 홈으로 보낸다 — 확인 화면으로 보내면 남은 요청 하나가
// 바로 열려 버튼 앞에 선다. 점포 이름은 주소가 아니라 수락한 액션이 남긴 짧은 쿠키에서 읽고(가입 완료와 같다), 없으면 빼고 그린다.
// 버튼 줄은 늘 같다 — 남은 요청을 받아 버튼을 바꾸면 누르려는 순간 버튼이 바뀐다. 요청 목록은 빈 상태를 스스로 보인다.
// 수락 완료의 「계약서 날인하러 가기」는 직원 앱 계약 화면(#146)이 아직 없어 홈으로 보내고 안내만 둔다(2026-10-27).

type Params = Awaited<PageProps<"/affiliations/done">["searchParams"]>;
const text = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/**
 * 결과와 그 제목 · 설명. generateMetadata 와 화면이 같이 불러 한 번만 읽는다 — cache 는 인자를 값으로 비교해야 맞으므로 쿼리에서
 * 쓰는 세 값만 글자로 넘긴다(여러 번 실린 값은 parseResult 처럼 받지 않는다).
 */
const loadContent = cache(async (kind?: string, reason?: string, contracts?: string) => {
  const result = parseResult({ result: kind, reason, contracts });
  if (!result) return null;
  return { result, ...contentOf(result, result.kind === "accepted" ? await readAcceptedStore() : null) };
});

const contentFor = (params: Params) => loadContent(text(params.result), text(params.reason), text(params.contracts));

export async function generateMetadata({ searchParams }: PageProps<"/affiliations/done">): Promise<Metadata> {
  const content = await contentFor(await searchParams);
  return { title: `${content?.title ?? "소속 추가 확인"} · Whale ERP` };
}

export default async function AffiliationDonePage({ searchParams }: PageProps<"/affiliations/done">) {
  const content = await contentFor(await searchParams);
  if (!content) redirect("/home");
  const { result, title, message } = content;
  const dock = (
    <Dock>
      <Button href="/home">홈으로</Button>
      <Button variant="ghost" href="/affiliations">
        요청 목록
      </Button>
    </Dock>
  );

  if (result.kind === "accepted")
    return (
      <>
        <PageHeader title="소속 추가 완료" backHref="/home" />
        <div className={`${BODY} text-center`}>
          <Lead title={title}>{message}</Lead>
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
