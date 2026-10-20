// node --test src/lib/terms-markdown.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTermsMarkdown } from "./terms-markdown.ts";

test("구분선 없이 「|」로 시작하는 줄(깨진 표)은 문단이 되고 멈추지 않는다", { timeout: 1000 }, () => {
  assert.deepEqual(parseTermsMarkdown("제1조\n| 항목 | 내용 |\n본문"), [
    { kind: "paragraph", text: "제1조" },
    { kind: "paragraph", text: "| 항목 | 내용 | 본문" },
  ]);
  assert.deepEqual(parseTermsMarkdown("| 끝 줄"), [{ kind: "paragraph", text: "| 끝 줄" }]);
});

test("표는 머리와 줄로 나눈다", () => {
  assert.deepEqual(parseTermsMarkdown("| 목적 | 항목 |\n| --- | --- |\n| 출근 | GPS |\n| 기록 | 오차 |\n\n다음"), [
    { kind: "table", head: ["목적", "항목"], rows: [["출근", "GPS"], ["기록", "오차"]] },
    { kind: "paragraph", text: "다음" },
  ]);
});

test("제목 · 번호 목록 · 점 목록 · 여러 줄 문단 · 빈 줄", () => {
  assert.deepEqual(parseTermsMarkdown("## 권리\n\n1. 하나\n2. 둘\n- 셋\n첫 줄\n둘째 줄\n\n\n"), [
    { kind: "heading", text: "권리" },
    { kind: "list", ordered: true, start: 1, items: ["하나", "둘"] },
    { kind: "list", ordered: false, start: 1, items: ["셋"] },
    { kind: "paragraph", text: "첫 줄 둘째 줄" },
  ]);
  assert.deepEqual(parseTermsMarkdown(""), []);
});

test("날짜로 시작하는 줄(부칙의 시행일)은 번호 목록이 아니라 문단", () => {
  assert.deepEqual(parseTermsMarkdown("2026. 10. 20. 시행"), [{ kind: "paragraph", text: "2026. 10. 20. 시행" }]);
});

test("번호 목록의 첫 번호를 지킨다", () => {
  assert.deepEqual(parseTermsMarkdown("3. 셋\n4. 넷"), [{ kind: "list", ordered: true, start: 3, items: ["셋", "넷"] }]);
});

test("글자 없는 제목은 버리고, 「#제목」(공백 없음)은 문단", () => {
  assert.deepEqual(parseTermsMarkdown("#   \n#제목"), [{ kind: "paragraph", text: "#제목" }]);
});

test("표의 줄은 머리 칸 수에 맞춘다 — 모자라면 빈 칸, 넘치면 버림. 공백 없는 구분선 · 정렬 구분선도 표", () => {
  assert.deepEqual(parseTermsMarkdown("|가|나|\n|:---:|---|\n|1|\n|1|2|3|"), [
    { kind: "table", head: ["가", "나"], rows: [["1", ""], ["1", "2"]] },
  ]);
  assert.deepEqual(parseTermsMarkdown("| 가 |\n| --- |"), [{ kind: "table", head: ["가"], rows: [] }]);
});
