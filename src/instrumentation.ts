import type { Instrumentation } from "next";

/**
 * 서버가 뜰 때 설정을 한 번 확인해, 잘못된 값이면 배포 직후 바로 멈추게 한다. 그러지 않으면 액세스 토큰이 살아 있는 동안은
 * 멀쩡해 보이다가 갱신이 필요한 14분 뒤에 proxy 가 모든 화면을 500 으로 막는다.
 * 빌드할 때는 아직 값이 없을 수 있어(.env.production 은 비어 있다) 서버가 뜰 때만 본다.
 */
export async function register() {
  // 이 파일은 Edge 런타임에서도 불린다. client-ip.ts 는 node:net 을 쓰므로 Node 에서만 불러온다.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const [{ baseUrl }, { trustedHops }] = await Promise.all([import("./lib/api"), import("./lib/client-ip")]);
  baseUrl();
  trustedHops();
}

/**
 * 서버에서 처리하지 못한 오류(서버 컴포넌트 · 서버 액션 · proxy)를 한곳에서 남긴다. 화면의 error.tsx 는 digest 만 보이므로
 * 같은 digest 로 이 로그를 찾는다. 오류 수집 서비스를 붙이면 여기서 보낸다.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  console.error("[request-error]", { digest, method: request.method, path: request.path, routeType: context.routeType }, error);
};
