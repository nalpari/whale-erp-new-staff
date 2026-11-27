import type { Metadata } from "next";
import { RedirectType, notFound, redirect } from "next/navigation";
import { Button, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { parseId, periodText } from "@/lib/contract-rules";
import { getContract } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getMyMemberships } from "@/lib/my-profile";
import { kstDateLabel, kstDateTimeLabel } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { ChangedToast } from "../../../me/changed-toast";
import { GrayBox } from "@/app/_components/gray-box";
import { ContractFrame, Tiny, Values } from "../../_components/parts";

export const metadata: Metadata = { title: "근로계약서 처리 완료 · Whale ERP" };

const TOAST = { signed: "서명을 완료했습니다", rejected: "계약서를 거절했습니다" } as const;

/** 데모 clock: 라벨 13px semibold · 시각 42px bold, 아래 날짜. */
function Clock({ label, at }: { label: string; at: string }) {
  return (
    <section className="flex flex-col items-center text-center">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">{label}</h2>
      <p className="text-[42px] leading-[1.1] font-bold">{kstDateTimeLabel(at).slice(-5)}</p>
      <p className="pt-[6px] text-[13px] text-staff-text-muted">{kstDateLabel(at)}</p>
    </section>
  );
}

// 날인 · 거절을 마친 화면(WHALEERP-147, 데모 contract 의 signed · rejected). 액션이 `?done=signed|rejected` 로 보내 알림을 한 번
// 띄우고 주소에서 지운다. 계약을 다시 읽어 지금 상태로 그린다 — 체결 완료면 날인 완료, 거부면 거절 완료, 그 밖이면 상세로.
// 날인 뒤에는 그 근무지 소속의 신고 정보 처음 넣기(WHALEERP-150, `/me/memberships/[staffMemberId]/tax-profile/new`)로 잇는다 —
// 소속은 계약 상세의 직원 레코드 id(staffMemberId)로 소속 목록에서 찾는다 — 근무지로 찾으면 퇴직 뒤 재입사한 직원의 옛 레코드와
// 헷갈린다. 찾지 못하면(목록을 못 받음 등) 홈으로. 신고 정보를 냈는지는 소속 목록의 taxProfileSubmitted(api)로 보아 따로 조회(복호화)하지
// 않는다 — 냈으면 입력 대신 「이미 냈습니다」와 보기 · 홈. 그 칸이 없는 옛 api 면 입력 버튼을 그대로 둔다 — 입력 화면이 이미 낸 소속을
// 보기 화면으로 보낸다.
// 소속 근무지에서 왔으면(`?store=`) 뒤로 가기 · 알림 뒤 주소에 이어 준다.
export default async function ContractDonePage({ params, searchParams }: PageProps<"/contracts/[contractId]/done">) {
  await requireSession();
  const [{ contractId: rawId }, query] = await Promise.all([params, searchParams]);
  const contractId = parseId(rawId);
  const c = contractId === null ? null : await getContract(contractId);
  if (!c) notFound();
  const storeId = parseId(query.store);
  // 알림에서 연 계약이면(?from=notifications) 완료 화면 · 상세로 돌아가서도 뒤로 가기가 알림 목록으로 가게 이어 준다
  const keep = new URLSearchParams();
  if (storeId !== null) keep.set("store", String(storeId));
  if (query.from === "notifications") keep.set("from", "notifications");
  const storeQuery = keep.size > 0 ? `?${keep}` : "";
  const detailHref = `/contracts/${c.contractId}${storeQuery}`;
  const done = query.done;
  const toast = done === "signed" || done === "rejected" ? TOAST[done] : undefined;
  const toastNode = done !== undefined && <ChangedToast path={`/contracts/${c.contractId}/done${storeQuery}`}>{toast}</ChangedToast>;
  const header = <PageHeader title="근로계약서" backHref={detailHref} />;

  if (c.status === "REJECTED")
    return (
      <>
        <ContractFrame header={header} white>
          {c.processedAt && <Clock label="거절 시각" at={c.processedAt} />}
          <Tiny>
            근무지 관리자에게 거절 사실을 알렸습니다.
            <br />
            관리자가 계약서를 다시 보내면 홈에 표시됩니다.
          </Tiny>
        </ContractFrame>
        <Dock inset={30}>
          <Button variant="ghost" href="/home">
            홈으로
          </Button>
        </Dock>
        {toastNode}
      </>
    );
  if (c.status !== "SIGNED" || c.contractMethod === "PAPER") redirect(detailHref, RedirectType.replace);

  const [employmentTypes, memberships] = await Promise.all([getEnumOrEmpty("EmploymentType"), getMyMemberships()]);
  const membership = memberships?.items.find((m) => m.staffMemberId === c.staffMemberId);
  const staffMemberId = membership?.staffMemberId;
  const taxSubmitted = membership?.taxProfileSubmitted === true;
  const taxHref = staffMemberId === undefined ? null : `/me/memberships/${staffMemberId}/tax-profile`;
  return (
    <>
      {/* 처리 완료 화면은 흰 바탕 · 근무지 · 고용 형태 · 계약 기간은 회색 상자(2026-11-25 사용자 지정) */}
      <ContractFrame header={header} white>
        {c.processedAt && <Clock label="서명 시각" at={c.processedAt} />}
        <GrayBox>
          <Values
            rows={[
              ["근무지", c.employer.storeName],
              ["고용 형태", c.employmentType && labelOf(employmentTypes, c.employmentType)],
              ["계약 기간", periodText(c.startDate, c.endDate)],
            ]}
          />
        </GrayBox>
        {taxSubmitted ? (
          <Notice icon={<MaskIcon src="/icons/id-card-line.svg" size={14} />}>
            이 근무지의 <strong>신고 정보는 이미 냈습니다.</strong>
            <br />
            바꿀 것이 있으면 신고 정보 화면에서 고칠 수 있습니다.
          </Notice>
        ) : (
          staffMemberId !== undefined && (
            <Notice icon={<MaskIcon src="/icons/id-card-line.svg" size={14} />}>
              이제 <strong>신고 정보</strong>를 입력해 주세요.
              <br />
              급여 지급과 원천징수, 4대보험 신고(가입 대상인 경우)에 필요한 정보입니다.
            </Notice>
          )
        )}
        <Tiny>계약 내용을 바꾸려면 근무지 관리자에게 문의해 주세요.</Tiny>
      </ContractFrame>
      <Dock inset={30}>
        {taxHref && taxSubmitted ? (
          <>
            <Button href="/home">홈으로</Button>
            <Button variant="ghost" href={taxHref}>
              신고 정보 보기
            </Button>
          </>
        ) : taxHref ? (
          // 신고 정보 처음 넣기 화면은 WHALEERP-150(PR #42)이 만든다. 건너뛰기는 두지 않는다(TAX-4).
          <Button href={`${taxHref}/new?from=sign`}>신고 정보 입력하기</Button>
        ) : (
          <Button variant="ghost" href="/home">
            홈으로
          </Button>
        )}
      </Dock>
      {toastNode}
    </>
  );
}
