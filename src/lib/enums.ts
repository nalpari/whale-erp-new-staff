import { request, type Schemas } from "./api";

export type EnumValue = Schemas["EnumValueDto"];

// enum 은 api 배포 때만 바뀐다. 한 시간씩 서버에 캐시하고, 배포 뒤 늦어도 한 시간이면 새 값을 본다.
// (응답의 version 을 비교해 바로 버리는 일은 enum 을 자주 쓰게 되면 더한다.)
const ENUM_REVALIDATE_SECONDS = 60 * 60;

export async function getEnum(name: string): Promise<EnumValue[]> {
  const { enums } = await request<Schemas["EnumCatalogResponseDto"]>(
    `/enums/${encodeURIComponent(name)}`,
    { revalidate: ENUM_REVALIDATE_SECONDS },
  );
  return [...(enums[name] ?? [])].sort((a, b) => a.order - b.order);
}

/** 목록에 없는 값은 값 그대로 보인다(api 가 새 값을 더했는데 캐시가 아직 옛것일 때). */
export function labelOf(values: EnumValue[], value: string): string {
  return values.find((v) => v.value === value)?.label ?? value;
}
