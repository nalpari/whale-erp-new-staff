import Image from "next/image";
import Link from "next/link";
import { Badge, MaskIcon } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import { employmentLine, invitationTypeLabel, type AffiliationRequest } from "@/lib/affiliation-requests";
import { kstDateLabel } from "@/lib/profile";

/**
 * 답하지 않은 소속 추가 확인 요청 목록(WHALEERP-144). 확인 화면(/affiliations)의 고르기와 내 정보 - 소속 근무지가 같이 쓴다.
 * 한 줄: 점포 아이콘 · 점포 이름 · 고용 형태 · 직무와 답할 기한 · 유형 배지 · 꺾쇠. 누르면 그 요청의 확인 화면(`?id=`)으로 간다.
 */
export function AffiliationRequestList({ items }: { items: AffiliationRequest[] }) {
  return (
    <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
      {items.map((item) => (
        <li key={item.invitationId}>
          <Link
            href={`/affiliations?id=${item.invitationId}`}
            transitionTypes={["nav-forward"]}
            className={`-mx-[16px] flex items-center gap-[12px] px-[16px] py-[14px] active:bg-staff-primary-inactive ${PRESS}`}
          >
            <span className="flex text-staff-text-sub">
              <MaskIcon src="/icons/store-small.svg" size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold break-keep">{item.storeName}</span>
              <span className="block text-[12px] text-staff-text-sub">
                {employmentLine(item)} · {kstDateLabel(item.expiresAt)}까지 답할 수 있습니다
              </span>
            </span>
            <Badge tone="warning">{invitationTypeLabel(item)}</Badge>
            <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
