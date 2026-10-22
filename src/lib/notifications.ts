// 직원 알림함 · 수신 설정(WHALEERP-266 · 267 · 269)의 순수 계산 — 갈 곳 경로, 받은 시각, 수신 설정 묶음.
// node --test 가 직접 읽으므로 값 import 는 두지 않는다(타입 import 는 지워진다).
import type { Schemas } from "./api";

export type MyNotification = Schemas["MyNotificationItemDto"];
export type NotificationTarget = Schemas["StaffNotificationTargetDto"];
export type PreferenceCategory = Schemas["PreferenceCategory"];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** 알림을 눌러 열 경로. api 가 정한 갈 곳(무엇을 열지)을 이 앱의 경로로 바꾼다. 없으면 null — 「열 수 없습니다」 */
export function targetHref(target: NotificationTarget | null | undefined): string | null {
  if (!target) return null;
  if (target.type === "WORK_SCHEDULE")
    return target.workDate ? `/work?tab=schedule&month=${target.workDate.slice(0, 7)}&day=${target.workDate}` : null;
  if (target.type === "TODO") return "/work?tab=todo";
  if (target.type === "PAYSLIP") return target.payslipId ? `/pay/${target.payslipId}` : null;
  // 근로계약서(CONTRACT)는 직원 앱 계약 화면(#146)이 생기면 그 경로로 잇는다 — 지금은 「열 수 없습니다」
  return null;
}

const kstDay = (at: Date) => Math.floor((at.getTime() + KST_OFFSET_MS) / DAY_MS);
const kstTime = (at: Date) => new Date(at.getTime() + KST_OFFSET_MS).toISOString().slice(11, 16);

/** 알림 줄의 받은 시각(목업 notify.html) — 방금 · n분 전 · 오늘은 n시간 전 · 어제 HH:MM · n일 전. 날짜는 한국 날짜다 */
export function timeLabel(createdAt: string, now: Date): string {
  const at = new Date(createdAt);
  const minutes = Math.floor((now.getTime() - at.getTime()) / MINUTE_MS);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const days = kstDay(now) - kstDay(at);
  if (days <= 0) return `${Math.floor(minutes / 60)}시간 전`;
  if (days === 1) return `어제 ${kstTime(at)}`;
  return `${days}일 전`;
}

/** 수신 설정 묶음(api enum 순서)과 화면 글자 — 목업 「알림 설정」. 네 묶음 모두 끌 수 있다(NOTI-8) */
export const PREFERENCE_ITEMS: { category: PreferenceCategory; title: string; description: string }[] = [
  { category: "CONTRACT", title: "근로계약서 발송", description: "근로계약서가 도착하면 알립니다" },
  { category: "SCHEDULE", title: "근무스케줄 변경", description: "근무 시간이나 근무일이 바뀌면 알립니다" },
  { category: "TODO", title: "TO-DO 수행 임박", description: "수행 예정 일시가 다가오면 알립니다" },
  { category: "PAYSLIP", title: "급여명세서 발송", description: "급여명세서가 발송되면 알립니다" },
];

export const isPreferenceCategory = (value: unknown): value is PreferenceCategory =>
  PREFERENCE_ITEMS.some((i) => i.category === value);
