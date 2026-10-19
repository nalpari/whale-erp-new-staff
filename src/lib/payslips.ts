import { ApiError, type Schemas } from "./api";
import { authedRequest } from "./session";

// 직원 근무 앱 급여명세서(api GET /me/payslips · /me/payslips/:id, WHALEERP-330). api 가 발송된 · 만든 지 3년 안의
// 내 명세서만 주므로 여기서 다시 거르지 않는다. 화면 규칙 · 문구(순수 함수)는 payslip-rules.ts 에 있다.

export type PayslipSummary = Schemas["MyPayslipSummaryDto"];
export type PayslipDetail = Schemas["MyPayslipDetailResponseDto"];
export type PayslipItem = Schemas["MyPayslipItemDto"];
export type PayslipLog = Schemas["MyPayslipLogDto"];

/** 로그인한 직원의 명세서 목록. 급여 기간이 늦은 것이 위(api 순서). */
export async function getPayslips(): Promise<PayslipSummary[]> {
  const { items } = await authedRequest<Schemas["MyPayslipListResponseDto"]>("/me/payslips");
  return items;
}

/** 명세서 한 장. 없거나 남의 것 · 발송 전 · 3년이 지났으면(api 404) null. */
export async function getPayslip(payslipId: number): Promise<PayslipDetail | null> {
  try {
    return await authedRequest<PayslipDetail>(`/me/payslips/${payslipId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
