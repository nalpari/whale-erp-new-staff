import { ApiError, type Schemas } from "./api";
import { authedRequest } from "./session";

// 직원 근무 앱 근로계약서(api GET /me/contracts · /me/contracts/:contractId, WHALEERP-146). api 가 서명 대기 이후의 내 계약만
// 준다(임시저장 · 발송 대기 제외). 화면 규칙 · 문구(순수 함수)는 contract-rules.ts 에 있다.

export type ContractListItem = Schemas["MyContractListItemDto"];
export type ContractDetail = Schemas["MyContractDetailDto"];
export type ContractDocument = Schemas["MyContractDocumentDto"];
/** 계약서 조항 하나 — api 조항 템플릿(WHALEERP-131). 보낸 원본 · 처리 완료본 PDF 와 같은 문장이다 */
export type ContractArticle = Schemas["ContractArticleDto"];
export type ContractBlock = Schemas["ContractBlockDto"];
export type ContractStatus = Schemas["ContractStatus"];

/** 내 근로계약 목록. 날인을 기다리는 계약(기한이 급한 순)이 먼저, 그다음 최근 것부터(api 순서). 점포로 거르는 칸은 api 에 없다. */
export async function getContracts(): Promise<ContractListItem[]> {
  return (await authedRequest<Schemas["MyContractListResponseDto"]>("/me/contracts")).items;
}

/** 계약 한 장. 없거나 남의 계약이면(api 404) null. */
export async function getContract(contractId: number): Promise<ContractDetail | null> {
  try {
    return await authedRequest<ContractDetail>(`/me/contracts/${contractId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
