// 소속 근무지 맨 위 「확인을 기다리는 요청」(ME-8, 2026-10-28 김민식 · 재영, 운영 정책 JOI-09)의 순수 계산. 가입한 사람이 받은 세 종류 —
// 가입 전에 받은 가입 초대(WHALEERP-604, `GET /me/invitations`) · 소속 추가 확인 · 복귀 확인(WHALEERP-144, `GET /me/affiliation-requests`) — 를
// 한 줄 모양으로 맞춰 받은 때 최신순으로 섞는다. node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import type { Schemas } from "./api";

export interface PendingRequestRow {
  key: string;
  /** 누르면 가는 그 요청의 확인 화면 */
  href: string;
  storeName: string;
  /** 초대 종류 배지 */
  kind: string;
  /** 고용 형태 한글 */
  employment: string;
  sentAt: string;
  expiresAt: string;
}

/**
 * 두 목록을 받은 때(sentAt) 최신순 한 목록으로. 시각이 같으면 가입 초대를 앞에 둔다(어느 쪽이든 순서만 정해지면 된다).
 * employmentLabel 은 가입 초대의 고용 형태 한글(enum), 소속 추가 확인은 api 가 준 한글(employmentTypeLabel)을 쓴다.
 * kindOf 는 소속 추가 확인 · 복귀 확인 배지 글자(affiliation-requests.ts 의 invitationTypeLabel).
 */
export function pendingRequestRows(
  invitations: readonly Schemas["MyInvitationDto"][],
  affiliations: readonly Schemas["AffiliationRequestDto"][],
  employmentLabel: (value: Schemas["MyInvitationDto"]["employmentType"]) => string,
  kindOf: (request: Schemas["AffiliationRequestDto"]) => string,
): PendingRequestRow[] {
  const rows: PendingRequestRow[] = [
    ...invitations.map((i) => ({
      key: `invitation-${i.invitationId}`,
      href: `/me/invitations/${i.invitationId}`,
      storeName: i.storeName,
      kind: "가입 초대",
      employment: employmentLabel(i.employmentType),
      sentAt: i.sentAt,
      expiresAt: i.expiresAt,
    })),
    ...affiliations.map((a) => ({
      key: `affiliation-${a.invitationId}`,
      href: `/affiliations?id=${a.invitationId}`,
      storeName: a.storeName,
      kind: kindOf(a),
      employment: a.employmentTypeLabel ?? employmentLabel(a.employmentType),
      sentAt: a.sentAt,
      expiresAt: a.expiresAt,
    })),
  ];
  // 시각 문자열의 소수 자릿수가 달라도 맞게 시각으로 비교한다. sort 는 안정 정렬이라 같은 시각은 위 순서(가입 초대 먼저)를 지킨다.
  return rows.sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));
}
