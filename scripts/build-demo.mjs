// 미니(nginx 정적 서버 8081)에 올릴 데모를 만든다: node scripts/build-demo.mjs
// DEMO_EXPORT=1 next build 가 정적 사이트를 out/ 에 내고(next.config.ts), 그것을 docs/demo/ 로 옮겨 커밋한다.
// 미니 nginx 는 /demo/ · /_next/ · /icons/ 를 docs/demo/ 아래로 잇는다(docs/plans/2026-10-08-직원-근무-앱-데모.md).
// 빌드하는 동안에는 실제 앱(로그인한 직원 화면 · proxy)을 .demo-aside/ 로 잠시 치운다.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";

// 정적 내보내기는 proxy · 서버 액션 · 쿠키를 쓰는 라우트가 있으면 깨진다. 끝나면(실패해도) 되돌린다.
const ASIDE = ".demo-aside";
const REAL_APP = ["src/proxy.ts", "src/app/(auth)", "src/app/(app)"];
// pnpm dev · next typegen 이 만든 라우트 타입. 치운 실제 앱을 가리켜 빌드의 타입 검사가 깨지므로(tsconfig 가 include 한다)
// 빌드 전에 지운다. 언제든 다시 생기는 파일이라 되돌리지 않는다 — 빌드 중 dev 서버가 다시 만들면 되돌릴 자리가 막힌다.
const GENERATED_ROUTE_TYPES = ".next/dev/types";
const asidePath = (path) => `${ASIDE}/${path.replaceAll("/", "__")}`;

// 지난 실행이 되돌리지 못하고 끝났으면 치운 앱이 아직 거기 있다. 덮어쓰면 고치던 내용을 잃으니 멈춘다.
if (existsSync(ASIDE) && readdirSync(ASIDE).length > 0) {
  console.error(`${ASIDE}/ 에 지난 빌드가 치운 파일이 남아 있습니다. 제자리로 옮긴 뒤 다시 실행하세요`);
  process.exit(1);
}
mkdirSync(ASIDE, { recursive: true });
// Ctrl-C 를 받아도 이 프로세스는 남아 finally 에서 되돌린다(next build 자식만 끝나고 execFileSync 가 던진다).
process.on("SIGINT", () => {});
rmSync(GENERATED_ROUTE_TYPES, { recursive: true, force: true });
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
