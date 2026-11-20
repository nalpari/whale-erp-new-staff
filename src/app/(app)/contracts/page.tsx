import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, MaskIcon, PageHeader, SubLine } from "@/components/common";
import { contractSubText, deadlineOf, groupContracts, isFinished as isFinishedPhase, parseId, periodText, phaseLabel, phaseOf, statusTone } from "@/lib/contract-rules";
import { getContracts, type ContractListItem } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf, type EnumValue } from "@/lib/enums";
import { kstDateLabel } from "@/lib/profile";
import { requireSession } from "@/lib/session";
import { WorkplaceBox } from "@/app/_components/workplace-box";
import { ContractFrame } from "./_components/parts";

export const metadata: Metadata = { title: "근로계약 · Whale ERP" };

// 근로계약서 목록(WHALEERP-146). 기준: 데모 docs/demo/src/pages/contract 의 목록 · 빈 상태(Figma 없음, DESIGN.md 기준 초안).
// 앱 전역에서 고른 근무지와 관계없이 받은 계약서 모두를 보인다. 내 정보 > 내 근무지의 「근로계약서」로 오면 주소의 ?store= 로
// 그 근무지 계약서만 보인다(ME-7 · TAX-8). api 에 점포로 거르는 칸이 없어 여기서 storeId 로 거른다.
// 정돈 시안 ⑮(2026-11-20 사용자 지정): 흰 바탕, 근무지에서 왔으면 맨 위 근무지 상자, 「진행 중인 근로계약서 N건」(연회색 상자) ·
// 「지난 근로계약서 N건」(흰 상자) 두 묶음. 상자마다 제목 · 상태 배지 · 꺾쇠, 아래 이름 · 값 줄(계약 기간 · 서명 기한 · 서명일),
// 남은 날은 둥근 꺾은선(7일 이내면 강조색, CON-4). 서명은 상세에서 내용을 보고 한다 — 목록에 서명 버튼을 두지 않는다.
// 데모 빈 상태의 「관리자에게 문의하기」 버튼은 문의 api 가 없어 두지 않고 문의 방법만 적는다.
export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  await requireSession();
  const storeId = parseId((await searchParams).store);
  const [all, statuses, employmentTypes] = await Promise.all([getContracts(), getEnumOrEmpty("ContractStatus"), getEnumOrEmpty("EmploymentType")]);
  const items = storeId === null ? all : all.filter((c) => c.storeId === storeId);
  const now = new Date();
  const { open, finished } = groupContracts(items, now);
  // 내 근무지에서 왔으면 그리로 돌아간다. 데모 목록의 뒤로 가기는 홈이다.
  const backHref = storeId === null ? "/home" : "/me/memberships";
  const query = storeId === null ? "" : `?store=${storeId}`;
  const row = (c: ContractListItem) => (
    <ContractRow key={c.contractId} c={c} now={now} query={query} inStore={storeId !== null} statuses={statuses} employmentTypes={employmentTypes} />
  );

  return (
    <div className="flex flex-1 flex-col bg-white">
    <ContractFrame header={<PageHeader title="근로계약서" backHref={backHref} />}>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[8px] pb-[52px] text-center">
          <span className="flex text-staff-placeholder">
            <MaskIcon src="/icons/contract.svg" size={30} />
          </span>
          <h2 className="pt-[6px] text-[18px] font-bold">{storeId === null ? "받은 근로계약서가 없습니다" : "이 근무지에서 받은 근로계약서가 없습니다"}</h2>
          <p className="text-[14px] text-staff-text-muted">
            근무지에서 근로계약서를 보내면 여기에 표시됩니다.
            <br />
            받지 못했다면 근무지 관리자에게 문의해 주세요.
          </p>
        </div>
      ) : (
        <>
          {/* 근무지 줄 아래는 묶음 사이(12)보다 8 더 띄운다 — 머리줄 아래 빈 공간과 눈으로 같아 보이게(2026-11-20 사용자 지정) */}
          {storeId !== null && (
            <div className="pb-[8px]">
              <WorkplaceBox name={items[0].storeName} />
            </div>
          )}
          {open.length > 0 && <Group title="진행 중인 근로계약서" count={open.length}>{open.map(row)}</Group>}
          {finished.length > 0 && <Group title="지난 근로계약서" count={finished.length}>{finished.map(row)}</Group>}
        </>
      )}
    </ContractFrame>
    </div>
  );
}

/** 묶음 — 이름(14 semibold 보조) 뒤 남보라 건수, 아래 상자들(사이 8). */
function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[8px]">
      <h2 className="px-[4px] text-[14px] font-semibold text-staff-text-sub">
        {title} <span className="text-staff-primary">{count}건</span>
      </h2>
      <ul className="flex flex-col gap-[8px]">{children}</ul>
    </section>
  );
}

/** 이름 · 값 한 줄 — 이름 64px 흐림, 값 14px. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex gap-[12px] text-[14px]">
      <span className="w-[64px] shrink-0 text-staff-text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-keep">{children}</span>
    </span>
  );
}

function ContractRow({
  c,
  now,
  query,
  inStore,
  statuses,
  employmentTypes,
}: {
  c: ContractListItem;
  now: Date;
  query: string;
  /** 내 근무지에서 들어와 근무지가 맨 위에 보이면 제목에 근무지명을 되풀이하지 않는다 */
  inStore: boolean;
  statuses: EnumValue[];
  employmentTypes: EnumValue[];
}) {
  // 날인할 수 없는 서명 대기는 만료 · 서명 불가로 보인다(상세와 같다). 강조는 api 가 날인할 수 있다고 할 때만(deadlineOf).
  const phase = phaseOf(c, now);
  const status = phaseLabel(phase, labelOf(statuses, phase));
  const deadline = deadlineOf(c, now);
  const employment = c.employmentType ? labelOf(employmentTypes, c.employmentType) : null;
  // 상자 제목은 누르면 열리는 상세의 화면 제목과 같다 — 「파트타이머 근로계약서」(2026-11-20 사용자 지정)
  const title = inStore ? `${employment ? `${employment} ` : ""}근로계약서` : [c.storeName, employment].filter(Boolean).join(" · ");
  const open = !isFinishedPhase(phase);
  // 서명 기한 · 서명일로 말할 수 없는 단계(거절 · 만료 · 서명 불가 · 수정 요청)는 목록 한 줄 안내를 그대로 둔다
  const note = !deadline && phase !== "SIGNED" && phase !== "ENDED" ? contractSubText(c, now, status) : null;
  return (
    <li>
      <Link
        href={`/contracts/${c.contractId}${query}`}
        transitionTypes={["nav-forward"]}
        className={`flex w-full flex-col gap-[10px] rounded-[16px] border border-staff-border py-[16px] pr-[16px] pl-[18px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive ${open ? "bg-staff-bg" : "bg-white"}`}
      >
        <span className="flex items-center gap-[8px]">
          <span aria-hidden className="flex text-staff-text-sub">
            <MaskIcon src="/icons/contract.svg" size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{title}</span>
          <Badge tone={statusTone(phase)}>{status}</Badge>
          <span className="flex text-staff-placeholder">
            <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
          </span>
        </span>
        <span className="flex flex-col gap-[6px]">
          {c.startDate && <Row label="계약 기간">{periodText(c.startDate, c.endDate)}</Row>}
          {deadline && (
            <span className="flex flex-col gap-[2px]">
              <Row label="서명 기한">{deadline.dateTime}</Row>
              <span className="pl-[72px]">
                <SubLine>
                  {/* 기한 7일 이내: 상태 칩 지각 · 긴급 글자색(#956013, CON-4) */}
                  <span className={deadline.urgent ? "font-semibold text-[#956013]" : undefined}>
                    {deadline.daysLeft === 0 ? "오늘 마감" : `${deadline.daysLeft}일 남음`}
                  </span>
                </SubLine>
              </span>
            </span>
          )}
          {phase === "SIGNED" && c.processedAt && <Row label={c.contractMethod === "PAPER" ? "등록일" : "서명일"}>{kstDateLabel(c.processedAt)}</Row>}
          {note && <span className="text-[13px] text-staff-text-muted">{note}</span>}
        </span>
      </Link>
    </li>
  );
}
