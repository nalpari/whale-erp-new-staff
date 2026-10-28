import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Dock } from "@/components/common";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { getMyInvitations } from "@/lib/my-invitations";
import { kstDateTimeLabel } from "@/lib/profile";
import { parseStaffMemberId } from "@/lib/tax-profile";
import { acceptMyInvitationAction } from "../actions";
import { BackToMemberships, InvitationEnded } from "../screens";
import { AcceptInvitationForm } from "./accept-form";

export const metadata: Metadata = { title: "받은 초대 · Whale ERP" };

// 받은 초대 확인(WHALEERP-604). 소속 근무지 맨 위 「확인을 기다리는 요청」에서 들어온다. 받은 초대 목록을 다시 읽어 이 초대를 찾는다 —
// 그사이 끝났거나(재발송 · 기한) 다른 기기에서 더했으면 목록에 없어 「쓸 수 없는 초대」다.
export default async function InvitationPage({ params }: PageProps<"/me/invitations/[invitationId]">) {
  const invitationId = parseStaffMemberId((await params).invitationId);
  if (invitationId === null) notFound();
  const [invitations, employmentTypes] = await Promise.all([getMyInvitations(), getEnumOrEmpty("EmploymentType")]);
  if (invitations === null)
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-[16px] px-[24px] pt-[52px] pb-[24px] leading-[1.5]">
          <Alert tone="warning">
            <p>받은 초대를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>
          </Alert>
        </div>
        <Dock>
          <BackToMemberships />
        </Dock>
      </div>
    );
  const invitation = invitations.find((i) => i.invitationId === invitationId);
  if (!invitation) return <InvitationEnded />;
  return (
    <AcceptInvitationForm
      action={acceptMyInvitationAction.bind(null, String(invitationId))}
      storeName={invitation.storeName}
      employmentType={labelOf(employmentTypes, invitation.employmentType)}
      expiresOn={kstDateTimeLabel(invitation.expiresAt)}
      asksHqSharingConsent={invitation.asksHqSharingConsent}
    />
  );
}
