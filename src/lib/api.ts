import type { components } from "./api-types";

/** api 가 커밋한 openapi.json 에서 만든 요청·응답 모양(pnpm openapi:types). */
export type Schemas = components["schemas"];

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * whale-erp-api 주소. 모듈 로드 시점이 아니라 호출 시점에 읽는다. 빌드할 때는
 * 아직 값이 없을 수 있고(.env.production 은 비어 있다), 서버 컴포넌트는 요청마다
 * 실행되므로 배포 환경이 주입한 값이 그때 보인다.
 */
function baseUrl(): string {
  const url = process.env.API_BASE_URL;
  // 빈 값은 없는 것과 같다. 여기서 멈추지 않으면 fetch("undefined/...") 같은
  // 엉뚱한 에러로 번져 원인을 찾기 어려워진다.
  if (!url) throw new Error("API_BASE_URL 환경 변수가 필요합니다");
  return url;
}

export interface RequestOptions {
  method?: string;
  /** 본문. 있으면 JSON 으로 보낸다. */
  json?: unknown;
  /** 있으면 Authorization: Bearer 로 보낸다. */
  accessToken?: string;
  /** 모두에게 같은 응답(enum)만 초 단위로 캐시한다. 없으면 캐시하지 않는다. */
  revalidate?: number;
}

export async function request<T>(
  path: string,
  { method = "GET", json, accessToken, revalidate }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();
  if (json !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
    // 사용자마다 다른 응답이라 기본은 캐시하지 않는다. cache 와 revalidate 를 같이 주면
    // 둘 다 무시되므로 하나만 준다.
    ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
  });

  if (!response.ok)
    throw new ApiError(response.status, await errorMessage(response));

  // 204 는 본문이 없다. json() 을 부르면 파싱에서 터진다.
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

/** Nest 는 { statusCode, message, error } 를 주고, 검증 실패면 message 가 배열이다. */
async function errorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return `요청이 실패했습니다 (HTTP ${response.status})`;
}
