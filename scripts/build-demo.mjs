// 미니(nginx 정적 서버 8081)에 올릴 데모를 만든다: node scripts/build-demo.mjs
// DEMO_EXPORT=1 next build 가 정적 사이트를 out/ 에 내고(next.config.ts), 그것을 docs/demo/ 로 옮겨 커밋한다.
// 미니 nginx 는 /demo/ · /_next/ · /icons/ 를 docs/demo/ 아래로 잇는다(docs/plans/2026-10-08-직원-근무-앱-데모.md).
// 빌드하는 동안에는 실제 앱(로그인한 직원 화면 · proxy)을 .demo-aside/ 로 잠시 치운다.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";

// 정적 내보내기는 proxy · 서버 액션 · 쿠키를 쓰는 라우트가 있으면 깨진다. 끝나면(실패해도) 되돌린다.
const ASIDE = ".demo-aside";
// .next/dev/types 는 pnpm dev · next typegen 이 만든 라우트 타입이다. 치운 실제 앱을 가리켜 빌드의 타입 검사가
// 깨지므로 함께 치운다(tsconfig 가 include 한다).
const REAL_APP = ["src/proxy.ts", "src/app/(auth)", "src/app/(app)", ".next/dev/types"];
const asidePath = (path) => `${ASIDE}/${path.replaceAll("/", "__")}`;

mkdirSync(ASIDE, { recursive: true });
for (const path of REAL_APP) if (existsSync(path)) renameSync(path, asidePath(path));
try {
  execFileSync("corepack", ["pnpm", "exec", "next", "build"], {
    stdio: "inherit",
    env: { ...process.env, DEMO_EXPORT: "1" },
  });
} finally {
  for (const path of REAL_APP) if (existsSync(asidePath(path))) renameSync(asidePath(path), path);
}
rmSync("docs/demo", { recursive: true, force: true });
cpSync("out", "docs/demo", { recursive: true });
console.log("docs/demo 에 데모를 냈습니다");
