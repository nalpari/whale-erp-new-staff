import type { Metadata } from "next";
import { Button, Notice } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";

export const metadata: Metadata = { title: "근무지 추가 완료 · Whale ERP" };

// 근무지 추가 완료(WHALEERP-604). 근무지 이름은 더한 액션이 남긴 쿠키에서 읽는다(10분) — 없으면 이름 없이 보인다.
// Plane 604 대로 더한 뒤 근로계약서로 잇는다. 수락 응답에 점포 id 가 없어 그 점포만(`?store=`) 걸지 못하고 전체 목록으로 간다 —
// 서명을 기다리는 계약은 맨 위 진행 중 묶음에 다른 근무지 계약과 함께 보이고, 근무지가 아직 보내지 않았으면 없다. 홈으로도 갈 수 있다.
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
        근무지가 보낸 근로계약서는 근로계약서 화면에서 확인하고 서명합니다. 서명하면 근로계약이 체결되어 소속 근무지에 보입니다.
      </Notice>
    </AuthScreen>
  );
}
