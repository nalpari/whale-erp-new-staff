import type { Metadata } from "next";
import { Button, Notice } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { parseId } from "@/lib/contract-rules";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";

export const metadata: Metadata = { title: "근무지 추가 완료 · Whale ERP" };

// 근무지 추가 완료(WHALEERP-604). 근무지 이름은 더한 액션이 남긴 쿠키에서 읽는다(10분) — 없으면 이름 없이 보인다.
// Plane 604 대로 더한 뒤 그 근무지의 근로계약서(`/contracts?store=`, 뒤로 가면 소속 근무지)로 잇는다. 점포 id 는 액션이 주소로 넘기고
// (api 수락 응답의 storeId), 없거나 읽지 못하면 전체 목록으로 간다. 근무지가 아직 계약서를 보내지 않았으면 목록이 비어 있다.
export default async function InvitationDonePage({ searchParams }: PageProps<"/me/invitations/done">) {
  const [storeName, storeId] = await Promise.all([readJoinedStore(), searchParams.then((p) => parseId(p.store))]);
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
          <Button href={storeId === null ? "/contracts" : `/contracts?store=${storeId}`} replace transitionTypes={["nav-forward"]}>
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
