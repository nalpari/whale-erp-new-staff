"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { ApiError, failureOf, logFailure } from "@/lib/api";
import { registerProblemOf, type AttendanceKind, type RegisterProblem, type ReviewReason } from "@/lib/attendance-rules";
import { clientIpFrom } from "@/lib/client-ip";
import type { AttendanceRecordResult } from "@/lib/my-attendance";
import { authedRequest } from "@/lib/session";

export type RegisterResult = { ok: true; record: AttendanceRecordResult } | { ok: false; problem: RegisterProblem };

const REASONS: Record<AttendanceKind, readonly ReviewReason[]> = {
  CHECK_IN: ["OUT_OF_RADIUS_CHECKIN"],
  CHECK_OUT: ["OUT_OF_RADIUS_CHECKOUT", "MOCK_LOCATION"],
};

/**
 * 출근 · 퇴근 등록(WHALEERP-211 · 212). 좌표는 받지도 보내지도 않는다 — 앱이 판정한 확인 필요 사유만 보낸다(ATT-05).
 * 성공하거나 화면이 낡았으면(409 · 404 · 403) 화면을 다시 받는다. 결과를 모르는 실패(연결 끊김 · 5xx)도 다시 받는다 — 이미
 * 기록됐을 수 있어 화면이 열린 출근을 보고 맞춘다.
 */
export async function registerAttendanceAction(kind: AttendanceKind, staffMemberId: number, reviewReason: ReviewReason | null): Promise<RegisterResult> {
  // 서버 액션은 누구나 직접 부를 수 있어 값을 다시 거른다.
  if (kind !== "CHECK_IN" && kind !== "CHECK_OUT") return { ok: false, problem: { kind: "error", message: "잘못된 요청입니다", log: false } };
  if (!Number.isSafeInteger(staffMemberId) || staffMemberId < 1 || (reviewReason !== null && !REASONS[kind].includes(reviewReason)))
    return { ok: false, problem: { kind: "error", message: "잘못된 요청입니다", log: false } };
  try {
    const record = await authedRequest<AttendanceRecordResult>(`/me/attendance/${kind === "CHECK_IN" ? "check-in" : "check-out"}`, {
      method: "POST",
      json: reviewReason ? { staffMemberId, reviewReason } : { staffMemberId },
      clientIp: clientIpFrom(await headers()),
    });
    refresh();
    return { ok: true, record };
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    const problem = registerProblemOf(failure, error instanceof ApiError ? error.body : null);
    if (problem.kind === "error" && problem.log) logFailure(`attendance:${kind}`, failure);
    refresh();
    return { ok: false, problem };
  }
}
