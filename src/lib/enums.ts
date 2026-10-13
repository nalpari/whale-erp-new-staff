import { ApiError, NetworkError, request, type Schemas } from "./api";

export type EnumValue = Schemas["EnumValueDto"];

// enum 은 api 배포 때만 바뀐다. 한 시간씩 서버에 캐시하고, 배포 뒤 늦어도 한 시간이면 새 값을 본다.
// (응답의 version 을 비교해 바로 버리는 일은 enum 을 자주 쓰게 되면 더한다.)
const ENUM_REVALIDATE_SECONDS = 60 * 60;

export async function getEnum(name: string): Promise<EnumValue[]> {
  const { enums } = await request<Schemas["EnumCatalogResponseDto"]>(
    `/enums/${encodeURIComponent(name)}`,
    { revalidate: ENUM_REVALIDATE_SECONDS },
  );
  const values = enums[name];
  // 200 인데 그 이름이 없으면 api 응답 모양이 바뀐 것이다. 빈 목록으로 숨기지 않는다.
  if (!values) throw new Error(`enum ${name} 이 응답에 없습니다`);
  return [...values].sort((a, b) => a.order - b.order);
}

/**
 * 한글 이름만 필요한 화면용. api 가 잠시 실패하면(5xx · 연결 실패) 빈 목록을 주어 labelOf 가 값 그대로 보이게 하고,
 * 화면 전체를 오류로 만들지 않는다. 이름 오타(404)나 그 밖의 결함은 숨기지 않고 던진다.
 */
export async function getEnumOrEmpty(name: string): Promise<EnumValue[]> {
  try {
    return await getEnum(name);
  } catch (error) {
    // 5xx · 연결 실패는 request() 가 이미 남겼다.
    if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return [];
    throw error;
  }
}

/** 목록에 없는 값은 값 그대로 보인다(api 가 새 값을 더했는데 캐시가 아직 옛것일 때). */
export function labelOf(values: EnumValue[], value: string): string {
  return values.find((v) => v.value === value)?.label ?? value;
}
