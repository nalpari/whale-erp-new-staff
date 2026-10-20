import { ApiError, NetworkError, request, type Schemas } from "./api";

export type CodeValue = Schemas["CodeValueDto"];

// 공통코드는 플랫폼 관리자가 운영 중에 고친다. enum(한 시간)보다 짧게 둔다.
const CODE_REVALIDATE_SECONDS = 10 * 60;

/** 플랫폼 공통코드 한 그룹(`GET /public-code-items?groups=`). 없거나 쓰지 않는 그룹은 빈 목록이다. */
export async function getCodes(group: string): Promise<CodeValue[]> {
  const { codes } = await request<Schemas["CodeItemsResponseDto"]>(
    `/public-code-items?groups=${encodeURIComponent(group)}`,
    { revalidate: CODE_REVALIDATE_SECONDS },
  );
  return [...(codes[group] ?? [])].sort((a, b) => a.order - b.order);
}

/** 이름만 필요한 화면용 — getEnumOrEmpty 와 같다. 5xx · 연결 실패면 빈 목록, 그 밖은 던진다. */
export async function getCodesOrEmpty(group: string): Promise<CodeValue[]> {
  try {
    return await getCodes(group);
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return [];
    throw error;
  }
}
