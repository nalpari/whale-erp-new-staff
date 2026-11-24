import { SubLine } from "@/components/common";
import { formatWon, itemAmount } from "@/lib/payslip-rules";
import type { PayslipItem } from "@/lib/payslips";

// 목업 table.pay → 정돈 시안 카드형(2026-11-20 사용자 지정). 카드 머리 줄에 「지급 · 합계」를 굵게 두고(맨 아래 합계 줄 대신),
// 줄마다 이름 · 금액, 덧붙임은 이름 아래 둥근 꺾은선 줄(SubLine) — 비과세, 3.3% 원천징수 줄의 끝자리 처리 미정 안내(PAY-7).
// 그 안내가 없는 줄은 api 의 한 줄 계산식(calculationText — 「8.0시간 × 10,320원 × 1.5배」 · 가산을 끄면 「× 1배」 · 고친 금액은 「직접 입력」)을
// 항목 이름 아래 12px 흐린 글자로 보인다(목업 PAY-3 자리, WHALEERP-755 — 근로기준법 시행령 제27조의2 의 계산방법 · 시간 수). 관리자 상세 · PDF 와
// 같은 글자다. 식이 없으면(계산하지 않음 · 2026-11-24 전 명세서) 아무것도 두지 않는다. 「· 정정됨」(PAY-1)은 api 에 그 값이 없어 보이지 않는다.
function subText(item: PayslipItem): string | undefined {
  if (item.isTaxFree) return "비과세";
  if (item.itemCategory === "WITHHOLDING") return "끝자리 세무 확인 대기(PAY-7)";
  return undefined;
}

export function PayTable({ head, items, total }: { head: string; items: readonly PayslipItem[]; total: number }) {
  return (
    <section className="w-full rounded-[16px] border border-staff-border bg-white px-[18px] pt-[16px] pb-[4px]">
      <h2 className="flex items-baseline justify-between gap-[12px] pb-[10px] text-[15px] font-bold">
        <span>{head}</span>
        <span className="tabular-nums">{formatWon(total)}원</span>
      </h2>
      <ul>
        {items.map((item) => {
          const sub = subText(item);
          const formula = sub ? null : item.calculationText;
          return (
            <li key={item.payslipItemId} className="flex flex-col gap-[4px] border-t border-staff-border-light py-[12px]">
              <div className="flex items-start justify-between gap-[12px] text-[15px]">
                <span className="min-w-0 break-keep">{item.itemName}</span>
                <span className="whitespace-nowrap tabular-nums">{formatWon(itemAmount(item))}원</span>
              </div>
              {sub && <SubLine>{sub}</SubLine>}
              {formula && <span className="text-[12px] leading-[1.5] break-keep text-staff-text-muted">{formula}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
