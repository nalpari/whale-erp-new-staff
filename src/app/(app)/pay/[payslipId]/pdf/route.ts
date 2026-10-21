import { redirect } from "next/navigation";
import { baseUrl } from "@/lib/api";
import { withNext } from "@/lib/login-return";
import { parsePayslipId } from "@/lib/payslip-rules";
import { EXPIRED_LOGIN_PATH, getSession } from "@/lib/session";

// PAY-2 「명세서 내보내기」 — api GET /me/payslips/:id/pdf 를 로그인한 직원의 토큰으로 불러 그대로 내려준다.
// 토큰은 httpOnly 쿠키라 브라우저가 api 를 바로 부를 수 없어 이 경로를 거친다. 주소에 점(.pdf)을 두지 않는다 — proxy 가 점이
// 있는 경로(정적 파일)를 건너뛰어 토큰 갱신이 안 된다. request() 는 JSON 만 읽어 PDF 는 fetch 로 직접 받는다.

/** PDF 를 만드는 데 한글 글꼴을 넣느라 상세보다 오래 걸릴 수 있다. */
const TIMEOUT_MS = 20_000;

const text = (body: string, status: number) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function GET(_request: Request, ctx: RouteContext<"/pay/[payslipId]/pdf">) {
  const raw = (await ctx.params).payslipId;
  const payslipId = parsePayslipId(raw);
  const back = `/pay/${raw}`;
  const session = await getSession();
  // 접속이 끝났으면 다시 로그인한 뒤 명세서 상세로 돌아온다(내려받기 주소로 돌아오면 빈 화면에 파일만 받는다)
  if (!session) redirect(withNext(EXPIRED_LOGIN_PATH, back));
  if (payslipId === null) return text("급여명세서를 찾을 수 없습니다.", 404);

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/me/payslips/${payslipId}/pdf`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`[pay-pdf] ${payslipId} api 연결 실패`, error);
    return text("명세서를 내려받지 못했습니다. 잠시 뒤 다시 시도해 주세요.", 502);
  }
  if (response.status === 401) redirect(withNext(EXPIRED_LOGIN_PATH, back));
  if (response.status === 404) return text("급여명세서를 찾을 수 없습니다.", 404);
  // 상세를 연 사이 관리자가 확정을 취소했다(정정 중) — 오류가 아니라 다시 받을 때까지 내려받을 수 없는 것이다
  if (response.status === 409) return text("관리자가 명세서를 정정하고 있습니다. 다시 받은 뒤에 내려받을 수 있습니다.", 409);
  if (!response.ok || !response.body) {
    console.error(`[pay-pdf] ${payslipId} api 응답 ${response.status}`);
    return text("명세서를 내려받지 못했습니다. 잠시 뒤 다시 시도해 주세요.", 502);
  }

  // api 가 정한 파일 이름(Content-Disposition)을 그대로 넘긴다. 급여가 담긴 파일이라 캐시하지 않는다.
  const headers = new Headers({ "Content-Type": "application/pdf", "Cache-Control": "private, no-store" });
  for (const name of ["Content-Disposition", "Content-Length"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: 200, headers });
}
