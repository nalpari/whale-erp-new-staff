import Link from "next/link";
import { MaskIcon, SectionTitle } from "@/components/common";
import type { ContractListItem } from "@/lib/contracts";
import { signWaitingCards, type SignWaitingCard } from "@/lib/sign-request";

// 홈의 서명 대기 카드(WHALEERP-146, 데모 home 의 todo · empty). 처리할 일은 카드로 알린다(HOME-1) — 서명 요청 팝업을 「다음에 하기」로
// 닫은 뒤에도 이 카드로 그 계약서 상세에 간다. 경고 칩 색(#FFF6E5 · #956013)은 데모처럼 이 카드에만 빌려 토큰으로 두지 않는다.
// 남은 기한이 7일 이내면 기한 글자만 굵게 강조한다(146 · CON-4 — 카드 바탕은 늘 같은 색).
const CARD = "flex items-center gap-[12px] rounded-[18px] bg-[#fff6e5] px-[16px] py-[14px] text-[#956013] transition-opacity duration-150 ease-out active:opacity-80";

function Card({ card, title, sub }: { card: SignWaitingCard; title: string; sub: string }) {
  return (
    <Link href={card.href} transitionTypes={["nav-forward"]} className={CARD}>
      <MaskIcon src="/icons/contract.svg" size={18} />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14px] font-semibold break-keep">{title}</span>
        <span className={`text-[12px] ${card.urgent ? "font-bold" : ""}`}>{sub}</span>
      </span>
      <MaskIcon src="/icons/chevron-right-muted.svg" size={12} flipY />
    </Link>
  );
}

/**
 * 근무지가 있으면 이번 주 근무 아래에 카드만(데모 todo 「강남역점 근로계약서 대기 · 남은 기한 26일」), 근무지가 아직 없으면(가입 직후 —
 * 체결 완료 계약이 없음, CTR-29) 「서명할 근로계약서」 묶음과 서명해야 근무를 시작한다는 안내(데모 empty). 계약 목록을 못 받았거나
 * 서명할 계약이 없으면 아무것도 두지 않는다.
 */
export async function SignWaitingCards({ contracts, noSite }: { contracts: Promise<ContractListItem[] | null>; noSite: boolean }) {
  const items = await contracts;
  const cards = items ? signWaitingCards(items, new Date()) : [];
  if (cards.length === 0) return null;
  if (!noSite)
    return (
      <div className="flex flex-col gap-[8px]">
        {cards.map((c) => (
          <Card
            key={c.contractId}
            card={c}
            title={`${c.storeName} 근로계약서 대기`}
            sub={c.daysLeft === null ? "서명을 기다립니다" : c.daysLeft === 0 ? "오늘 마감" : `남은 기한 ${c.daysLeft}일`}
          />
        ))}
      </div>
    );
  return (
    <section className="flex flex-col gap-[12px]">
      <SectionTitle title="서명할 근로계약서" />
      {cards.map((c) => (
        <Card key={c.contractId} card={c} title={c.storeName} sub={c.until ? `${c.until} 서명해 주세요` : "서명을 기다립니다"} />
      ))}
      <p className="text-[12px] text-staff-text-sub">근로계약서에 서명해야 근무를 시작할 수 있습니다.</p>
    </section>
  );
}
