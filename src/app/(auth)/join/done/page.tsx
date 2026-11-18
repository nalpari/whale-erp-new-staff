import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Button, Card, Notice } from "@/components/common";
import { HQ_NOT_RECORDED, HQ_NOT_RECORDED_NOTICE, isHqNotRecorded } from "@/lib/hq-sharing-terms";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";
import { getMyProfileForExtra } from "@/lib/my-profile";
import { dateLabel } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { AuthScreen } from "../../_components/auth-screen";

export const metadata: Metadata = { title: "가입 완료 · Whale ERP" };

// 가입 완료(WHALEERP-142, 가이드 ④). 가입한 액션이 로그인 쿠키를 구웠으므로 로그인된 상태로 홈에 간다.
// 근무지 이름은 가입한 액션이 남긴 쿠키에서 읽는다(10분, invitation-cookie.ts) — 없으면 그 줄을 뺀다.
// 보이는 항목은 데모 join done 의 이름 · 생년월일 · 근무지다 — 생년월일은 내 정보(`/me/profile`)에서 읽고 못 읽으면 그 줄을 뺀다.
// 근로계약서는 아직 오지 않았을 수 있어 「도착했습니다」로 단정하지 않는다. 사업자 제공 동의를 보냈지만 본 문구 버전이 달라 남지 않았으면(ATT-30
// v253 — 가입은 마쳤다) 가입한 액션이 주소에 정한 값 하나(`hq=not-recorded`)를 실어 다시 동의하라고 안내한다.
export default async function JoinDonePage({ searchParams }: PageProps<"/join/done">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [storeName, profile, hqNotRecorded] = await Promise.all([
    readJoinedStore(),
    getMyProfileForExtra("profile-join-done"),
    searchParams.then((p) => isHqNotRecorded(p[HQ_NOT_RECORDED.key])),
  ]);
  const rows = [
    { label: "이름", value: session.account.realName },
    ...(profile ? [{ label: "생년월일", value: dateLabel(profile.birthDate) }] : []),
    ...(storeName ? [{ label: "근무지", value: storeName }] : []),
  ];
  return (
    <AuthScreen
      title="가입이 완료되었습니다"
      description={
        storeName ? (
          <>
            <strong>{storeName}</strong>에 계정이 연결되었습니다.
          </>
        ) : (
          "초대한 근무지에 계정이 연결되었습니다."
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
          {rows.map((row) => (
            <div key={row.label} className="flex gap-[12px] border-b border-staff-border-light py-[10px] last:border-b-0">
              <dt className="shrink-0 text-staff-text-sub">{row.label}</dt>
              <dd className="min-w-0 flex-1 text-right font-semibold break-keep">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {/* 생년월일 줄을 못 읽어 뺐으면 안내도 뺀다 */}
      {profile && <p className="text-[12px] text-staff-text-muted">생년월일은 가입한 뒤 앱에서 변경할 수 없습니다.</p>}
      {hqNotRecorded && <Alert tone="warning">{HQ_NOT_RECORDED_NOTICE}</Alert>}
      <Notice>근무지에서 보낸 근로계약서는 홈에서 내용을 확인하고 서명해 주세요.</Notice>
    </AuthScreen>
  );
}
