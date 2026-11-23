import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Alert, Button, Dock, MaskIcon, PageHeader } from "@/components/common";
import { failureOf, logFailure } from "@/lib/api";
import { contentOf, contractHrefOf, parseResult } from "@/lib/affiliation-requests";
import { getContracts } from "@/lib/contracts";
import { HOME_PATH } from "@/lib/login-return";
import { HQ_NOT_RECORDED, HQ_NOT_RECORDED_NOTICE } from "@/lib/hq-sharing-terms";
import { readAcceptedStore } from "@/lib/invitation-cookie";
import { Accent, ActionPill, BigTitle, BODY, InfoPill, Lead } from "../screen-parts";

// 근무지 추가 확인 요청에 답한 뒤의 화면(WHALEERP-144) — 근무지 추가 완료(데모 join 의 addsite-done) · 거절 · 더 답할 수 없는 요청.
// 액션이 결과를 주소에 실어 이리 보낸다(resultHref). 액션 상태로 그리면 토큰 갱신 · 하이드레이션 전 제출로 화면을 다시 그릴 때 결과가
// 사라져서다. 주소로 들어오는 값이라 정한 것만 받고(parseResult), 맞지 않으면 홈으로 보낸다 — 확인 화면으로 보내면 남은 요청 하나가
// 바로 열려 버튼 앞에 선다. 점포 이름은 주소가 아니라 수락한 액션이 남긴 짧은 쿠키에서 읽고(가입 완료와 같다), 없으면 빼고 그린다.
// 남은 요청을 받아 버튼을 바꾸지 않는다 — 바꾸면 누르려는 순간 버튼이 바뀐다. 요청 목록은 빈 상태를 스스로 보인다. 수락 완료의 버튼 줄만
// 함께 온 계약 유무로 갈린다 — 주소에 고정된 값이라 그리는 동안 바뀌지 않는다.
// 수락 완료에 함께 온 계약이 있으면 「근로계약서 서명하기」로 그 계약서(수락 응답의 contractIds, 근로계약서 화면 staff #44)로 보낸다 —
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
  const storeName = result.kind === "accepted" ? await readAcceptedStore() : null;
  return { result, storeName, ...contentOf(result, storeName) };
});

const contentFor = (params: Params) =>
  loadContent(text(params.result), text(params.reason), text(params.contractIds), text(params[HQ_NOT_RECORDED.key]));

export async function generateMetadata({ searchParams }: PageProps<"/affiliations/done">): Promise<Metadata> {
  const content = await contentFor(await searchParams);
  return { title: `${content?.title ?? "근무지 추가 확인"} · Whale ERP` };
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
  const { result, storeName, title, message } = content;
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
        <PageHeader title="근무지 추가 완료" backHref="/home" />
        {/* 정돈 시안 C안(2026-11-20 사용자 지정): 체크 동그라미 · 큰 제목(근무지 이름만 남보라) · 둥근 정보 행 · 「다음 할 일」 알약 행.
            전엔 가운데 정렬 제목 · 이름 · 값 판 · 안내 상자였다. */}
        <div className={BODY}>
          <div className="flex flex-col gap-[16px]">
            <span aria-hidden className="flex size-[44px] items-center justify-center rounded-full bg-staff-primary text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <BigTitle sub={message}>
              <AddedTitle title={title} storeName={storeName} />
            </BigTitle>
          </div>
          <div className="flex flex-col gap-[10px]">
            <InfoPill icon="check" label="공유된 정보">
              이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부
            </InfoPill>
            <InfoPill icon="close" label="공유되지 않은 정보">
              계약 · 급여 · 출퇴근 기록
            </InfoPill>
          </div>
          {result.hqNotRecorded && <Alert tone="warning">{HQ_NOT_RECORDED_NOTICE}</Alert>}
          {contractHref ? (
            <div className="flex flex-col gap-[10px] pt-[8px]">
              <p className="px-[4px] text-[14px] font-semibold text-staff-text-sub">다음 할 일</p>
              <ActionPill href={contractHref} icon="contract" label="근로계약서 서명하기" sub="근무 시작 전 서명해 주세요." />
            </div>
          ) : (
            <p className="px-[4px] text-[13px] break-keep text-staff-text-muted">
              근로계약서가 도착하면 알림으로 알려 드립니다. 근무를 시작하려면 근로계약서에 서명해야 합니다.
            </p>
          )}
        </div>
        {contractHref ? (
          <Dock>
            <Button href={contractHref} replace transitionTypes={["nav-forward"]}>
              <MaskIcon src="/icons/doc-line.svg" size={14} />
              근로계약서 서명하기
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
      <PageHeader title="근무지 추가 확인" backHref="/home" />
      <div className={BODY}>
        <Lead title={title}>{message}</Lead>
      </div>
      {dock}
    </>
  );
}

/**
 * 완료 제목 「도레미커피가 / 근무지에 추가되었습니다」 — 근무지 이름만 남보라로 칠하고 조사 뒤에서 줄을 바꾼다(C안).
 * 제목은 contentOf 가 만든 글자 그대로라(문서 title 과 같다) 근무지 이름으로 시작할 때만 나누고, 아니면 그대로 둔다.
 */
function AddedTitle({ title, storeName }: { title: string; storeName: string | null }) {
  if (!storeName || !title.startsWith(storeName)) return title;
  const rest = title.slice(storeName.length);
  const space = rest.indexOf(" ");
  if (space < 0) return title;
  return (
    <>
      <Accent>{storeName}</Accent>
      {rest.slice(0, space)}
      <br />
      {rest.slice(space + 1)}
    </>
  );
}
