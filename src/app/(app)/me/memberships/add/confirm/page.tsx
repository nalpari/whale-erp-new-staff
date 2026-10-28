import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { ADD_WORKPLACE_PATH } from "@/lib/join";
import { kstDateTimeLabel } from "@/lib/profile";
import { loadMyInvitation } from "../load-my-invitation";
import { MyInvitationProblem } from "../screens";
import { AddConfirmForm } from "./confirm-form";

export const metadata: Metadata = { title: "근무지 추가 · Whale ERP" };

// 근무지 추가의 초대 확인(WHALEERP-604). 초대 코드 입력이나 로그인한 채 연 초대 링크(/invite)가 쿠키에 둔 초대를 다시 확인해
// 그린다 — 새로고침 · 뒤로 가기로 돌아와도 지금 상태(그사이 끝남 · 이미 더함)를 보인다.
export default async function AddConfirmPage() {
  const [loaded, employmentTypes] = await Promise.all([loadMyInvitation(), getEnumOrEmpty("EmploymentType")]);
  if (loaded.kind === "none") redirect(ADD_WORKPLACE_PATH);
  if (loaded.kind !== "ready") return <MyInvitationProblem problem={loaded} />;
  const { invitation } = loaded;
  return (
    <AddConfirmForm
      storeName={invitation.storeName}
      employmentType={labelOf(employmentTypes, invitation.employmentType)}
      expiresOn={kstDateTimeLabel(invitation.expiresAt)}
      asksHqSharingConsent={invitation.asksHqSharingConsent}
    />
  );
}
