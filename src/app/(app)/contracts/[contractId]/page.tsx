import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Badge, Dock, MaskIcon, Notice, PageHeader, buttonClass } from "@/components/common";
import {
  bodyMissing,
  contractSubText,
  deadlineOf,
  isFinished,
  maskPhone,
  paperDocuments,
  parseId,
  periodText,
  phaseLabel,
  phaseOf,
  signBlockOf,
  canDecideOf,
  signedCopyOf,
  statusTone,
} from "@/lib/contract-rules";
import { mismatchText } from "@/lib/contract-actions";
import { getContract } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { dateLabel, kstDateLabel } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { ChangedToast } from "../../me/changed-toast";
import { ContractDocument } from "../_components/contract-document";
import { ContractFrame, ContractSummary, InfoGroup, Sunken, Tiny, Values } from "../_components/parts";
import { rejectContractAction, requestContractCorrectionAction } from "./actions";
import { ContractDecision } from "./contract-decision";

export const metadata: Metadata = { title: "근로계약서 · Whale ERP" };

/** 처리가 끝난 계약서의 상태별 안내(2026-11-20 사용자 지정 — 전엔 「이미 처리가 끝난 계약서입니다」 상자 하나). 만료 · 서명 불가는 위 안내 상자가 맡는다. */
const FINISHED_NOTE: Partial<Record<string, string>> = {
  SIGNED: "서명이 완료된 근로계약서입니다. 내용 변경은 근무지 관리자에게 문의해 주세요.",
  REJECTED: "서명을 거절한 근로계약서입니다. 다시 진행하려면 근무지 관리자에게 문의해 주세요.",
  ENDED: "계약 기간이 종료된 근로계약서입니다.",
};

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

  const [c, statuses, employmentTypes, documentKinds, identityFields] = await Promise.all([
    getContract(contractId),
    getEnumOrEmpty("ContractStatus"),
    getEnumOrEmpty("EmploymentType"),
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
  const deadline = deadlineOf(c, now);
  const paper = c.contractMethod === "PAPER";
  // 화면 제목은 목록에서 누른 상자 제목과 같다 — 「파트타이머 근로계약서」(고용 형태가 없으면 「근로계약서」, 2026-11-20 사용자 지정)
  const header = <PageHeader title={employmentType ? `${employmentType} 근로계약서` : "근로계약서"} backHref={backHref} />;

  if (paper) {
    const files = paperDocuments(c.documents);
    return (
      <ContractFrame header={header}>
        {downloadAlert}
        <Notice>
          <strong>종이로 맺은 계약입니다.</strong>
          <br />
          관리자가 종이 계약서를 올렸습니다.
          <br />
          앱에서 서명할 필요는 없습니다.
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
                  {/* 받기 · 내보내기 링크의 근거(아래 「계약서 PDF 받기」도 이것을 따른다). 이 앱의 라우트가 로그인 토큰으로 api 의 서명
                      주소를 받아 보낸다(documents/[contractDocumentId]/route.ts). 라우트
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
  const signedCopy = signedCopyOf(c);
  // 조항(articles)이 비어 오면 본문 없이 서명하게 두지 않는다 — 위 안내만 보이고 서명 · 거절 · 수정 요청을 열지 않는다(bodyMissing)
  const noBody = bodyMissing(c);
  // 서명할 수 없는 까닭 — 본인 대조 불일치 · 근무지가 운영 중이 아님 · 모름(signBlockOf)
  const signBlock = signBlockOf(c);
  // 버튼 줄은 서명할 수 있거나 본인 대조만 다를 때 — 근무지가 운영 중이 아니거나 까닭을 모르면 두지 않는다(canDecideOf)
  const canDecide = canDecideOf(c.awaitingSignature, noBody, signBlock);
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
              근로계약서는 받은 날부터 30일 안에 서명해야 합니다.
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
        ) : c.awaitingSignature && noBody ? (
          // 본문을 받지 못한 서명 대기 — 서명 · 수정 요청을 열지 않으므로(canDecide) 본인 대조 경고보다 먼저 이것만 알린다
          <Alert tone="warning">
            <p>
              <strong>계약서 본문을 불러오지 못해 지금은 서명할 수 없습니다.</strong>
              <br />
              잠시 뒤 다시 열어 주세요. 계속되면 근무지 관리자에게 문의해 주세요.
            </p>
          </Alert>
        ) : signBlock === "STORE" ? (
          // 근무지가 운영 중이 아니다 — 미운영 · 폐점이거나 사업주 정보(대표자 · 사업자등록번호)가 없다(본사 사업자 인증 해제 등).
          // 직원이 고칠 수 없어 관리자에게 알린다. 본인 대조도 틀리면 api 가 그것을 먼저 알리므로(409 IDENTITY_MISMATCH) 아래 대조
          // 안내를 보인다
          <Alert tone="warning">
            <p>
              <strong>근무지가 운영 중이 아니거나 사업주 정보(대표자 · 사업자등록번호)가 없어 지금은 서명할 수 없습니다.</strong>
              <br />
              근무지 관리자에게 문의해 주세요. 관리자가 근무지 정보를 바로잡으면 계약서를 다시 열어 서명할 수 있습니다.
            </p>
          </Alert>
        ) : signBlock === "IDENTITY" ? (
          // 본인 대조(WHALEERP-125): 다른 항목만 알린다 — 계정 값은 보이지 않는다. 날인 대신 수정 요청을 낸다.
          <Alert tone="warning">
            <p>
              <strong>계약서의 직원 정보가 가입한 정보와 달라 서명할 수 없습니다.</strong>
              <br />
              {mismatched ? `다른 항목: ${mismatched}` : "다른 항목이 있습니다."}
              <br />
              계약서 내용을 확인하고 수정을 요청해 주세요. 근무지 관리자가 고쳐 다시 보내면 서명할 수 있습니다.
              {c.storeNotOperating === true && (
                // 근무지도 운영 중이 아니면 고쳐도 다시 보낼 수 없다(api 가 막는다) — 관리자가 근무지도 바로잡아야 한다는 것을 함께 알린다
                <>
                  <br />
                  지금은 근무지도 운영 중이 아니거나 사업주 정보가 없어, 관리자가 근무지 정보도 바로잡아야 합니다.
                </>
              )}
            </p>
          </Alert>
        ) : signBlock === "OTHER" ? (
          // api 가 서명할 수 없다고 하는데 까닭을 모른다 — 대조 안내로 잘못 보이지 않게 관리자 문의만 알린다(위 서명 불가와 같은 모양)
          <Notice>
            <strong>지금은 서명할 수 없는 계약서입니다.</strong>
            <br />
            근무지 관리자에게 문의해 주세요.
          </Notice>
        ) : phase === "CORRECTION_REQUESTED" ? (
          <Notice>
            <strong>수정을 요청한 계약서입니다.</strong>
            <br />
            근무지 관리자가 고쳐 다시 보내면 서명할 수 있습니다.
          </Notice>
        ) : (
          // 처리가 끝난 계약서(서명 완료 · 거절 · 종료)는 위 안내 상자 대신 요약 카드 아래 회색 한 줄로 알린다(아래 finishedNote)
          null
        )}

        {/* 머리 요약 — 근무지명 · 상태, 받은 날 · 서명(기한이면 남은 날 꺾은선), 그 밖 단계는 한 줄 안내(2026-11-20 사용자 지정) */}
        <ContractSummary
          storeName={c.employer.storeName}
          badge={<Badge tone={statusTone(phase)}>{status}</Badge>}
          rows={[
            ["받은 날", c.sentAt && kstDateLabel(c.sentAt)],
            deadline
              ? ["서명 기한", deadline.dateTime]
              : ["서명일", phase === "SIGNED" && c.processedAt ? kstDateLabel(c.processedAt) : null],
          ]}
          left={deadline ? { text: deadline.daysLeft === 0 ? "오늘 마감" : `${deadline.daysLeft}일 남음`, urgent: deadline.urgent } : undefined}
          note={!deadline && phase !== "SIGNED" ? contractSubText(c, now, status, "detail") : null}
        />
        {isFinished(phase) && FINISHED_NOTE[phase] && (
          <p className="-mt-[4px] flex gap-[6px] px-[4px] text-[13px] leading-[1.5] break-keep text-staff-text-muted">
            <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-[2px] shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5.5M12 7.5v.5" />
            </svg>
            <span>{FINISHED_NOTE[phase]}</span>
          </p>
        )}

        <ContractDocument articles={c.articles} employmentTypeLabel={employmentType} />

        {/* 표준근로계약서처럼 사업주가 먼저, 근로자(내 정보)가 다음이다(2026-11-20 사용자 확인). 계약서 본문 · PDF · 서명 불가 안내와 같은 「사업주」 — 「관리자」는 이 화면에서 문의할 근무지 관리자다(2026-11-19 사용자 결정) */}
        <InfoGroup
          title="사업주(근무지)"
          rows={[
              ["상호", c.employer.tradeName ?? c.employer.storeName],
              ["대표자", c.employer.ceoName],
              ["사업자등록번호", c.employer.registrationNumber],
              ["사업장 주소", address(c.employer.bizAddress, c.employer.bizAddressDetail)],
              ["전화", c.employer.storePhone],
          ]}
        />

        <InfoGroup
          title="계약서에 들어가는 내 정보"
          rows={[
              ["이름", worker.name],
              ["생년월일", worker.birthDate && dateLabel(worker.birthDate)],
              ["휴대전화번호", maskPhone(worker.phone)],
              // 주소는 날인할 때 계정 주소로 고정된다 — 날인 전이면 비어 있어 계정 주소를 보인다(api)
              ["주소", address(worker.address, worker.addressDetail) ?? address(c.account.address, c.account.addressDetail)],
          ]}
        />

        {/* api 가 지금 날인할 수 있다고 할 때만(서명 대기 · 기한 안 · 재직 중) — 아래 버튼 줄과 같은 판정 */}
        {canDecide && <Tiny>서명하거나 거절하면 근무지 관리자에게 알림이 전달됩니다.</Tiny>}
      </ContractFrame>
      {signedCopy && (
        // 체결이 끝난 계약의 처리 완료본 내보내기(WHALEERP-149). 서명 대기에서는 내보내지 않는다 — 처리 완료본은 체결 뒤 파일 생성
        // (WHALEERP-131)이 만들어 documents 에 SIGNED_COPY 로 실린다. 아직 없으면 버튼도 없다.
        <Dock inset={30}>
          {/* 종이 계약 「받기」와 같은 <a>(근거는 그 주석). 모양만 공통 Button 의 outline(급여명세서 「명세서 PDF 받기」와 같음).
              Plane 의 「공유 시트」는 휴대전화 브라우저가 받은 PDF 에 띄우는 저장 · 공유로 갈음한다 — Web Share API 는 서명 주소가
              다른 출처라 파일을 읽어 올 수 없어 쓰지 않는다. */}
          <a href={`/contracts/${c.contractId}/documents/${signedCopy.contractDocumentId}${storeQuery}`} className={buttonClass("outline")}>
            계약서 PDF 받기
          </a>
        </Dock>
      )}
      {canDecide && c.sentAt && (
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
