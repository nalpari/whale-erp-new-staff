import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Badge, MaskIcon, Notice, PageHeader } from "@/components/common";
import { contractSubText, deadlineOf, isFinished, maskPhone, paperDocuments, parseId, periodText, statusTone } from "@/lib/contract-rules";
import { getContract } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { dateLabel, kstDateLabel } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { ContractDocument } from "../_components/contract-document";
import { ContractFrame, ContractHead, Sunken, Tiny, Values } from "../_components/parts";

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
                  {/* TODO(문서 내려받기 api): 직원용 계약서 파일 내려받기 api 가 생기면 여기에 「받기」 링크를 둔다 —
                      급여명세서 PDF 처럼 이 앱의 라우트(/contracts/[contractId]/documents/[contractDocumentId])가 로그인 토큰으로 api 를 불러 넘긴다. */}
                </li>
              ))}
            </ul>
          )}
        </section>
        <Tiny>파일 내려받기는 준비 중입니다. 계약 내용을 바꾸려면 근무지 관리자에게 문의해 주세요.</Tiny>
      </ContractFrame>
    );
  }

  const worker = c.worker;
  return (
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

      {/* TODO(CON-1): 체결 완료 계약서 PDF 받기 — 직원용 계약서 파일 내려받기 api 가 생기면 여기에 둔다. */}

      {c.status === "PENDING_SIGNATURE" && !deadline?.passed && (
        <>
          {/* WHALEERP-147: 날인 · 거부는 이 자리(화면 아래 Dock)에 「서명하기」 · 「거절하기」로 붙는다 — c.signable(본인 대조까지 맞음) ·
              c.mismatches(다르면 수정 요청) · c.sentAt(날인 때 그대로 보냄)을 쓴다. 지금은 보기만 한다. */}
          <Tiny>앱에서 서명 · 거절하는 기능은 준비 중입니다. 서명하거나 거절하면 근무지 관리자에게 알림이 전달됩니다.</Tiny>
        </>
      )}
    </ContractFrame>
  );
}
