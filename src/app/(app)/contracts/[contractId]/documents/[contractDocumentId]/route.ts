import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { ApiError, NetworkError, logUnexpected, request, type Schemas } from "@/lib/api";
import { parseId } from "@/lib/contract-rules";
import { withNext } from "@/lib/login-return";
import { EXPIRED_LOGIN_PATH, getSession } from "@/lib/session";

// 근로계약서 파일 받기(WHALEERP-146 — 종이 계약 날인본 · 임금계약서). api GET /me/contracts/:id/documents/:docId/download-url 이
// 주는 짧은(300초) 서명 주소로 보낸다 — 파일은 저장소가 원래 이름으로 attachment 로 내려준다. 토큰은 httpOnly 쿠키라 브라우저가
// api 를 바로 부를 수 없어 이 경로를 거친다(급여명세서 PDF 와 같다). 서명 주소는 응답에만 싣고 남기지 않는다.
// 링크는 같은 탭에서 열리므로, 실패를 글자 응답으로 주면 앱 화면이 그 글자로 덮인다. 실패하면 계약서 상세로 돌려보내고
// `?download=notfound|unavailable|failed` 로 상세가 안내를 띄운다(띄운 뒤 주소에서 지운다).

type Failure = "notfound" | "unavailable" | "failed";

export async function GET(req: NextRequest, ctx: RouteContext<"/contracts/[contractId]/documents/[contractDocumentId]">) {
  const params = await ctx.params;
  const contractId = parseId(params.contractId);
  const contractDocumentId = parseId(params.contractDocumentId);
  // 소속 근무지 목록에서 왔으면 상세의 뒤로 가기가 그 목록으로 가도록 ?store= 를 이어 준다
  const storeId = parseId(req.nextUrl.searchParams.get("store") ?? undefined);
  if (contractId === null) redirect("/contracts");
  const back = `/contracts/${contractId}${storeId === null ? "" : `?store=${storeId}`}`;
  const fail = (reason: Failure) => redirect(`${back}${back.includes("?") ? "&" : "?"}download=${reason}`);

  const session = await getSession();
  // 접속이 끝났으면 다시 로그인한 뒤 계약서 상세로 돌아온다(받기 주소로 돌아오면 빈 화면에 파일만 받는다)
  if (!session) redirect(withNext(EXPIRED_LOGIN_PATH, back));
  if (contractDocumentId === null) fail("notfound");

  let url: string;
  try {
    ({ url } = await request<Schemas["DownloadUrlResponseDto"]>(
      `/me/contracts/${contractId}/documents/${contractDocumentId}/download-url`,
      { accessToken: session.accessToken },
    ));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect(withNext(EXPIRED_LOGIN_PATH, back));
      if (error.status === 404) fail("notfound");
      // 처리 완료본은 체결이 끝난 계약에서만 받는다 — 그사이 상태가 바뀌었다
      if (error.status === 409) fail("unavailable");
      // 5xx 는 request() 가 남겼다
      if (error.status < 500) logUnexpected("contract-document", error);
      fail("failed");
    }
    // 연결 실패는 request() 가 남겼다.
    if (error instanceof NetworkError) fail("failed");
    throw error;
  }
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
