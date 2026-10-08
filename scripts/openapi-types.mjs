// whale-erp-api 가 커밋한 openapi.json 으로 요청·응답 타입을 만든다: pnpm openapi:types
// api 저장소 위치는 WHALE_API_DIR(기본 ../whale-erp-api). 워크트리에서는 이 값을 넘긴다.
// 셸 확장(${VAR:-기본값})을 쓰지 않는 것은 Windows cmd 에서도 돌게 하려는 것이다.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const apiDir = process.env.WHALE_API_DIR ?? "../whale-erp-api";
const spec = join(apiDir, "openapi", "openapi.json");
if (!existsSync(spec)) {
  console.error(`${spec} 가 없습니다. WHALE_API_DIR 로 whale-erp-api 위치를 알려 주세요`);
  process.exit(1);
}
execFileSync("pnpm", ["exec", "openapi-typescript", spec, "-o", "src/lib/api-types.d.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
