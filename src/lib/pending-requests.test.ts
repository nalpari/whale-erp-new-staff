// node --test src/lib/pending-requests.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Schemas } from "./api";
import { pendingRequestRows } from "./pending-requests.ts";

const invitation = (id: number, sentAt: string): Schemas["MyInvitationDto"] => ({
  invitationId: id,
  storeName: `가입점${id}`,
  employmentType: "FULL_TIME",
  jobTitle: null,
  sentAt,
  expiresAt: "2026-11-30T00:00:00.000Z",
  asksHqSharingConsent: false,
});
const affiliation = (
  id: number,
  sentAt: string,
  invitationType: Schemas["AffiliationRequestDto"]["invitationType"] = "AFFILIATION_CONFIRM",
): Schemas["AffiliationRequestDto"] => ({
  invitationId: id,
  invitationType,
  storeName: `소속점${id}`,
  bpName: "웨일",
  employmentType: "PART_TIME",
  employmentTypeLabel: "파트타이머",
  jobTitle: "홀",
  sentAt,
  expiresAt: "2026-11-30T00:00:00.000Z",
  asksHqSharingConsent: false,
});
const label = () => "정직원";
const kind = (a: Schemas["AffiliationRequestDto"]) => (a.invitationType === "RETURN_CONFIRM" ? "복귀 확인" : "소속 추가 요청");

test("pendingRequestRows 는 가입 초대와 소속 추가 · 복귀 확인을 받은 때 최신순으로 섞는다", () => {
  const rows = pendingRequestRows(
    [invitation(1, "2026-09-02T01:00:00Z"), invitation(2, "2026-09-10T01:00:00.000Z")],
    [affiliation(3, "2026-09-09T01:00:00.5Z"), affiliation(4, "2026-09-07T01:00:00Z", "RETURN_CONFIRM")],
    label,
    kind,
  );
  assert.deepEqual(
    rows.map((r) => [r.key, r.kind]),
    [
      ["invitation-2", "가입 초대"],
      ["affiliation-3", "소속 추가 요청"],
      ["affiliation-4", "복귀 확인"],
      ["invitation-1", "가입 초대"],
    ],
  );
  assert.equal(rows[0].href, "/me/invitations/2");
  assert.equal(rows[1].href, "/affiliations?id=3");
  // 소속 추가 확인은 api 가 준 한글, 가입 초대는 enum 한글
  assert.equal(rows[1].employment, "파트타이머");
  assert.equal(rows[0].employment, "정직원");
});

test("pendingRequestRows 는 받은 시각이 같으면 가입 초대를 앞에 둔다", () => {
  const rows = pendingRequestRows([invitation(1, "2026-09-02T01:00:00Z")], [affiliation(2, "2026-09-02T01:00:00.000Z")], label, kind);
  assert.deepEqual(rows.map((r) => r.key), ["invitation-1", "affiliation-2"]);
});
