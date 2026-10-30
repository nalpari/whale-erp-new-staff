import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Alert, Button, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { Sunken, Values } from "@/app/_components/tax-profile-parts";
import { failureOf, logFailure } from "@/lib/api";
import { contentOf, contractHrefOf, parseResult } from "@/lib/affiliation-requests";
import { getContracts } from "@/lib/contracts";
import { HOME_PATH } from "@/lib/login-return";
import { HQ_NOT_RECORDED, HQ_NOT_RECORDED_NOTICE } from "@/lib/hq-sharing-terms";
import { readAcceptedStore } from "@/lib/invitation-cookie";
import { BODY, Lead } from "../screen-parts";

// 소속 추가 확인 요청에 답한 뒤의 화면(WHALEERP-144) — 소속 추가 완료(데모 join 의 addsite-done) · 거절 · 더 답할 수 없는 요청.
// 액션이 결과를 주소에 실어 이리 보낸다(resultHref). 액션 상태로 그리면 토큰 갱신 · 하이드레이션 전 제출로 화면을 다시 그릴 때 결과가
// 사라져서다. 주소로 들어오는 값이라 정한 것만 받고(parseResult), 맞지 않으면 홈으로 보낸다 — 확인 화면으로 보내면 남은 요청 하나가
// 바로 열려 버튼 앞에 선다. 점포 이름은 주소가 아니라 수락한 액션이 남긴 짧은 쿠키에서 읽고(가입 완료와 같다), 없으면 빼고 그린다.
// 남은 요청을 받아 버튼을 바꾸지 않는다 — 바꾸면 누르려는 순간 버튼이 바뀐다. 요청 목록은 빈 상태를 스스로 보인다. 수락 완료의 버튼 줄만
// 함께 온 계약 유무로 갈린다 — 주소에 고정된 값이라 그리는 동안 바뀌지 않는다.
// 수락 완료에 함께 온 계약이 있으면 「계약서 날인하러 가기」로 그 계약서(수락 응답의 contractIds, 근로계약서 화면 staff #44)로 보낸다 —
// 하나면 그 계약서, 여럿이면 근로계약서 목록 — 내 계약 목록에서 그 계약의 근무지를 찾아 ?store= 로 그 근무지만 보인다(수락 응답에 점포가
// 없다). 없으면 도착하면 알린다는 안내와 홈 · 요청 목록이다(데모 addsite-done). 버튼은 근무지 추가 완료(/me/invitations/done)와 같이
// 기록을 바꿔 넣어(replace) 날인하고 뒤로 가도 이 완료 화면에 들르지 않는다.
// 사업자 제공 동의를 보냈지만 본 문구 버전이 달라 남지 않았으면(ATT-30 v253 — 수락은 마쳤다) 다시 동의하라고 안내한다(parseResult 의 hqNotRecorded).

type Params = Awaited<PageProps<"/affiliations/done">["searchParams"]>;
const text = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/**
 * 결과와 그 제목 · 설명. generateMetadata 와 화면이 같이 불러 한 번만 읽는다 — cache 는 인자를 값으로 비교해야 맞으므로 쿼리에서
 * 쓰는 네 값만 글자로 넘긴다(여러 번 실린 값은 parseResult 처럼 받지 않는다).
 */
const loadContent = cache(async (kind?: string, reason?: string, contractIds?: string, hq?: string) => {
  const result = parseResult({ result: kind, reason, contractIds, [HQ_NOT_RECORDED.key]: hq });
  if (!result) return null;
  return { result, ...contentOf(result, result.kind === "accepted" ? await readAcceptedStore() : null) };
});

const contentFor = (params: Params) =>
  loadContent(text(params.result), text(params.reason), text(params.contractIds), text(params[HQ_NOT_RECORDED.key]));

export async function generateMetadata({ searchParams }: PageProps<"/affiliations/done">): Promise<Metadata> {
  const content = await contentFor(await searchParams);
  return { title: `${content?.title ?? "소속 추가 확인"} · Whale ERP` };
}

/** 수락으로 온 계약의 근무지. 목록을 못 읽으면 null 이고 거르지 않는다 — 완료 화면은 그대로 보인다. 401 의 만료 안내 등은 그대로 던진다 */
async function storeOfContracts(contractIds: number[]): Promise<number | null> {
  if (contractIds.length === 0) return null;
  try {
    return (await getContracts()).find((c) => contractIds.includes(c.contractId))?.storeId ?? null;
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    // 5xx · 연결 실패는 request() 가 남겼다
    if (failure !== "network" && failure.status < 500) logFailure("affiliation-done:contracts", failure);
    return null;
  }
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

  if (result.kind === "accepted") {
    const contractHref = contractHrefOf(result.contractIds, await storeOfContracts(result.contractIds));
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
          <div className="flex flex-col gap-[10px] text-left">
            {result.hqNotRecorded && <Alert tone="warning">{HQ_NOT_RECORDED_NOTICE}</Alert>}
            <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
              {contractHref ? (
                <>
                  이 소속의 <strong>근로계약서가 발송되었습니다.</strong> 날인해야 근무가 시작됩니다.
                </>
              ) : (
                <>근로계약서가 도착하면 알림으로 알려 드립니다. 날인해야 근무가 시작됩니다.</>
              )}
            </Notice>
          </div>
        </div>
        {contractHref ? (
          <Dock>
            <Button href={contractHref} replace transitionTypes={["nav-forward"]}>
              <MaskIcon src="/icons/contract.svg" size={14} />
              계약서 날인하러 가기
            </Button>
            <Button variant="ghost" href={HOME_PATH} replace transitionTypes={["nav-forward"]}>
              홈으로
            </Button>
          </Dock>
        ) : (
          dock
        )}
      </>
    );
  }

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
