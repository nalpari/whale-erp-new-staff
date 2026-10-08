// 미니(nginx 정적 서버 8081)에 올릴 데모를 만든다: node scripts/build-demo.mjs
// DEMO_EXPORT=1 next build 가 정적 사이트를 out/ 에 내고(next.config.ts), 그것을 docs/demo/ 로 옮겨 커밋한다.
// 미니 nginx 는 /demo/ · /_next/ · /icons/ 를 docs/demo/ 아래로 잇는다(docs/plans/2026-10-08-직원-근무-앱-데모.md).
import { execFileSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";

execFileSync("corepack", ["pnpm", "exec", "next", "build"], {
  stdio: "inherit",
  env: { ...process.env, DEMO_EXPORT: "1" },
});
rmSync("docs/demo", { recursive: true, force: true });
cpSync("out", "docs/demo", { recursive: true });
console.log("docs/demo 에 데모를 냈습니다");
