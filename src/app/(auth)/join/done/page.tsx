import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Button, Card, Notice } from "@/components/common";
import { HQ_NOT_RECORDED, HQ_NOT_RECORDED_NOTICE, isHqNotRecorded } from "@/lib/hq-sharing-terms";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";
import { getSession } from "@/lib/session";
import { AuthScreen } from "../../_components/auth-screen";

export const metadata: Metadata = { title: "가입 완료 · Whale ERP" };

// 가입 완료(WHALEERP-142, 가이드 ④). 가입한 액션이 로그인 쿠키를 구웠으므로 로그인된 상태로 홈에 간다.
// 근무지 이름은 가입한 액션이 남긴 쿠키에서 읽는다(10분, invitation-cookie.ts) — 없으면 그 줄을 뺀다.
// 날인 요청 팝업(WHALEERP-148)은 아직 없어 홈의 할 일로 안내한다. 사업자 제공 동의를 보냈지만 본 문구 버전이 달라 남지 않았으면(ATT-30
// v253 — 가입은 마쳤다) 가입한 액션이 주소에 정한 값 하나(`hq=not-recorded`)를 실어 다시 동의하라고 안내한다.
export default async function JoinDonePage({ searchParams }: PageProps<"/join/done">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [storeName, hqNotRecorded] = await Promise.all([readJoinedStore(), searchParams.then((p) => isHqNotRecorded(p[HQ_NOT_RECORDED.key]))]);
  return (
    <AuthScreen
      title="가입을 마쳤습니다"
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
      <Card>
        <dl className="flex flex-col text-[14px]">
          <div className="flex gap-[12px] border-b border-staff-border-light py-[10px] last:border-b-0">
            <dt className="shrink-0 text-staff-text-sub">이름</dt>
            <dd className="min-w-0 flex-1 text-right font-semibold break-keep">{session.account.realName}</dd>
          </div>
          <div className="flex gap-[12px] border-b border-staff-border-light py-[10px] last:border-b-0">
            <dt className="shrink-0 text-staff-text-sub">로그인 이메일</dt>
            <dd className="min-w-0 flex-1 text-right font-semibold break-all">{session.account.email}</dd>
          </div>
        </dl>
        <p className="pt-[6px] text-[12px] text-staff-text-muted">생년월일은 가입한 뒤 직접 고칠 수 없습니다.</p>
      </Card>
      {hqNotRecorded && <Alert tone="warning">{HQ_NOT_RECORDED_NOTICE}</Alert>}
      <Notice>근무지에서 보낸 근로계약서는 홈에서 확인하고 서명할 수 있습니다.</Notice>
    </AuthScreen>
  );
}
