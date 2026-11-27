import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Button, Card, Notice } from "@/components/common";
import { getContractsOrNull } from "@/lib/contracts";
import { HQ_NOT_RECORDED, HQ_NOT_RECORDED_NOTICE, isHqNotRecorded } from "@/lib/hq-sharing-terms";
import { readJoinedStore } from "@/lib/invitation-cookie";
import { HOME_PATH } from "@/lib/login-return";
import { getMyMembershipsForExtra, getMyProfileForExtra, paperTaxProfileDue } from "@/lib/my-profile";
import { taxProfileNewHref } from "@/lib/paper-tax-profile";
import { dateLabel } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { AuthScreen } from "../../_components/auth-screen";

export const metadata: Metadata = { title: "가입 완료 · Whale ERP" };

// 가입 완료(WHALEERP-142, 가이드 ④). 가입한 액션이 로그인 쿠키를 구웠으므로 로그인된 상태로 홈에 간다.
// 근무지 이름은 가입한 액션이 남긴 쿠키에서 읽는다(10분, invitation-cookie.ts) — 없으면 그 줄을 뺀다.
// 보이는 항목은 데모 join done 의 이름 · 생년월일 · 근무지다 — 생년월일은 내 정보(`/me/profile`)에서 읽고 못 읽으면 그 줄을 뺀다.
// 근로계약서는 아직 오지 않았을 수 있어 「도착했습니다」로 단정하지 않는다. 사업자 제공 동의를 보냈지만 본 문구 버전이 달라 남지 않았으면(ATT-30
// v253 — 가입은 마쳤다) 가입한 액션이 주소에 정한 값 하나(`hq=not-recorded`)를 실어 다시 동의하라고 안내한다.
// 근로계약을 종이로 맺은 소속에 신고 정보가 없으면 서명 안내 대신 신고 정보 입력으로 잇는다(WHALEERP-775, CTR-23) — 종이 계약은 날인이
// 없어 서명 완료 화면을 지나지 않는다. 서명을 기다리는 계약도 함께 있으면 서명 안내를 같이 둔다. 소속 · 계약 목록을 못 받으면 지금 안내 그대로다.
export default async function JoinDonePage({ searchParams }: PageProps<"/join/done">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [storeName, profile, hqNotRecorded, { taxDue, awaitingSign, paperOnly }] = await Promise.all([
    readJoinedStore(),
    getMyProfileForExtra("profile-join-done"),
    searchParams.then((p) => isHqNotRecorded(p[HQ_NOT_RECORDED.key])),
    paperTaxDue(),
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
        taxDue ? (
          <>
            <Button href={taxProfileNewHref(taxDue.staffMemberId)} replace transitionTypes={["nav-forward"]}>
              신고 정보 입력하기
            </Button>
            <Button variant="ghost" href={HOME_PATH} replace transitionTypes={["nav-forward"]}>
              홈으로
            </Button>
          </>
        ) : (
          <Button href={HOME_PATH} replace transitionTypes={["nav-forward"]}>
            홈으로
          </Button>
        )
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
      {/* 종이 계약만 있고 신고 정보도 냈으면 할 일이 없어 안내를 두지 않는다 */}
      {!paperOnly && (
        <Notice>
          {taxDue ? (
            <>
              근로계약은 종이로 맺었습니다. 급여 신고에 쓸 정보를 입력해 주세요.
              {awaitingSign && (
                <>
                  <br />
                  서명을 기다리는 근로계약서는 홈에서 확인하고 서명해 주세요.
                </>
              )}
            </>
          ) : (
            "근무지에서 보낸 근로계약서는 홈에서 내용을 확인하고 서명해 주세요."
          )}
        </Notice>
      )}
    </AuthScreen>
  );
}

/**
 * 신고 정보를 넣어야 하는 종이 계약 소속(소속 목록 순서의 첫째, 없거나 소속 · 계약 목록을 못 받았으면 null), 지금 서명할 계약이 있는지,
 * 할 일이 없음을 확인했는지(paperOnly — 서명 완료 종이 계약만 있고 서명할 계약도 넣을 신고 정보도 없음). 가입 초대는 계정이 없는
 * 번호에만 가서(api decideInvitation) 가입 직후 계정의 계약은 이번 근무지 것뿐이라 계정 전체로 본다. 곁들임이라 두 목록의
 * 실패(401 밖)는 화면을 깨지 않고, 실패면 할 일을 확인하지 못한 것으로 보고 지금 안내 그대로다.
 */
async function paperTaxDue() {
  const [memberships, contracts] = await Promise.all([
    getMyMembershipsForExtra("join-done:memberships"),
    getContractsOrNull("join-done:contracts"),
  ]);
  if (!memberships || !contracts) return { taxDue: null, awaitingSign: false, paperOnly: false };
  const [taxDue] = await paperTaxProfileDue(memberships.items, contracts, true, "join-done:tax-profile");
  const awaitingSign = contracts.some((c) => c.awaitingSignature);
  // 지금 소속(직원 레코드)과 짝을 맞춘 종이 계약이 있을 때만 할 일이 없다고 본다 — staffMemberId 가 없는 옛 api 응답이면 짝을 맞추지 못해 지금 안내 그대로
  const records = new Set(memberships.items.map((m) => m.staffMemberId));
  const paperOnly =
    !taxDue && !awaitingSign && contracts.some((c) => c.status === "SIGNED" && c.contractMethod === "PAPER" && records.has(c.staffMemberId));
  return { taxDue: taxDue ?? null, awaitingSign, paperOnly };
}
