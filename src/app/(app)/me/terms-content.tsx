import type { ReactNode } from "react";
import { parseTermsMarkdown } from "@/lib/terms-markdown";

// 약관 본문(Markdown, `GET /public-terms-versions/:termsTypeCode` 의 content)을 시트 안에 그린다. 약관이 쓰는 모양만 다룬다 —
// 제목(#~######, 모두 한 단계 h3) · 문단 · 번호/점 목록 · 표 · **굵게**. HTML 은 해석하지 않고 글자로 둔다(React 가 이스케이프한다).
// 약관 화면이 더 생기면(회원가입 · 재동의) 공통 부품으로 올린다.

/** **굵게** 만 바꾼다. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-bold text-staff-text">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

export function TermsContent({ markdown }: { markdown: string }) {
  return (
    <div className="flex flex-col gap-[10px] text-[13px] text-staff-text-sub">
      {parseTermsMarkdown(markdown).map((block, i) => {
        if (block.kind === "heading")
          return (
            <h3 key={i} className="pt-[6px] text-[14px] font-bold text-staff-text">
              {inline(block.text)}
            </h3>
          );
        if (block.kind === "paragraph") return <p key={i}>{inline(block.text)}</p>;
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={i}
              start={block.ordered && block.start !== 1 ? block.start : undefined}
              className={`flex flex-col gap-[4px] pl-[18px] ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </List>
          );
        }
        // 좁은 화면이라 표는 줄마다 「머리 · 값」 카드로 풀어 쓴다.
        return (
          <dl key={i} className="flex flex-col gap-[8px]">
            {block.rows.map((row, j) => (
              <div key={j} className="rounded-[10px] border border-staff-border-light bg-white px-[12px] py-[8px]">
                {block.head.map((name, k) => (
                  <div key={k} className="flex gap-[10px] py-[2px]">
                    <dt className="w-[84px] shrink-0 text-staff-text-muted">{name}</dt>
                    <dd className="min-w-0 flex-1 text-staff-text">{inline(row[k])}</dd>
                  </div>
                ))}
              </div>
            ))}
          </dl>
        );
      })}
    </div>
  );
}
