import type { Metadata } from "next";
import { getEnumOrEmpty, labelOf } from "@/lib/enums";
import { GENDERS } from "@/lib/join";
import { getStaffTerms } from "@/lib/my-profile";
import { loadInvitation } from "../load-invitation";
import { InvitationExpired, InvitationProblem } from "../screens";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "계정 등록 · Whale ERP" };

// 계정 등록(WHALEERP-142, 가이드 ③). 그릴 때 쿠키의 초대를 다시 확인한다 — 휴대전화번호(읽기 전용)와 본사 제공 동의를 물을지는
// 확인 결과에서 온다. 약관 동의 칸의 「보기」는 지금 시행 중인 직원 앱 약관 셋을 함께 받아 보인다(ACC-23, WHALEERP-774). 쿠키가 없으면(30분이 지남) 처음부터 다시 하라고 안내한다.
export default async function SignupPage() {
  const [loaded, genders] = await Promise.all([loadInvitation(), getEnumOrEmpty("Gender")]);
  if (loaded.kind === "none") return <InvitationExpired />;
  if (loaded.kind !== "ready") return <InvitationProblem loaded={loaded} />;
  // 약관은 초대를 확인한 뒤에만 받는다 — 끝난 초대 안내가 약관 조회를 기다리지 않게. 실패는 「잠시 못 받음」으로 온다
  const terms = await getStaffTerms();
  const { invitation, via } = loaded;
  return (
    <SignupForm
      via={via}
      storeName={invitation.storeName}
      phone={invitation.phone}
      asksHqSharingConsent={invitation.asksHqSharingConsent}
      terms={terms}
      genders={GENDERS.map((value) => ({ value, label: labelOf(genders, value) }))}
    />
  );
}
