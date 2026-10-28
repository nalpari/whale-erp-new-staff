import { Card } from "@/components/common";
import { formatWon, itemAmount } from "@/lib/payslip-rules";
import type { PayslipItem } from "@/lib/payslips";

// 목업 table.pay. 비과세 줄은 이름 아래 「비과세」, 3.3% 원천징수 줄은 끝자리 처리 미정 안내(PAY-7)를 작은 글자로 붙인다.
// 목업의 줄마다 계산 근거(PAY-3) · 가산 미적용 「1배」 · 「· 정정됨」(PAY-1)은 api 에 그 값이 없어 보이지 않는다.
function subText(item: PayslipItem): string | undefined {
  if (item.isTaxFree) return "비과세";
  if (item.itemCategory === "WITHHOLDING") return "끝자리 세무 확인 대기(PAY-7)";
  return undefined;
}

export function PayTable({ head, items, totalLabel, total }: { head: string; items: readonly PayslipItem[]; totalLabel: string; total: number }) {
  return (
    <Card>
      <table className="w-full text-[14px]">
        <thead>
          <tr className="text-[13px] font-semibold text-staff-text-sub">
            <th className="pb-[8px] text-left font-semibold">{head}</th>
            <th className="pb-[8px] text-right font-semibold">금액</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const sub = subText(item);
            return (
              <tr key={item.payslipItemId} className="border-t border-staff-border-light align-top">
                <td className="py-[10px] pr-[12px]">
                  {item.itemName}
                  {sub && <span className="block text-[12px] break-keep text-staff-text-muted">{sub}</span>}
                </td>
                <td className="py-[10px] text-right whitespace-nowrap tabular-nums">{formatWon(itemAmount(item))}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-staff-border font-bold">
            <td className="pt-[10px]">{totalLabel}</td>
            <td className="pt-[10px] text-right tabular-nums">{formatWon(total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
