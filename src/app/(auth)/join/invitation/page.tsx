import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { kstDateLabel } from "@/lib/profile";
import { loadInvitation } from "../load-invitation";
import { InvitationProblem, InvitationScreen } from "../screens";

export const metadata: Metadata = { title: "초대 확인 · Whale ERP" };

// 초대 확인(WHALEERP-141, 가이드 ②). 초대 코드 입력이나 초대 링크(/invite)가 쿠키에 둔 초대를 다시 확인해 그린다 — 새로고침 ·
// 뒤로 가기로 돌아와도 지금 상태(그사이 끝남 · 가입 마침)를 보인다.
export default async function InvitationPage() {
  const loaded = await loadInvitation();
  if (loaded.kind === "none") redirect("/join");
  if (loaded.kind !== "ready") return <InvitationProblem loaded={loaded} />;
  const { invitation, via } = loaded;
  const employmentTypes = await getEnumOrEmpty("EmploymentType");
  return (
    <InvitationScreen
      via={via}
      storeName={invitation.storeName}
      employmentType={labelOf(employmentTypes, invitation.employmentType)}
      expiresOn={kstDateLabel(invitation.expiresAt)}
    />
  );
}
