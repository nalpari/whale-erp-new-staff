import type { Metadata } from "next";
import { Button, Notice } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";

export const metadata: Metadata = { title: "근무지 추가 완료 · Whale ERP" };

// 근무지 추가 완료(WHALEERP-604). 근무지 이름은 더한 액션이 남긴 쿠키에서 읽는다(10분) — 없으면 이름 없이 보인다.
// Plane 604 는 더한 뒤 그 점포의 날인을 기다리는 근로계약서로 가라고 하지만 근로계약서 화면(WHALEERP-146)이 아직 없어 가입 완료와
// 같이 홈으로 안내한다. 근로계약서 화면이 생기면 그리로 잇는다.
export default async function AddWorkplaceDonePage() {
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
        <Button href={HOME_PATH} replace transitionTypes={["nav-forward"]}>
          홈으로
        </Button>
      }
    >
      <Notice>
        근로계약서 확인 · 날인 화면은 준비 중입니다. 근로계약을 체결하면 소속 근무지에 보이고 그 근무지의 근무 정보를 볼 수
        있습니다.
      </Notice>
    </AuthScreen>
  );
}
