import { articleLayout } from "@/lib/contract-rules";
import type { ContractArticle, ContractBlock } from "@/lib/contracts";
import { Values } from "./parts";

// 전자계약 계약서 본문(CON-1 · WHALEERP-146). 조항 문장은 api 조항 템플릿(articles, WHALEERP-131 · 661)을 받은 순서대로 그린다 —
// 보낸 원본 · 처리 완료본 PDF 와 같은 템플릿이라 앱 본문과 보관 원본이 같은 문장이고, 템플릿 문구가 바뀌면 앱 배포 없이 따라 바뀐다.
// 서명한 계약의 점포명 · 근무 장소 · 직무는 api 가 서명 때 값으로 고정해 준다. 종이 계약(CTR-23)은 이 본문을 그리지 않는다.
export function ContractDocument({ articles, employmentTypeLabel }: { articles: ContractArticle[]; employmentTypeLabel: string | null }) {
  return (
    <section aria-label="계약서 본문" className="rounded-[16px] border border-staff-border-light bg-white p-[16px]">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">근로계약서{employmentTypeLabel && ` · ${employmentTypeLabel}`}</h2>
      <div className="flex flex-col gap-[10px] pt-[8px] text-[14px] leading-[1.85]">
        {/* 조항 · 블록 · 칸은 서버가 한 번 그리는 고정 목록이고 값(제목 · 머리글 · 요일)이 유일하다는 보장은 api 템플릿에 있어 index 로 둔다 */}
        {articles.map((a, i) => (
          <Article key={i} article={a} />
        ))}
      </div>
    </section>
  );
}

/** 조항 하나. 첫 TEXT 는 제목 뒤에 잇고(api 규칙), 나머지 블록은 그 아래에 둔다. */
function Article({ article }: { article: ContractArticle }) {
  const { lead, rest } = articleLayout(article);
  const head = (
    <p>
      <strong className="font-bold">{article.title}</strong>
      {lead !== null && ` ${lead}`}
    </p>
  );
  if (rest.length === 0) return head;
  return (
    <div className="flex flex-col gap-[6px]">
      {head}
      {rest.map((b, i) => (
        <Block key={i} block={b} caption={`${article.title} 표`} />
      ))}
    </div>
  );
}

/** caption 은 표일 때 스크린리더가 읽는 이름(조항 제목) — 표가 어느 조항에 붙어도 맞게 */
function Block({ block, caption }: { block: ContractBlock; caption: string }) {
  if (block.type === "TEXT") return <p>{block.text}</p>;
  if (block.type === "VALUES") return <Values rows={(block.values ?? []).map((v): [string, string] => [v.label, v.value])} />;
  const header = block.header ?? [];
  // 마지막 칸(근로시간)은 오른쪽 정렬, 첫 칸(요일)은 줄 머리
  const align = (i: number) => (i === header.length - 1 ? "text-right" : "text-left");
  return (
    <table className="w-full border-collapse text-[13px] leading-[1.5]">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-staff-border-light text-staff-text-muted">
          {header.map((h, i) => (
            <th key={i} scope="col" className={`py-[4px] font-medium ${align(i)}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(block.tableRows ?? []).map((r, ri) => (
          <tr key={ri}className={r.off ? "text-staff-text-muted" : undefined}>
            {r.cells.map((cell, i) =>
              i === 0 ? (
                <th key={i} scope="row" className="py-[5px] text-left font-normal">
                  {cell}
                </th>
              ) : (
                <td key={i} className={`py-[5px] tabular-nums ${align(i)}`}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
