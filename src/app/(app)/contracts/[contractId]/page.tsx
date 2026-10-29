import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Badge, MaskIcon, Notice, PageHeader } from "@/components/common";
import {
  contractSubText,
  deadlineOf,
  isFinished,
  maskPhone,
  paperDocuments,
  parseId,
  periodText,
  phaseLabel,
  phaseOf,
  statusTone,
} from "@/lib/contract-rules";
import { mismatchText } from "@/lib/contract-actions";
import { getContract } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { dateLabel, kstDateLabel } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { ChangedToast } from "../../me/changed-toast";
import { ContractDocument } from "../_components/contract-document";
import { ContractFrame, ContractHead, Sunken, Tiny, Values } from "../_components/parts";
import { rejectContractAction, requestContractCorrectionAction } from "./actions";
import { ContractDecision } from "./contract-decision";

export const metadata: Metadata = { title: "근로계약서 · Whale ERP" };

const address = (...parts: (string | null)[]) => parts.filter(Boolean).join(" ") || null;

/** 받기 라우트(documents/[contractDocumentId]/route.ts)가 실패하면 상세로 돌려보내며 다는 `?download=` 값과 그 안내. */
const DOWNLOAD_ALERT: Record<string, string> = {
  notfound: "파일을 찾을 수 없습니다. 화면을 새로 고친 뒤 다시 받아 주세요.",
  unavailable: "지금은 이 파일을 받을 수 없습니다. 계약서 상태를 다시 확인해 주세요.",
  failed: "파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
};

// 근로계약서 상세(WHALEERP-146). 기준: 데모 docs/demo/src/pages/contract 의 상세 · 다시 보기 · 종이 계약 · 만료(Figma 없음).
// 전자계약은 계약서를 화면에 직접 그린다(조항 열 가지, CON-1 · CTR-21). 처리가 끝난 계약(체결 완료 · 거부 · 만료 · 종료)은 같은
// 본문을 읽기 전용으로 보인다. 종이 계약(CTR-23)은 본문 없이 관리자가 올린 날인본(과 임금계약서) 파일만 보이고 서명할 것이 없다.
// 남은 날인 기한이 7일 이내면 머리 카드를 강조색으로 그린다(CON-4). 남의 계약이거나 없으면(api 404) 찾을 수 없음.
export default async function ContractPage({ params, searchParams }: PageProps<"/contracts/[contractId]">) {
  await requireSession();
  const [{ contractId: rawId }, query] = await Promise.all([params, searchParams]);
  const contractId = parseId(rawId);
  if (contractId === null) notFound();

  const [c, statuses, employmentTypes, weekdays, payMonths, payMethods, documentKinds, identityFields] = await Promise.all([
    getContract(contractId),
    getEnumOrEmpty("ContractStatus"),
    getEnumOrEmpty("EmploymentType"),
    getEnumOrEmpty("Weekday"),
    getEnumOrEmpty("PayMonth"),
    getEnumOrEmpty("PayMethod"),
    getEnumOrEmpty("ContractDocumentKind"),
    // 본인 대조 항목 한글(api enum IdentityField) — 대조가 다를 때만 쓰지만 캐시되니 함께 받는다. getEnumOrEmpty 는 5xx · 연결 실패만
    // 빈 목록으로 바꾸고 404 · 응답에 이름 없음(api 가 아직 등록 전)은 던지므로, 여기서 남기고 빈 목록으로 받아 상세 전체가 깨지지
    // 않게 한다 — 빈 목록이면 대조가 다른 계약은 항목 없이 일반 문구다.
    getEnumOrEmpty("IdentityField").catch((error: unknown) => {
      console.error("[contract] IdentityField enum 을 받지 못했습니다", error);
      return [];
    }),
  ]);
  if (!c) notFound();
  // 소속 근무지에서 그 근무지 목록으로 왔으면 같은 목록으로 돌아간다
  const storeId = parseId(query.store);
  const storeQuery = storeId === null ? "" : `?store=${storeId}`;
  const backHref = `/contracts${storeQuery}`;
  // 받기가 실패해 돌아왔다. 주소에서 오는 값이라 정한 키만 받고(프로토타입 이름 막기), 안내를 띄운 뒤 주소의 `?download=` 는 지운다.
  const downloadAlert =
    typeof query.download === "string" && Object.hasOwn(DOWNLOAD_ALERT, query.download) ? (
      <>
        <Alert tone="warning">
          <p>{DOWNLOAD_ALERT[query.download]}</p>
        </Alert>
        <ChangedToast path={`/contracts/${c.contractId}${storeQuery}`} />
      </>
    ) : null;

  const now = new Date();
  // 날인할 수 있는지는 api 의 awaitingSignature 로 정한다 — 날인할 수 없는 서명 대기는 만료 · 서명 불가로 보인다(phaseOf).
  const phase = phaseOf(c, now);
  const status = phaseLabel(phase, labelOf(statuses, phase));
  const employmentType = c.employmentType && labelOf(employmentTypes, c.employmentType);
  const title = [c.employer.storeName, employmentType].filter(Boolean).join(" · ");
  const deadline = deadlineOf(c, now);
  const paper = c.contractMethod === "PAPER";
  const header = <PageHeader title="근로계약" backHref={backHref} />;

  if (paper) {
    const files = paperDocuments(c.documents);
    return (
      <ContractFrame header={header}>
        {downloadAlert}
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
                      핸들러라 Link 의 미리 받기를 쓰지 않는다. 같은 탭에서 연다 — 성공하면 저장소가 attachment 로 내려줘 화면은 그대로
                      남고, 실패하면 라우트가 이 상세로 돌려보내 안내한다. target="_blank" 는 홈 화면에 둔 앱(PWA 단독 모드)에서 앱 밖
                      브라우저 창으로 빠져 실패 안내가 그 창에 뜨고, download 속성은 실패 때 돌려보낸 상세 HTML 을 파일로 저장해 버려 두지
                      않는다(성공 때 주소는 다른 출처라 어차피 무시된다). */}
                  <a
                    href={`/contracts/${c.contractId}/documents/${d.contractDocumentId}${storeQuery}`}
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
  // 본인 대조가 다르면 다른 항목의 한글. 못 받았거나 한글이 없는 값이 섞이면 null — 항목 없이 일반 문구다.
  const mismatched = mismatchText(c.mismatches, identityFields);
  return (
    <>
      <ContractFrame header={header}>
        {downloadAlert}
        {phase === "EXPIRED" ? (
          // 데모 expired. 하루 배치가 만료로 바꾸기 전이라 서명 대기로 남아 있어도 api 가 날인할 수 없다고 하고 기한이 지났으면 같은 안내다.
          <Alert tone="warning">
            <p>
              <strong>서명 기한이 지나 계약서가 만료되었습니다.</strong>
              <br />
              계약을 진행하려면 근무지 관리자에게 계약서를 다시 요청해 주세요.
            </p>
          </Alert>
        ) : phase === "UNSIGNABLE" ? (
          // 서명 대기인데 기한 전에 api 가 날인할 수 없다고 한다 — 재직 중이 아닐 때(퇴직). 데모에 없는 상태라 만료 안내와 같은 결로 적는다.
          <Notice>
            <strong>지금은 서명할 수 없는 계약서입니다.</strong>
            <br />
            재직 중이 아니면 서명할 수 없습니다. 계약을 진행하려면 근무지 관리자에게 문의해 주세요.
          </Notice>
        ) : c.awaitingSignature && !c.signable ? (
          // 본인 대조(WHALEERP-125): 다른 항목만 알린다 — 계정 값은 보이지 않는다. 날인 대신 수정 요청을 낸다.
          <Alert tone="warning">
            <p>
              <strong>계약서의 직원 정보가 가입한 정보와 달라 서명할 수 없습니다.</strong>
              <br />
              {mismatched ? `다른 항목: ${mismatched}` : "다른 항목이 있습니다."}
              <br />
              계약서 내용을 확인하고 수정을 요청해 주세요. 근무지 관리자가 고쳐 다시 보내면 서명할 수 있습니다.
            </p>
          </Alert>
        ) : phase === "CORRECTION_REQUESTED" ? (
          <Notice>
            <strong>수정을 요청한 계약서입니다.</strong>
            <br />
            근무지 관리자가 고쳐 다시 보내면 서명할 수 있습니다.
          </Notice>
        ) : (
          isFinished(phase) && (
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
          badge={<Badge tone={statusTone(phase)}>{status}</Badge>}
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

        {/* api 가 지금 날인할 수 있다고 할 때만(서명 대기 · 기한 안 · 재직 중) — 아래 버튼 줄과 같은 판정 */}
        {c.awaitingSignature && <Tiny>서명하거나 거절하면 근무지 관리자에게 알림이 전달됩니다.</Tiny>}
      </ContractFrame>
      {c.awaitingSignature && c.sentAt && (
        <ContractDecision
          signHref={`/contracts/${c.contractId}/sign?${storeId === null ? "" : `store=${storeId}&`}sentAt=${encodeURIComponent(c.sentAt)}`}
          signable={c.signable}
          rejectAction={rejectContractAction.bind(null, c.contractId, storeId)}
          correctionAction={requestContractCorrectionAction.bind(null, c.contractId, storeId)}
        />
      )}
      {query.done !== undefined && (
        // 수정 요청 뒤 이 화면으로 돌아왔다(`?done=correction`). 알린 뒤 주소에서 지운다 — `?store=` 는 이어 준다(받기 실패 안내와 같다).
        <ChangedToast path={`/contracts/${c.contractId}${storeQuery}`}>{query.done === "correction" ? "수정을 요청했습니다" : undefined}</ChangedToast>
      )}
    </>
  );
}
