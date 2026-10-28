import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Badge, MaskIcon, Notice, PageHeader } from "@/components/common";
import { contractSubText, deadlineOf, isFinished, maskPhone, paperDocuments, parseId, periodText, statusTone } from "@/lib/contract-rules";
import { mismatchText } from "@/lib/contract-actions";
import { getContract } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { dateLabel, kstDateLabel } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { ContractDocument } from "../_components/contract-document";
import { ContractFrame, ContractHead, Sunken, Tiny, Values } from "../_components/parts";
import { ChangedToast } from "../../me/changed-toast";
import { rejectContractAction, requestContractCorrectionAction } from "./actions";
import { ContractDecision } from "./contract-decision";

export const metadata: Metadata = { title: "근로계약서 · Whale ERP" };

const address = (...parts: (string | null)[]) => parts.filter(Boolean).join(" ") || null;

// 근로계약서 상세(WHALEERP-146). 기준: 데모 docs/demo/src/pages/contract 의 상세 · 다시 보기 · 종이 계약 · 만료(Figma 없음).
// 전자계약은 계약서를 화면에 직접 그린다(조항 열 가지, CON-1 · CTR-21). 처리가 끝난 계약(체결 완료 · 거부 · 만료 · 종료)은 같은
// 본문을 읽기 전용으로 보인다. 종이 계약(CTR-23)은 본문 없이 관리자가 올린 날인본(과 임금계약서) 파일만 보이고 서명할 것이 없다.
// 남은 날인 기한이 7일 이내면 머리 카드를 강조색으로 그린다(CON-4). 남의 계약이거나 없으면(api 404) 찾을 수 없음.
export default async function ContractPage({ params, searchParams }: PageProps<"/contracts/[contractId]">) {
  await requireSession();
  const contractId = parseId((await params).contractId);
  const c = contractId === null ? null : await getContract(contractId);
  if (!c) notFound();

  const [statuses, employmentTypes, weekdays, payMonths, payMethods, documentKinds] = await Promise.all([
    getEnumOrEmpty("ContractStatus"),
    getEnumOrEmpty("EmploymentType"),
    getEnumOrEmpty("Weekday"),
    getEnumOrEmpty("PayMonth"),
    getEnumOrEmpty("PayMethod"),
    getEnumOrEmpty("ContractDocumentKind"),
  ]);
  // 소속 근무지에서 그 근무지 목록으로 왔으면 같은 목록으로 돌아간다
  const storeId = parseId((await searchParams).store);
  const backHref = storeId === null ? "/contracts" : `/contracts?store=${storeId}`;

  const now = new Date();
  const status = labelOf(statuses, c.status);
  const employmentType = c.employmentType && labelOf(employmentTypes, c.employmentType);
  const title = [c.employer.storeName, employmentType].filter(Boolean).join(" · ");
  const deadline = deadlineOf(c, now);
  const paper = c.contractMethod === "PAPER";
  const header = <PageHeader title="근로계약" backHref={backHref} />;

  if (paper) {
    const files = paperDocuments(c.documents);
    return (
      <ContractFrame header={header}>
        <Notice>
          <strong>종이로 맺은 계약입니다.</strong>
          <br />
          관리자가 종이 계약서를 올렸습니다. 앱에서 서명할 필요는 없습니다.
        </Notice>
        <Sunken>
          <Values
            rows={[
              ["근무지", c.employer.storeName],
              ["고용 형태", employmentType],
              ["계약 기간", periodText(c.startDate, c.endDate)],
              ["상태", status],
              ["올린 날", c.processedAt && kstDateLabel(c.processedAt)],
            ]}
          />
        </Sunken>
        <section className="flex flex-col gap-[8px] rounded-[16px] border border-staff-border-light bg-white p-[16px]">
          <h2 className="text-[13px] font-semibold text-staff-text-sub">계약서 파일</h2>
          {files.length === 0 ? (
            <p className="text-[13px] text-staff-text-muted">올라온 파일이 없습니다. 근무지 관리자에게 문의해 주세요.</p>
          ) : (
            <ul className="flex flex-col gap-[8px]">
              {files.map((d) => (
                <li key={d.contractDocumentId} className="flex min-h-[44px] items-center gap-[12px]">
                  <span className="flex text-staff-error">
                    <MaskIcon src="/icons/contract.svg" size={22} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="text-[14px] font-semibold">{labelOf(documentKinds, d.kind)}</span>
                    <span className="text-[12px] break-all text-staff-text-muted">{d.fileName}</span>
                  </span>
                  {/* 이 앱의 라우트가 로그인 토큰으로 api 의 서명 주소를 받아 보낸다(documents/[contractDocumentId]/route.ts). 라우트
                      핸들러라 Link 의 미리 받기를 쓰지 않는다. */}
                  <a
                    href={`/contracts/${c.contractId}/documents/${d.contractDocumentId}`}
                    className="inline-flex h-[36px] shrink-0 items-center rounded-[10px] border border-staff-border bg-white px-[12px] text-[13px] font-semibold text-staff-text active:bg-staff-primary-inactive"
                  >
                    받기<span className="sr-only"> · {labelOf(documentKinds, d.kind)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Tiny>계약 내용을 바꾸려면 근무지 관리자에게 문의해 주세요.</Tiny>
      </ContractFrame>
    );
  }

  const worker = c.worker;
  // 날인 · 거절 · 수정 요청을 받는 계약 — 서명 대기 · 기한 안 · 재직 중(api awaitingSignature). 종이 계약은 위에서 끝났다.
  const decidable = c.status === "PENDING_SIGNATURE" && c.awaitingSignature && !deadline?.passed;
  const done = (await searchParams).done;
  return (
    <>
      <ContractFrame header={header}>
        {c.status === "EXPIRED" || deadline?.passed ? (
          // 데모 expired. 하루 배치가 만료로 바꾸기 전이라 서명 대기로 남아 있어도 기한이 지났으면 같은 안내다.
          <Alert tone="warning">
            <p>
              <strong>서명 기한이 지나 계약서가 만료되었습니다.</strong>
              <br />
              계약을 진행하려면 근무지 관리자에게 계약서를 다시 요청해 주세요.
            </p>
          </Alert>
        ) : c.status === "CORRECTION_REQUESTED" ? (
          <Notice>
            <strong>수정을 요청한 계약서입니다.</strong>
            <br />
            근무지 관리자가 고쳐 다시 보내면 서명할 수 있습니다.
          </Notice>
        ) : decidable && !c.signable ? (
          // 본인 대조(WHALEERP-125): 다른 항목만 알린다 — 계정 값은 보이지 않는다. 날인 대신 수정 요청을 낸다.
          <Alert tone="warning">
            <p>
              <strong>계약서의 직원 정보가 가입한 정보와 달라 날인할 수 없습니다.</strong>
              <br />
              {c.mismatches.length > 0 && (
                <>
                  다른 항목: {mismatchText(c.mismatches)}
                  <br />
                </>
              )}
              계약서 내용을 확인하고 수정을 요청해 주세요. 근무지 관리자가 고쳐 다시 보내면 날인할 수 있습니다.
            </p>
          </Alert>
        ) : (
          isFinished(c.status) && (
            // 데모 readonly
            <Notice>
              <strong>이미 처리가 끝난 계약서입니다.</strong>
              <br />
              다시 서명하거나 거절할 수 없습니다. 계약 내용을 바꾸려면 근무지 관리자에게 문의해 주세요.
            </Notice>
          )
        )}

        <ContractHead
          title={title}
          sub={contractSubText(c, now, status, "detail")}
          urgent={deadline?.urgent ?? false}
          badge={<Badge tone={statusTone(c.status)}>{status}</Badge>}
        />

        <ContractDocument c={c} enums={{ employmentTypes, weekdays, payMonths, payMethods }} />

        <Sunken label="계약서에 들어가는 내 정보">
          <Values
            rows={[
              ["이름", worker.name],
              ["생년월일", worker.birthDate && dateLabel(worker.birthDate)],
              ["휴대전화번호", maskPhone(worker.phone)],
              // 주소는 날인할 때 계정 주소로 고정된다 — 날인 전이면 비어 있어 계정 주소를 보인다(api)
              ["주소", address(worker.address, worker.addressDetail) ?? address(c.account.address, c.account.addressDetail)],
            ]}
          />
        </Sunken>

        <Sunken label="사용자(근무지)">
          <Values
            rows={[
              ["상호", c.employer.tradeName ?? c.employer.storeName],
              ["대표자", c.employer.ceoName],
              ["사업자등록번호", c.employer.registrationNumber],
              ["사업장 주소", address(c.employer.bizAddress, c.employer.bizAddressDetail)],
              ["전화", c.employer.storePhone],
            ]}
          />
        </Sunken>

        {/* TODO(149): 처리 완료본 파일 생성(WHALEERP-131) 뒤 documents 의 SIGNED_COPY 를 체결된 계약에서 같은 받기 라우트(documents/[contractDocumentId])로. */}

        {decidable ? (
          <Tiny>날인하거나 거절하면 근무지 관리자에게 알림이 전달됩니다.</Tiny>
        ) : (
          c.status === "PENDING_SIGNATURE" &&
          !deadline?.passed && (
            // 서명 대기 · 기한 안인데 처리할 수 없다 — 퇴직했거나 퇴직일이 지났다(api awaitingSignature, CTR-25)
            <Tiny>지금은 이 계약서를 처리할 수 없습니다. 근무지 관리자에게 문의해 주세요.</Tiny>
          )
        )}
      </ContractFrame>
      {decidable && c.sentAt && (
        <ContractDecision
          signHref={`/contracts/${c.contractId}/sign?sentAt=${encodeURIComponent(c.sentAt)}`}
          signable={c.signable}
          rejectAction={rejectContractAction.bind(null, c.contractId)}
          correctionAction={requestContractCorrectionAction.bind(null, c.contractId)}
        />
      )}
      {done !== undefined && (
        // 수정 요청 뒤 이 화면으로 돌아왔다(`?done=correction`). 알린 뒤 주소에서 지운다 — 소속 근무지에서 왔으면 `?store=` 는 둔다.
        <ChangedToast path={storeId === null ? `/contracts/${c.contractId}` : `/contracts/${c.contractId}?store=${storeId}`}>
          {done === "correction" ? "수정을 요청했습니다" : undefined}
        </ChangedToast>
      )}
    </>
  );
}
