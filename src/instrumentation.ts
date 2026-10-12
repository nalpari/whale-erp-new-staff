import type { Instrumentation } from "next";

/**
 * 서버에서 처리하지 못한 오류(서버 컴포넌트 · 서버 액션 · proxy)를 한곳에서 남긴다. 화면의 error.tsx 는 digest 만 보이므로
 * 같은 digest 로 이 로그를 찾는다. 오류 수집 서비스를 붙이면 여기서 보낸다.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  console.error("[request-error]", { digest, method: request.method, path: request.path, routeType: context.routeType }, error);
};
