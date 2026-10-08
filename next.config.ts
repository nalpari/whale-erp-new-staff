import type { NextConfig } from "next";

// DEMO_EXPORT=1 이면 미니(정적 nginx)에 올릴 정적 사이트를 out/ 으로 낸다(scripts/build-demo.mjs).
const isDemoExport = process.env.DEMO_EXPORT === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(isDemoExport && {
    output: "export",
    trailingSlash: true, // /demo/login → demo/login/index.html. nginx 가 디렉터리 index 로 찾는다
    images: { unoptimized: true },
  }),
};

export default nextConfig;
