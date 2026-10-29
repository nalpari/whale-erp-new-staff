import type { Metadata } from "next";
import { RedirectType, notFound, redirect } from "next/navigation";
import { Alert, Button, Dock, PageHeader } from "@/components/common";
import { isSentAt } from "@/lib/contract-actions";
import { parseId } from "@/lib/contract-rules";
import { getContract } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { requireSession } from "@/lib/session";
import { ContractFrame } from "../../_components/parts";
import { signContractAction } from "../actions";
import { SignForm } from "./sign-form";

export const metadata: Metadata = { title: "근로계약서 서명 · Whale ERP" };

// 근로계약서 날인(WHALEERP-147, 데모 contract 의 sign · sign-drawn · signing). 상세의 「서명하기」가 그 화면을 그릴 때 받은 발송 일시를
// `?sentAt=` 으로 싣고 온다 — 날인에 그 값을 그대로 보내, 직원이 본 계약서가 그사이 다시 발송됐으면 api 가 409 CONTRACT_RESENT 로 막는다.
// 지금 날인할 수 없는 계약(서명 대기 · 기한 안 · 재직 · 본인 대조가 아님, 종이 계약)이거나 발송 일시가 없으면 상세로 돌려보낸다.
export default async function SignContractPage({ params, searchParams }: PageProps<"/contracts/[contractId]/sign">) {
  await requireSession();
  const [{ contractId: rawId }, query] = await Promise.all([params, searchParams]);
  const contractId = parseId(rawId);
  const c = contractId === null ? null : await getContract(contractId);
  if (!c) notFound();
  // 소속 근무지에서 왔으면(`?store=`) 상세 · 완료 화면에도 이어 준다 — 뒤로 가기가 그 근무지 상세 · 목록으로 간다
  const storeId = parseId(query.store);
  const detailHref = `/contracts/${c.contractId}${storeId === null ? "" : `?store=${storeId}`}`;
  const seen = query.sentAt;
  if (!c.signable || c.contractMethod === "PAPER" || !isSentAt(seen)) redirect(detailHref, RedirectType.replace);

  const header = <PageHeader title="근로계약" backHref={detailHref} />;
  if (seen !== c.sentAt)
    return (
      <>
        <ContractFrame header={header}>
          <Alert tone="warning">
            <p>
              <strong>근로계약서가 다시 발송됐습니다.</strong>
              <br />
              바뀐 계약서를 확인한 뒤 서명해 주세요.
            </p>
          </Alert>
        </ContractFrame>
        <Dock inset={30}>
          <Button href={detailHref} replace>
            계약서 다시 보기
          </Button>
        </Dock>
      </>
    );

  const employmentType = c.employmentType && labelOf(await getEnumOrEmpty("EmploymentType"), c.employmentType);
  return (
    <SignForm
      action={signContractAction.bind(null, c.contractId, storeId, seen)}
      header={header}
      title={[c.employer.storeName, employmentType].filter(Boolean).join(" · ")}
      signerName={c.account.name}
      detailHref={detailHref}
    />
  );
}
