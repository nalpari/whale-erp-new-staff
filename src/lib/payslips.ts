import { ApiError, type Schemas } from "./api";
import { authedRequest } from "./session";

// 직원 근무 앱 급여명세서(api GET /me/payslips · /me/payslips/:id, WHALEERP-330). api 가 발송된 · 만든 지 3년 안의
// 내 명세서만 주므로 여기서 다시 거르지 않는다. 화면 규칙 · 문구(순수 함수)는 payslip-rules.ts 에 있다.

export type PayslipSummary = Schemas["MyPayslipSummaryDto"];
export type PayslipDetail = Schemas["MyPayslipDetailResponseDto"];
export type PayslipItem = Schemas["MyPayslipItemDto"];
export type PayslipLog = Schemas["MyPayslipLogDto"];

export type PayslipList = Schemas["MyPayslipListResponseDto"];

/**
 * 로그인한 직원의 명세서 목록(PAY-8 · 9 · 10). 점포 · 연도(급여 기간)는 items 만 거른다 — 맨 위 이번 달 합계(thisMonth)와
 * 점포 목록(stores)은 api 가 필터 전 전체로 센 값이라 앱은 다시 더하지 않는다. items 는 받은 날 최신순(api 순서).
 */
export async function getPayslips(filter: { storeId?: number; year?: number } = {}): Promise<PayslipList> {
  const query = new URLSearchParams();
  if (filter.storeId !== undefined) query.set("storeId", String(filter.storeId));
  if (filter.year !== undefined) query.set("year", String(filter.year));
  const qs = query.toString();
  return authedRequest<PayslipList>(`/me/payslips${qs ? `?${qs}` : ""}`);
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
