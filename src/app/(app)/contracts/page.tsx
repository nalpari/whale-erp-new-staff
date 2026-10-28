import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, MaskIcon, PageHeader } from "@/components/common";
import { contractSubText, deadlineOf, groupContracts, parseId, statusTone } from "@/lib/contract-rules";
import { getContracts, type ContractListItem } from "@/lib/contracts";
import { getEnumOrEmpty, labelOf, type EnumValue } from "@/lib/enums";
import { requireSession } from "@/lib/session";
import { ContractFrame, Tiny } from "./_components/parts";

export const metadata: Metadata = { title: "근로계약 · Whale ERP" };

// 근로계약서 목록(WHALEERP-146). 기준: 데모 docs/demo/src/pages/contract 의 목록 · 빈 상태(Figma 없음, DESIGN.md 기준 초안).
// 앱 전역에서 고른 근무지와 관계없이 받은 계약서 모두를 보인다. 내 정보 > 소속 근무지의 「근로계약서」로 오면 주소의 ?store= 로
// 그 근무지 계약서만 보인다(ME-7 · TAX-8). api 에 점포로 거르는 칸이 없어 여기서 storeId 로 거른다.
// 진행 중(서명 대기 · 수정 요청)을 위에, 처리가 끝난 계약서를 아래에 둔다. 남은 날인 기한이 7일 이내면 기한 줄을 강조색으로(CON-4).
// 데모 빈 상태의 「관리자에게 문의하기」 버튼은 문의 api 가 없어 두지 않고 문의 방법만 적는다.
export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  await requireSession();
  const storeId = parseId((await searchParams).store);
  const [all, statuses, employmentTypes] = await Promise.all([getContracts(), getEnumOrEmpty("ContractStatus"), getEnumOrEmpty("EmploymentType")]);
  const items = storeId === null ? all : all.filter((c) => c.storeId === storeId);
  const { open, finished } = groupContracts(items);
  const now = new Date();
  // 소속 근무지에서 왔으면 그리로 돌아간다. 데모 목록의 뒤로 가기는 홈이다.
  const backHref = storeId === null ? "/home" : "/me/memberships";
  const query = storeId === null ? "" : `?store=${storeId}`;
  const row = (c: ContractListItem) => <ContractRow key={c.contractId} c={c} now={now} query={query} statuses={statuses} employmentTypes={employmentTypes} />;

  return (
    <ContractFrame header={<PageHeader title="근로계약" backHref={backHref} />}>
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
          {storeId !== null && (
            <p className="text-[13px] text-staff-text-sub">
              <strong className="font-bold text-staff-text">{items[0].storeName}</strong>의 근로계약서만 보입니다.
            </p>
          )}
          {open.length > 0 && <Group title="진행 중인 계약서">{open.map(row)}</Group>}
          {finished.length > 0 && <Group title="처리가 끝난 계약서">{finished.map(row)}</Group>}
          <Tiny>서명 기한은 계약서를 받은 날부터 30일입니다.</Tiny>
        </>
      )}
    </ContractFrame>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[8px]">
      <h2 className="px-[4px] text-[13px] font-semibold text-staff-text-sub">{title}</h2>
      <ul className="flex flex-col divide-y divide-staff-border-light overflow-hidden rounded-[16px] border border-staff-border-light bg-white">{children}</ul>
    </section>
  );
}

function ContractRow({
  c,
  now,
  query,
  statuses,
  employmentTypes,
}: {
  c: ContractListItem;
  now: Date;
  query: string;
  statuses: EnumValue[];
  employmentTypes: EnumValue[];
}) {
  const status = labelOf(statuses, c.status);
  const urgent = deadlineOf(c, now)?.urgent ?? false;
  return (
    <li>
      <Link
        href={`/contracts/${c.contractId}${query}`}
        transitionTypes={["nav-forward"]}
        className="flex min-h-[44px] w-full items-center gap-[12px] p-[16px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="truncate text-[15px] font-semibold">
            {c.storeName}
            {c.employmentType && ` · ${labelOf(employmentTypes, c.employmentType)}`}
          </span>
          {/* 기한 7일 이내: 상태 칩 지각 · 긴급 글자색(#956013, CON-4) */}
          <span className={`text-[12px] ${urgent ? "font-semibold text-[#956013]" : "text-staff-text-muted"}`}>{contractSubText(c, now, status)}</span>
        </span>
        <Badge tone={statusTone(c.status)}>{status}</Badge>
        <span className="flex text-staff-placeholder">
          <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
        </span>
      </Link>
    </li>
  );
}
