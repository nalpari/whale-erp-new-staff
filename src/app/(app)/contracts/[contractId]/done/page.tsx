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
import { ContractFrame, Sunken, Tiny, Values } from "../../_components/parts";

export const metadata: Metadata = { title: "근로계약서 처리 완료 · Whale ERP" };

const TOAST = { signed: "날인을 완료했습니다", rejected: "계약서를 거절했습니다" } as const;

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
// 계약 상세에 소속 id 가 없어 소속 목록에서 같은 점포를 찾는다. 찾지 못하면(목록을 못 받음 등) 홈으로.
export default async function ContractDonePage({ params, searchParams }: PageProps<"/contracts/[contractId]/done">) {
  await requireSession();
  const contractId = parseId((await params).contractId);
  const c = contractId === null ? null : await getContract(contractId);
  if (!c) notFound();
  const detailHref = `/contracts/${c.contractId}`;
  const done = (await searchParams).done;
  const toast = done === "signed" || done === "rejected" ? TOAST[done] : undefined;
  const toastNode = done !== undefined && <ChangedToast path={`${detailHref}/done`}>{toast}</ChangedToast>;
  const header = <PageHeader title="근로계약" backHref={detailHref} />;

  if (c.status === "REJECTED")
    return (
      <>
        <ContractFrame header={header}>
          {c.processedAt && <Clock label="거절 시각" at={c.processedAt} />}
          <Tiny>
            근무지 관리자에게 거절 사실을 알렸습니다.
            <br />
            관리자가 계약서를 다시 보내면 근로계약서 목록에 표시됩니다.
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
  const staffMemberId = memberships?.items.find((m) => m.store.storeId === c.storeId)?.staffMemberId;
  return (
    <>
      <ContractFrame header={header}>
        {c.processedAt && <Clock label="날인 시각" at={c.processedAt} />}
        <Sunken>
          <Values
            rows={[
              ["근무지", c.employer.storeName],
              ["고용 형태", c.employmentType && labelOf(employmentTypes, c.employmentType)],
              ["계약 기간", periodText(c.startDate, c.endDate)],
            ]}
          />
        </Sunken>
        {staffMemberId !== undefined && (
          <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
            이제 <strong>신고 정보</strong>를 입력해 주세요.
            <br />
            4대보험 신고와 급여 지급에 필요한 정보입니다.
          </Notice>
        )}
        <Tiny>계약 내용을 바꾸려면 근무지 관리자에게 문의해 주세요.</Tiny>
      </ContractFrame>
      <Dock inset={30}>
        {staffMemberId !== undefined ? (
          // 신고 정보 처음 넣기 화면은 WHALEERP-150(PR #42)이 만든다. 건너뛰기는 두지 않는다(TAX-4).
          <Button href={`/me/memberships/${staffMemberId}/tax-profile/new`}>신고 정보 입력하기</Button>
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
