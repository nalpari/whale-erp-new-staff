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
    // 데모 정적 내보내기(scripts/build-demo.mjs) 결과물.
    "docs/demo/**",
  ]),
]);

export default eslintConfig;
