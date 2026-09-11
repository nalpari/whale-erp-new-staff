#!/usr/bin/env python3
"""직원 앱 목업 검사기.

    python3 docs/mockup/_check.py

목업은 회의에서 결정을 받아내려고 만든 것이라, 링크가 죽었거나 상태가
안 열리거나 쟁점 번호가 겹치면 그 자리에서 신뢰를 잃는다. 사람이 매번
눈으로 볼 수 없는 것만 기계가 본다.

검사 항목
  1. 태그      — 안 닫힌 태그, 닫힘 순서 어긋남
  2. 링크      — 내부 href 가 실제 파일을 가리키는가
  3. 클래스    — 쓴 클래스가 staff.css 에 있는가
  4. 상태      — data-when/data-unless 의 상태가 어딘가에서 열리는가
  5. 시트      — data-sheet 가 가리키는 data-sheet-id 가 있는가
  6. 자간      — 한글에 양수 letter-spacing 을 주지 않았는가
  7. 쟁점      — 번호가 겹치지 않는가, 상태 표시가 붙었는가
  8. 출처      — 명세 ID 가 실재하는 형식인가
  9. 스크롤    — 본문이 넘칠 때 잘리지 않고 스크롤되는가
"""

import html.parser
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

problems = []
notes = []


def bad(f, msg):
    problems.append(f"{f}: {msg}")


def note(f, msg):
    notes.append(f"{f}: {msg}")


# ── 1. 태그 ──────────────────────────────────────────────────────


class Tags(html.parser.HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name = name
        self.stack = []
        self.classes = set()
        self.hrefs = []
        self.states = set()       # data-when / data-unless 에 쓰인 상태
        self.opened = set()       # sw-b[data-state] 와 data-go 로 열리는 상태
        self.sheet_use = set()
        self.sheet_def = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)

        if "class" in a:
            for c in a["class"].split():
                self.classes.add(c)

        if tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])

        for key in ("data-when", "data-unless"):
            if key in a:
                self.states.update(a[key].split())

        if "data-state" in a:
            self.opened.add(a["data-state"])
        if "data-go" in a:
            self.opened.add(a["data-go"])

        if "data-sheet" in a:
            self.sheet_use.add(a["data-sheet"])
        if "data-sheet-id" in a:
            self.sheet_def.add(a["data-sheet-id"])

        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            깊이 = len(self.stack) - 1 - self.stack[::-1].index(tag)
            남은 = self.stack[깊이 + 1:]
            bad(self.name, f"</{tag}> 앞에 안 닫힌 태그 {남은}")
            del self.stack[깊이:]


# ── 검사 ────────────────────────────────────────────────────────


def main():
    css_path = ROOT / "assets" / "staff.css"
    if not css_path.exists():
        print("staff.css 가 없다.")
        return 1

    css = css_path.read_text(encoding="utf-8")
    known = set(re.findall(r"\.([a-zA-Z][\w-]*)", css))
    # 아이콘과 상태 클래스는 CSS 에 다 적히지 않는다
    known |= {"ph", "ph-fill", "ph-bold", "ph-duotone"}

    # 9. 스크롤 — 한때 .view 가 overflow:hidden 이라 긴 화면의 아래가 잘렸다
    본문 = re.search(r"^\.view \{(.*?)^\}", css, re.S | re.M)
    if not 본문 or "overflow-y: auto" not in 본문.group(1):
        bad("assets/staff.css", ".view 가 스크롤되지 않는다 — 긴 화면의 아래가 잘린다")

    pages = sorted(ROOT.glob("*.html")) + sorted((ROOT / "app").glob("*.html"))
    if not pages:
        print("검사할 화면이 없다.")
        return 1

    쟁점 = {}

    for page in pages:
        rel = str(page.relative_to(ROOT))
        text = page.read_text(encoding="utf-8")

        p = Tags(rel)
        p.feed(text)
        if p.stack:
            bad(rel, f"안 닫힌 태그 {p.stack}")

        # 2. 링크
        for href in p.hrefs:
            if href.startswith(("http", "#", "mailto:")):
                continue
            target = (page.parent / href.split("#")[0].split("?")[0]).resolve()
            if not target.exists():
                bad(rel, f"죽은 링크 → {href}")

        # 3. 클래스
        unknown = {
            c for c in p.classes
            if c not in known and not c.startswith(("ph-", "is-", "js-"))
        }
        if unknown:
            note(rel, f"staff.css 에 없는 클래스 {sorted(unknown)}")

        # 4. 상태
        열리지_않는 = p.states - p.opened
        if 열리지_않는:
            bad(rel, f"어디서도 열리지 않는 상태 {sorted(열리지_않는)}")

        # 5. 시트
        없는_시트 = p.sheet_use - p.sheet_def
        if 없는_시트:
            bad(rel, f"정의되지 않은 시트 {sorted(없는_시트)}")
        안_쓰는_시트 = p.sheet_def - p.sheet_use
        if 안_쓰는_시트:
            note(rel, f"열 방법이 없는 시트 {sorted(안_쓰는_시트)}")

        # 6. 자간
        for m in re.finditer(r"letter-spacing:\s*(0?\.\d+)em", text):
            bad(rel, f"한글에 양수 자간 {m.group(1)}em — 글자가 흩어진다")

        # 7. 쟁점
        # data-ref 가 붙은 블록은 다른 화면의 쟁점을 다시 실은 것이라 원본으로 세지 않는다
        for m in re.finditer(r'class="gap__no"([^>]*)>([A-Z]+-\d+)<', text):
            if "data-ref" in m.group(1):
                continue
            쟁점.setdefault(m.group(2), []).append(rel)

        블록 = text.count('class="gap ')  + text.count('class="gap"')
        상태 = text.count("gap__st--")
        if 블록 and 상태 < 블록:
            note(rel, f"쟁점 {블록}건 중 {블록 - 상태}건에 확정·미정 표시가 없다")

        # 8. 출처
        for m in re.finditer(r"\b([SRF])-([A-Z0-9]+)\b", text):
            if len(m.group(2)) != 6:
                bad(rel, f"명세 ID 형식이 이상하다 {m.group(0)}")

    for 번호, 파일들 in sorted(쟁점.items()):
        if len(파일들) > 1:
            bad("전체", f"쟁점 번호 {번호} 가 여러 곳에 있다 → {파일들}")

    # ── 보고 ────────────────────────────────────────────────────
    print(f"화면 {len(pages)}개 · 쟁점 {len(쟁점)}건")
    print()

    if problems:
        print(f"고쳐야 할 것 {len(problems)}건")
        for x in problems:
            print("  ✗", x)
        print()

    if notes:
        print(f"봐 둘 것 {len(notes)}건")
        for x in notes:
            print("  ·", x)
        print()

    if not problems:
        print("고쳐야 할 것 없음.")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
