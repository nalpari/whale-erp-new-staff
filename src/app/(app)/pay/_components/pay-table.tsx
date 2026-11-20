import { SubLine } from "@/components/common";
import { formatWon, itemAmount } from "@/lib/payslip-rules";
import type { PayslipItem } from "@/lib/payslips";

// 목업 table.pay → 정돈 시안 카드형(2026-11-20 사용자 지정). 카드 머리 줄에 「지급 · 합계」를 굵게 두고(맨 아래 합계 줄 대신),
// 줄마다 이름 · 금액, 덧붙임은 이름 아래 둥근 꺾은선 줄(SubLine) — 비과세, 3.3% 원천징수 줄의 끝자리 처리 미정 안내(PAY-7).
// 목업 · 시안의 줄마다 계산 근거(「시급 10,800원 × 80시간」, PAY-3) · 가산 미적용 「1배」 · 「· 정정됨」(PAY-1)은 api 에 그 값이 없어
// 보이지 않는다 — 근로기준법 시행령 제27조의2(임금명세서 기재사항)의 계산 방법이라 api 가 근거를 주면 같은 꺾은선 줄로 붙인다(3팀 확인).
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
          return (
            <li key={item.payslipItemId} className="flex flex-col gap-[4px] border-t border-staff-border-light py-[12px]">
              <div className="flex items-start justify-between gap-[12px] text-[15px]">
                <span className="min-w-0 break-keep">{item.itemName}</span>
                <span className="whitespace-nowrap tabular-nums">{formatWon(itemAmount(item))}원</span>
              </div>
              {sub && <SubLine>{sub}</SubLine>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
