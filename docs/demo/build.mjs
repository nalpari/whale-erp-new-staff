// 직원 근무 앱 데모 HTML 과 assets/staff.css 를 만든다: node docs/demo/build.mjs
// src/pages/**/*.mjs 하나가 화면 하나다. 같은 경로의 .html 로 나간다(src/pages/login/index.mjs → login/index.html).
// 화면은 src/ui.mjs(직원 근무 앱 src/components/common 을 옮긴 것)로만 그린다. 동작은 assets/staff.js 한 파일이다.
// staff.css 는 앱과 같은 Tailwind 로 docs/demo 안을 훑어 만든다. 토큰·바탕·화면 이동 슬라이드는 src/app/globals.css 를 그대로 읽는다.
// 관리자 웹 데모(whale-erp-front docs/demo)와 같은 방식이다(docs/plans/2026-10-08-직원-근무-앱-데모.md).
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { demoStates, resetIds, setPaths, staffRoot, toast } from "./src/ui.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const pagesDir = join(here, "src/pages");

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n.endsWith(".mjs") ? [p] : [];
  });

const built = [];
for (const file of walk(pagesDir).sort()) {
  // relative() 는 윈도우에서 \ 로 나온다. 슬래시를 먼저 통일해야 깊이가 맞는다.
  const rel = relative(pagesDir, file).replaceAll("\\", "/").replace(/\.mjs$/, ".html");
  const R = "../".repeat(rel.split("/").length - 1); // 데모 루트까지
  const A = `${R}assets/`;
  resetIds();
  setPaths(A, R);
  const { title, states, html } = (await import(pathToFileURL(file).href)).default();
  const out = join(here, rel);
  built.push(out);
  mkdirSync(dirname(out), { recursive: true });
  // 데모 layout(옛 src/app/demo/layout.tsx): StaffRoot 안 가운데 휴대전화 폭(430px) 기둥. 기둥 밖은 데모 틀이라 한 단계 어둡게.
  const page = staffRoot(
    `<div class="min-h-[100dvh] bg-[#e4e8ef]"><div class="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-staff-bg">${html}</div></div>${states ? toast() + demoStates(states) : ""}`,
  );
  writeFileSync(
    out,
    `<!doctype html>
<html lang="ko" class="h-full antialiased">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} · 데모 · Whale ERP 직원 근무 앱</title>
<link rel="stylesheet" href="${A}staff.css?v=__V__">
<script src="${A}staff.js?v=__V__" defer></script>
</head>
<body class="min-h-full">
${page}
</body>
</html>
`,
  );
  console.log(rel);
}

// pnpm 은 postcss 를 최상위에 두지 않으므로 @tailwindcss/postcss 옆에서 찾는다.
const require = createRequire(realpathSync(join(root, "node_modules/@tailwindcss/postcss/package.json")));
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const globals = readFileSync(join(root, "src/app/globals.css"), "utf8");
if (!globals.includes("--color-staff-primary")) throw new Error("globals.css 에서 staff @theme 을 찾지 못했다");
const input = `@import "tailwindcss" source(none);
@source "./";
${globals.replace('@import "tailwindcss";', "")}
${readFileSync(join(here, "assets/base.css"), "utf8")}`;
const { css } = await postcss([tailwind()]).process(input, { from: join(here, "staff.input.css") });
writeFileSync(join(here, "assets/staff.css"), css);
console.log(`assets/staff.css ${(css.length / 1024).toFixed(1)}KB`);

// 자원 주소에 staff.js·staff.css 내용의 짧은 해시를 붙인다. 미니 nginx 가 캐시 헤더를 주지 않아 옛 자원을 새 HTML 과 함께 쓰면 화면이 깨진다.
const v = createHash("sha1").update(readFileSync(join(here, "assets/staff.js"))).update(css).digest("hex").slice(0, 8);
for (const out of built) writeFileSync(out, readFileSync(out, "utf8").replaceAll("__V__", v));
