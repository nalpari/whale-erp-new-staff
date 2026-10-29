import type { Metadata } from "next";
import { Button, Notice } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";

export const metadata: Metadata = { title: "근무지 추가 완료 · Whale ERP" };

// 근무지 추가 완료(WHALEERP-604). 근무지 이름은 더한 액션이 남긴 쿠키에서 읽는다(10분) — 없으면 이름 없이 보인다.
// 더한 뒤에는 날인을 기다리는 근로계약서로 간다(Plane 604) — 근로계약서 목록(WHALEERP-146, staff #44). 수락 응답에 점포 id 가 없어
// 그 근무지로 거른 목록(`/contracts?store=`) 대신 받은 계약서 모두를 연다(staff #40 리뷰 후속).
export default async function InvitationDonePage() {
  const storeName = await readJoinedStore();
  return (
    <AuthScreen
      title="근무지를 더했습니다"
      description={
        storeName ? (
          <>
            <strong>{storeName}</strong> 근무지에 계정이 이어졌습니다.
          </>
        ) : (
          "초대한 근무지에 계정이 이어졌습니다."
        )
      }
      dock={
        <>
          <Button href="/contracts" replace transitionTypes={["nav-forward"]}>
            근로계약서 보기
          </Button>
          <Button variant="ghost" href={HOME_PATH} replace transitionTypes={["nav-forward"]}>
            홈으로
          </Button>
        </>
      }
    >
      <Notice>
        이 근무지에서 보낸 근로계약서를 확인하고 날인해 주세요. 근로계약을 체결하면 소속 근무지에 보이고 그 근무지의 근무 정보를 볼
        수 있습니다.
      </Notice>
    </AuthScreen>
  );
}
