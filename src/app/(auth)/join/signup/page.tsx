import type { Metadata } from "next";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { loadInvitation } from "../load-invitation";
import { InvitationExpired, InvitationProblem } from "../screens";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "계정 등록 · Whale ERP" };

/** api StaffSignupDto 의 성별 값. 한글 이름은 enum 으로 받는다. */
const GENDERS = ["MALE", "FEMALE"] as const;

// 계정 등록(WHALEERP-142, 가이드 ③). 그릴 때 쿠키의 초대를 다시 확인한다 — 휴대전화번호(읽기 전용)와 본사 제공 동의를 물을지는
// 확인 결과에서 온다. 쿠키가 없으면(30분이 지남) 처음부터 다시 하라고 안내한다.
export default async function SignupPage() {
  const loaded = await loadInvitation();
  if (loaded.kind === "none") return <InvitationExpired />;
  if (loaded.kind !== "ready") return <InvitationProblem loaded={loaded} />;
  const { invitation, via } = loaded;
  const genders = await getEnumOrEmpty("Gender");
  return (
    <SignupForm
      via={via}
      storeName={invitation.storeName}
      phone={invitation.phone}
      asksHqSharingConsent={invitation.asksHqSharingConsent}
      genders={GENDERS.map((value) => ({ value, label: labelOf(genders, value) }))}
    />
  );
}
