import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { baseUrl } from "@/lib/api";
import { withNext } from "@/lib/login-return";
import { parsePayslipId, payslipDownloadFailure, payslipKeepQuery, type PayslipDownloadFailure } from "@/lib/payslip-rules";
import { EXPIRED_LOGIN_PATH, getSession } from "@/lib/session";

// PAY-2 「명세서 내보내기」 — api GET /me/payslips/:id/pdf 를 로그인한 직원의 토큰으로 불러 그대로 내려준다.
// 토큰은 httpOnly 쿠키라 브라우저가 api 를 바로 부를 수 없어 이 경로를 거친다. 주소에 점(.pdf)을 두지 않는다 — proxy 가 점이
// 있는 경로(정적 파일)를 건너뛰어 토큰 갱신이 안 된다. request() 는 JSON 만 읽어 PDF 는 fetch 로 직접 받는다.
// 링크는 같은 탭에서 열린다(계약서 파일 받기와 같다). 성공하면 첨부(attachment)라 화면은 그대로이고, 실패를 글자 응답으로 주면 화면이
// 그 글자로 덮이므로 명세서 상세로 돌려보내고 `?download=notfound|reviewing|failed` 로 상세가 안내를 띄운다. 설치형 앱은 이 이동을
// 가로채 직접 받고, 돌려보낸 상세(HTML)는 웹뷰에 연다.

/** PDF 를 만드는 데 한글 글꼴을 넣느라 상세보다 오래 걸릴 수 있다. */
const TIMEOUT_MS = 20_000;

export async function GET(req: NextRequest, ctx: RouteContext<"/pay/[payslipId]/pdf">) {
  const payslipId = parsePayslipId((await ctx.params).payslipId);
  if (payslipId === null) redirect("/pay");
  // 알림 · 소속 근무지에서 연 상세였으면 돌아가서도 뒤로 가기가 그 목록으로 가게 이어 준다
  const keep = payslipKeepQuery((name) => req.nextUrl.searchParams.get(name));
  const back = `/pay/${payslipId}${keep}`;
  const fail = (reason: PayslipDownloadFailure) => redirect(`${back}${keep ? "&" : "?"}download=${reason}`);
  const session = await getSession();
  // 접속이 끝났으면 다시 로그인한 뒤 명세서 상세로 돌아온다(내려받기 주소로 돌아오면 빈 화면에 파일만 받는다)
  if (!session) redirect(withNext(EXPIRED_LOGIN_PATH, back));

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/me/payslips/${payslipId}/pdf`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`[pay-pdf] ${payslipId} api 연결 실패`, error);
    return fail("failed");
  }
  if (response.status === 401) redirect(withNext(EXPIRED_LOGIN_PATH, back));
  // 404 · 409(상세를 연 사이 관리자가 확정을 취소해 검토 중) — 오류가 아니라 지금 내려받을 수 없는 것이다
  if (response.status === 404 || response.status === 409) fail(payslipDownloadFailure(response.status));
  if (!response.ok || !response.body) {
    console.error(`[pay-pdf] ${payslipId} api 응답 ${response.status}`);
    fail("failed");
  }

  // api 가 정한 파일 이름(Content-Disposition)을 그대로 넘긴다. 급여가 담긴 파일이라 캐시하지 않는다.
  const headers = new Headers({ "Content-Type": "application/pdf", "Cache-Control": "private, no-store" });
  for (const name of ["Content-Disposition", "Content-Length"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: 200, headers });
}
