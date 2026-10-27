import { ApiError, NetworkError, type Schemas } from "./api";
import { authedRequest } from "./session";

export type MyAttendance = Schemas["MyAttendanceResponseDto"];
export type AttendanceRecordResult = Schemas["AttendanceRecordResultDto"];

/**
 * 출퇴근 화면(`GET /me/attendance`, WHALEERP-210). 고른 근무지의 좌표 · 반경, 동의 상태, 출근을 막는 까닭, 열린 출근, 오늘
 * 근무스케줄. api 가 잠시 실패하면(5xx · 연결 실패) null 이라 화면이 「불러오지 못했다」로 보인다. 404 도 null — 소속 목록을 받은
 * 뒤 그사이 퇴직 처리된 경우라 다시 열면 맞는다. 그 밖(400 등 결함)은 던진다.
 */
export async function getMyAttendance(staffMemberId: number): Promise<MyAttendance | null> {
  try {
    return await authedRequest<MyAttendance>(`/me/attendance?staffMemberId=${staffMemberId}`);
  } catch (error) {
    if (error instanceof NetworkError || (error instanceof ApiError && (error.status >= 500 || error.status === 404))) return null;
    throw error;
  }
}

export type MyAttendanceRecords = Schemas["MyAttendanceRecordsResponseDto"];

/**
 * 출퇴근 현황(`GET /me/attendance/records`, WHALEERP-221 · 222) — 고른 소속의 기간 기록. 근무스케줄이나 기록이 있는 날만 온다.
 * 실패 처리는 getMyAttendance 와 같다 — 5xx · 연결 실패 · 404(그사이 퇴직)는 null.
 */
export async function getMyAttendanceRecords(staffMemberId: number, from: string, to: string): Promise<MyAttendanceRecords | null> {
  try {
    return await authedRequest<MyAttendanceRecords>(`/me/attendance/records?staffMemberId=${staffMemberId}&from=${from}&to=${to}`);
  } catch (error) {
    if (error instanceof NetworkError || (error instanceof ApiError && (error.status >= 500 || error.status === 404))) return null;
    throw error;
  }
}
