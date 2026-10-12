import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored agent skills — third-party sources, not ours to lint.
    ".agents/**",
    ".claude/skills/**",
    // 직원 근무 앱 데모 정적 HTML 생성기와 그 결과물(node docs/demo/build.mjs). 앱 코드가 아니다.
    "docs/demo/**",
  ]),
]);

export default eslintConfig;
