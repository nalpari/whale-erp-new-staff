// 약관 본문(Markdown, `GET /public-terms-versions/:termsTypeCode` 의 content)을 블록으로 나눈다. 약관이 쓰는 모양만 다룬다 —
// 제목(#~######) · 문단 · 번호/점 목록 · 표. 그리는 쪽은 src/app/(app)/me/terms-content.tsx.
// node --test 가 직접 읽으므로 값 import 는 두지 않는다.

export type TermsBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  /** start 는 번호 목록의 첫 번호(「3.」으로 시작하면 3). 점 목록은 1. */
  | { kind: "list"; ordered: boolean; start: number; items: string[] }
  /** 줄마다 칸 수는 head 와 같다 — 모자라면 빈 칸으로 채우고 넘치면 버린다(관리자가 고치는 데이터). */
  | { kind: "table"; head: string[]; rows: string[][] };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
const isTableRule = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
// 번호 목록은 1~3자리 번호. 「2026. 10. 20. 시행」처럼 숫자가 이어지는 날짜 줄은 목록이 아니라 문단이다.
const ORDERED = /^\s*\d{1,3}\.\s+(?!\d+\.)/;
const HEADING = /^#{1,6}\s+/;
const BULLET = /^\s*[-*]\s+/;

/** 약관 Markdown 을 블록으로 나눈다. 모르는 모양은 문단으로 두고, 어떤 입력에도 줄마다 앞으로 나아간다(관리자가 고치는 데이터다). */
export function parseTermsMarkdown(markdown: string): TermsBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: TermsBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
    } else if (HEADING.test(line)) {
      // 「#   」처럼 글자 없는 제목은 그리지 않는다.
      const text = line.replace(HEADING, "").trim();
      if (text) blocks.push({ kind: "heading", text });
      i += 1;
    } else if (line.trim().startsWith("|") && isTableRule(lines[i + 1] ?? "")) {
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = cells(lines[i++]);
        rows.push(head.map((_, k) => row[k] ?? ""));
      }
      blocks.push({ kind: "table", head, rows });
    } else if (ORDERED.test(line) || BULLET.test(line)) {
      const ordered = ORDERED.test(line);
      const marker = ordered ? ORDERED : BULLET;
      const start = ordered ? Number.parseInt(line.trim(), 10) : 1;
      const items: string[] = [];
      while (i < lines.length && marker.test(lines[i])) items.push(lines[i++].replace(marker, ""));
      blocks.push({ kind: "list", ordered, start, items });
    } else {
      // 첫 줄은 조건 없이 받는다 — 표 구분선 없이 「|」로 시작하는 줄(깨진 표)도 여기로 오는데, 한 줄도 못 받으면 i 가 멈춰 끝없이 돈다.
      const text: string[] = [line.trim()];
      i += 1;
      while (i < lines.length && lines[i].trim() && !HEADING.test(lines[i]) && !lines[i].trim().startsWith("|")) {
        if (ORDERED.test(lines[i]) || BULLET.test(lines[i])) break;
        text.push(lines[i++].trim());
      }
      blocks.push({ kind: "paragraph", text: text.join(" ") });
    }
  }
  return blocks;
}
