import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ApiError, NetworkError, request, type Schemas } from "@/lib/api";
import { parseId } from "@/lib/contract-rules";
import { withNext } from "@/lib/login-return";
import { EXPIRED_LOGIN_PATH, getSession } from "@/lib/session";

// 근로계약서 파일 받기(WHALEERP-146 — 종이 계약 날인본 · 임금계약서). api GET /me/contracts/:id/documents/:docId/download-url 이
// 주는 짧은(300초) 서명 주소로 보낸다 — 파일은 저장소가 원래 이름으로 내려준다. 토큰은 httpOnly 쿠키라 브라우저가 api 를 바로
// 부를 수 없어 이 경로를 거친다(급여명세서 PDF 와 같다). 서명 주소는 응답에만 싣고 남기지 않는다.

const text = (body: string, status: number) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(_request: Request, ctx: RouteContext<"/contracts/[contractId]/documents/[contractDocumentId]">) {
  const params = await ctx.params;
  const contractId = parseId(params.contractId);
  const contractDocumentId = parseId(params.contractDocumentId);
  const back = `/contracts/${params.contractId}`;
  const session = await getSession();
  // 접속이 끝났으면 다시 로그인한 뒤 계약서 상세로 돌아온다(받기 주소로 돌아오면 빈 화면에 파일만 받는다)
  if (!session) redirect(withNext(EXPIRED_LOGIN_PATH, back));
  if (contractId === null || contractDocumentId === null) return text("파일을 찾을 수 없습니다.", 404);

  let url: string;
  try {
    ({ url } = await request<Schemas["DownloadUrlResponseDto"]>(
      `/me/contracts/${contractId}/documents/${contractDocumentId}/download-url`,
      { accessToken: session.accessToken },
    ));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect(withNext(EXPIRED_LOGIN_PATH, back));
      if (error.status === 404) return text("파일을 찾을 수 없습니다. 계약서 화면에서 다시 열어 주세요.", 404);
      // 처리 완료본은 체결이 끝난 계약에서만 받는다 — 그사이 상태가 바뀌었다
      if (error.status === 409) return text("지금은 이 파일을 받을 수 없습니다. 계약서 화면에서 다시 확인해 주세요.", 409);
      if (error.status < 500) console.error(`[contract-document] ${contractId}/${contractDocumentId} api 응답 ${error.status}`, error.message);
      return text("파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.", 502);
    }
    // 연결 실패는 request() 가 남겼다.
    if (error instanceof NetworkError) return text("파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.", 502);
    throw error;
  }
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
