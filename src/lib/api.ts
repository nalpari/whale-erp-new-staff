import type { ApiFailure } from "./action-errors";
import type { components } from "./api-types";
import type { ClientIp } from "./client-ip";

/** api 가 커밋한 openapi.json 에서 만든 요청·응답 모양(pnpm openapi:types). */
export type Schemas = components["schemas"];

/**
 * api 가 2xx 가 아닌 응답을 줬다. message 는 Nest 의 message(배열이면 이어 붙임)나 대체 문구다.
 * body 는 JSON 본문 그대로다(JSON 이 아니면 null). 메시지 밖의 칸(이메일 찾기 429 의 lockExpiresAt 등)을 읽을 때 쓴다.
 */
export class ApiError extends Error {
  override name = "ApiError";
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = null,
  ) {
    super(message);
  }
}

/**
 * api 에 닿지 못했거나 제때 답을 받지 못했다(연결 거부 · DNS · 시간 초과). fetch 가 던지는 TypeError 를 그대로 두면 코드 결함의 TypeError
 * (undefined 의 속성 읽기 등)와 구별되지 않아, 버그까지 「서버에 연결하지 못했습니다」로 숨는다. 그래서 fetch 한 줄에서만
 * 이 오류로 바꾸고, 호출하는 쪽은 TypeError 가 아니라 이것으로 가른다.
 */
export class NetworkError extends Error {
  override name = "NetworkError";
}

/** 응답을 기다리는 기본 시간. api 가 연결만 받고 멈추면 fetch 는 몇 분을 기다려 화면 전체가 멈춘다. */
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * whale-erp-api 주소. 모듈 로드 시점이 아니라 호출 시점에 읽는다. 빌드할 때는
 * 아직 값이 없을 수 있고(.env.production 은 비어 있다), 서버 컴포넌트는 요청마다
 * 실행되므로 배포 환경이 주입한 값이 그때 보인다.
 */
export function baseUrl(): string {
  const url = process.env.API_BASE_URL;
  // 빈 값이나 scheme 이 빠진 값(api.example.com)은 설정 오류다. 여기서 멈추지 않으면 fetch 의 TypeError 로 번져
  // 연결 실패처럼 보인다.
  if (!url) throw new Error("API_BASE_URL 환경 변수가 필요합니다");
  if (!URL.canParse(url)) throw new Error(`API_BASE_URL 이 올바른 주소가 아닙니다: ${url}`);
  return url;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** 본문. 있으면 JSON 으로 보낸다. */
  json?: unknown;
  /** 있으면 Authorization: Bearer 로 보낸다. */
  accessToken?: string;
  /** 모두에게 같은 응답(enum)만 초 단위로 캐시한다. 없으면 캐시하지 않는다. */
  revalidate?: number;
  /** 응답(본문까지)을 기다리는 시간(ms). 넘으면 NetworkError. */
  timeoutMs?: number;
  /**
   * 직원의 실제 접속 IP(client-ip.ts). 있으면 X-Forwarded-For 로 보내 api 가 요청 제한을 사람마다 센다.
   * 서버 쪽 fetch 는 이 헤더를 붙이지 않으므로 직접 넣는다. 들어온 헤더를 그대로 넘기지 않는다(지어낼 수 있다).
   */
  clientIp?: ClientIp;
}

export async function request<T>(
  path: string,
  { method = "GET", json, accessToken, revalidate, timeoutMs = DEFAULT_TIMEOUT_MS, clientIp }: RequestOptions = {},
): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const headers = new Headers();
  if (json !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (clientIp) headers.set("X-Forwarded-For", clientIp);
  // 본문 직렬화는 try 밖이다. 여기서 나는 TypeError(순환 참조 등)는 코드 결함이라 연결 실패로 바꾸지 않는다.
  const body = json === undefined ? undefined : JSON.stringify(json);
  // 시간 제한은 본문을 다 읽을 때까지 걸린다. 헤더만 오고 본문에서 멈춰도 같은 NetworkError 가 된다.
  const signal = AbortSignal.timeout(timeoutMs);
  const fail = (error: unknown): never => {
    // fetch 의 연결 실패는 TypeError, 시간 초과는 DOMException(TimeoutError)이다. 그 밖은 그대로 던진다.
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    if (!(error instanceof TypeError) && !timedOut) throw error;
    console.error(`[api] ${method} ${path} ${timedOut ? `${timeoutMs}ms 시간 초과` : "연결 실패"}`, error);
    throw new NetworkError(timedOut ? "api 응답 시간 초과" : "api 연결 실패", { cause: error });
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      signal,
      // 사용자마다 다른 응답이라 기본은 캐시하지 않는다. cache 와 revalidate 를 같이 주면
      // 둘 다 무시되므로 하나만 준다.
      ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
    });
  } catch (error) {
    return fail(error);
  }

  if (!response.ok) {
    const body = await errorBody(response, fail);
    const error = new ApiError(response.status, errorMessage(response.status, body), body);
    // 4xx 는 대개 사용자 입력이라 부른 쪽이 화면 문구로 바꾼다. 5xx 는 api 쪽 문제라 여기서 남긴다.
    if (response.status >= 500) console.error(`[api] ${method} ${path} ${response.status}`, error.message);
    throw error;
  }

  // 204 는 본문이 없다. json() 을 부르면 파싱에서 터진다.
  if (response.status === 204) return undefined as T;
  // 본문을 읽다 시간이 넘으면 NetworkError, 연결이 끊겨도 같다. JSON 이 아니면(SyntaxError) 결함이라 그대로 던진다.
  return (await response.json().catch(fail)) as T;
}

/**
 * 오류 응답의 JSON 본문. 본문을 읽다 시간이 넘거나 끊기면 fail 로 NetworkError 가 된다. JSON 이 아닌 본문(게이트웨이 HTML 등)은
 * null 로 바꾸고 남긴다.
 */
async function errorBody(response: Response, fail: (error: unknown) => never): Promise<unknown> {
  return response.json().catch((error: unknown) => {
    if (error instanceof SyntaxError) {
      console.warn(`[api] ${response.status} 응답 본문이 JSON 이 아닙니다`);
      return null;
    }
    return fail(error);
  });
}

/** Nest 는 { statusCode, message, error } 를 주고, 검증 실패면 message 가 배열이다. 없으면 대체 문구. */
function errorMessage(status: number, body: unknown): string {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return `요청이 실패했습니다 (HTTP ${status})`;
}

/** 부른 쪽이 예상하지 못한 api 오류를 남긴다. 화면에는 일반 문구를 보이고 원문은 여기에만 둔다. */
export function logUnexpected(scope: string, error: ApiError): void {
  console.error(`[${scope}] 예상하지 못한 api 응답 ${error.status}`, error.message);
}

/**
 * 서버 액션의 catch 에서 api 실패를 순수 함수가 다루는 모양(ApiFailure)으로 바꾼다. ApiError · NetworkError 가 아니면 null —
 * 부른 쪽이 그대로 다시 던진다(401 의 만료 안내 redirect 같은 Next 내부 오류와 코드 결함).
 */
export function failureOf(error: unknown): ApiFailure | null {
  if (error instanceof ApiError) {
    const code = (error.body as { code?: unknown } | null)?.code;
    return typeof code === "string" ? { status: error.status, message: error.message, code } : { status: error.status, message: error.message };
  }
  if (error instanceof NetworkError) return "network";
  return null;
}

/** 순수 함수가 「남겨라」고 한 예상 밖 응답을 남긴다. 연결 실패는 request() 가 이미 남겼다. */
export function logFailure(scope: string, failure: ApiFailure): void {
  if (failure !== "network")
    console.error(`[${scope}] 예상하지 못한 api 응답 ${failure.status}${failure.code ? ` ${failure.code}` : ""}`, failure.message);
}
