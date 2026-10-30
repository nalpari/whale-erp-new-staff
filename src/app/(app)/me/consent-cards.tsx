"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Alert, Badge, BottomSheet, Button, Card, Toast, type BadgeTone } from "@/components/common";
import type { Schemas } from "@/lib/api";
// 지금 시행 중인 위치정보 약관 — 받음 · 없음(설정 문제) · 잠시 못 받음. 타입만 가져온다(서버 모듈).
import type { CurrentTerms } from "@/lib/my-profile";
import { HQ_SHARING_TERMS, HQ_SHARING_TERMS_VERSION } from "@/lib/hq-sharing-terms";
import { CONSENT_CHANGES, dateLabel, hqSharingView, kstDateTimeLabel, locationNeedsReconsent, type ConsentChange, type LocationConsentState } from "@/lib/profile";
import { changeConsentAction } from "./actions";
import { CardLabel } from "@/app/_components/read-only-field";
import { TermsContent } from "./terms-content";


/**
 * 동의 바꾸기 — 보내는 동안 다시 누르지 못하게 하고, 실패 문구와 끝난 알림(토스트)을 들고 있는다. 끝나면(실패해도) 확인 시트를
 * 닫고 실패 문구는 카드에 보인다 — 409 면 상태가 바뀌어 그 시트가 더는 맞지 않을 수 있어서다. 화면은 액션의 refresh 로 다시 온다.
 * 액션 호출 자체가 던지면 Next 내부 오류(redirect 등)는 다시 던진다. 서버에서 난 오류(digest 가 붙음 — 결함 · 배포로 액션이
 * 바뀜)는 오류 번호와 함께 알리고, 휴대전화가 서버에 닿지 못한 경우만 연결 실패 문구다.
 */
function useConsentChange(onDone: () => void) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [toast, setToast] = useState<{ key: number; text: string }>();
  /** done 은 끝난 알림 문구를 바꿀 때(일시 중지 중 다시 동의) — 없으면 CONSENT_CHANGES 의 문구 */
  const change = (kind: ConsentChange, termsVersion?: string, done?: string) =>
    startTransition(async () => {
      setError(undefined);
      try {
        const result = await changeConsentAction(kind, termsVersion);
        if (result.ok) setToast({ key: Date.now(), text: done ?? CONSENT_CHANGES[kind].done });
        else setError(result.error);
      } catch (thrown) {
        unstable_rethrow(thrown);
        console.error("[consent] 액션 호출 실패", thrown);
        const digest = (thrown as { digest?: unknown } | null)?.digest;
        setError(
          typeof digest === "string"
            ? `동의 상태를 바꾸지 못했습니다. 계속되면 근무지 점포에 알려 주세요 (오류 번호 ${digest})`
            : "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요",
        );
      }
      onDone();
    });
  return { pending, error, toast, change };
}

/** 카드 머리(이름 · 상태 배지) · 일시 줄 · 버튼 · 끝의 안내. 데모 me 의 위치정보 · 본사 제공 카드와 같은 틀이다. */
function ConsentCard({
  title,
  badge,
  line,
  actions,
  note,
  error,
}: {
  title: string;
  badge: { tone: BadgeTone; text: string };
  line: string;
  actions: ReactNode;
  note: string;
  error?: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-[12px]">
        <CardLabel>{title}</CardLabel>
        <Badge tone={badge.tone}>{badge.text}</Badge>
      </div>
      <p className="pt-[8px] text-[12px] text-staff-text-muted">{line}</p>
      <div className="flex flex-col gap-[8px] pt-[10px]">{actions}</div>
      {error && (
        <div className="pt-[10px]">
          <Alert tone="warning">
            <p>{error}</p>
          </Alert>
        </div>
      )}
      <p className="pt-[8px] text-[12px] text-staff-placeholder">{note}</p>
    </Card>
  );
}

/** 카드 안 작은 버튼 줄 — 44px 외곽선 버튼이 칸을 나눠 갖는다(데모 smallButton). */
function SmallButtons({ children }: { children: ReactNode }) {
  return <div className="flex gap-[8px] [&>*]:min-w-0 [&>*]:flex-1">{children}</div>;
}

/** 시트 안 안내 판(데모 sunken) — 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14 · 14px 보조 글자. */
function Sunken({ children }: { children: ReactNode }) {
  return <div className="rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-[14px] text-staff-text-sub">{children}</div>;
}

// 배지 글자는 데모 문구다 — 미동의와 철회를 같은 「동의하지 않음」으로 묶는다. LocationConsentState 의 enum label
// (미동의 · 동의 · 일시 중지 · 철회)과 다르다.
const LOCATION_BADGE: Record<LocationConsentState, { tone: BadgeTone; text: string }> = {
  NOT_AGREED: { tone: "plain", text: "동의하지 않음" },
  AGREED: { tone: "success", text: "동의함" },
  PAUSED: { tone: "warning", text: "일시 중지" },
  WITHDRAWN: { tone: "plain", text: "동의하지 않음" },
};

type LocationSheet = "terms" | "pause" | "withdraw";

/**
 * 위치정보 동의 카드(ATT-23 · ATT-26, 데모 me 의 위치정보 카드). 동의 중이면 약관 보기 · 일시 중지 · 동의 철회, 일시 중지면
 * 약관 보기 · 다시 켜기(새 동의 없음) · 동의 철회, 미동의면 약관 보기 · (흐린 일시 중지) · 동의하기, 철회 뒤면 그 자리가 다시 동의(ME-5 — 내 정보에서도 동의한다,
 * 2026-10-20 노영주). 데모와 달리 다시 켜기 · 다시 동의도 같은 크기의 작은 버튼이다(2026-10-20 노영주). 일시 중지 · 철회는 확인 시트를,
 * 동의하기 · 다시 동의는 약관 시트를 거친다 — 약관을 보이고 그 안의 「동의합니다」로만 기록한다(2026-10-20 노영주). 약관을 못 받으면 동의할 수 없다.
 * 동의한 약관 버전이 바뀌어 다시 동의해야 하면(needsReconsent — 동의 · 일시 중지일 때) 사업자 제공 동의 카드처럼 「다시 동의 필요」 배지와
 * 다시 동의(약관 시트의 「동의합니다」)를 두고, 가운데 칸은 동의 철회다 — 옛 동의로는 수집하지 않아 일시 중지가 뜻이 없고, 새 약관에 동의하지
 * 않으려는 직원도 거둘 수 있게(ATT-30 v252, 2026-10-29 재영). 출근 화면의 다시 동의 시트는 그대로다.
 */
export function LocationConsentCard({ consent, terms: current }: { consent: Schemas["MyLocationConsentDto"]; terms: CurrentTerms }) {
  const terms = current.status === "ok" ? current.terms : null;
  const [sheet, setSheet] = useState<LocationSheet>();
  const { pending, error, toast, change } = useConsentChange(() => setSheet(undefined));
  const { state, agreedAt, pausedAt, withdrawnAt, consentVersion } = consent;
  const reconsent = locationNeedsReconsent(consent);
  const version = consentVersion ? ` · 위치정보 수집·이용 동의 ${consentVersion}` : "";

  // 일시 중지 중이면 그 사실을 남긴다 — 다시 동의해도 멈춘 채다(api 가 새 동의 행에 일시 중지를 옮긴다, ATT-26)
  const line = reconsent
    ? `${state === "PAUSED" && pausedAt ? `${kstDateTimeLabel(pausedAt)} 부터 일시 중지 — ` : agreedAt ? `${kstDateTimeLabel(agreedAt)} 동의${version} — ` : ""}약관이 바뀌어 다시 동의해야 합니다`
    : state === "AGREED" && agreedAt
      ? `${kstDateTimeLabel(agreedAt)} 동의${version}`
      : state === "PAUSED" && pausedAt
        ? `${kstDateTimeLabel(pausedAt)} 부터 일시 중지${agreedAt ? ` · 동의는 ${kstDateTimeLabel(agreedAt)} 그대로` : ""}`
        : state === "WITHDRAWN" && withdrawnAt
          ? `${kstDateTimeLabel(withdrawnAt)} 철회${version}`
          : "아직 동의하지 않았습니다";
  const termsButton = (
    <Button variant="outline" onClick={() => setSheet("terms")}>
      약관 보기
    </Button>
  );
  const withdrawButton = (
    <Button variant="outline" onClick={() => setSheet("withdraw")}>
      동의 철회
    </Button>
  );

  return (
    <>
      <ConsentCard
        title="위치정보 동의"
        badge={reconsent ? { tone: "warning", text: "다시 동의 필요" } : LOCATION_BADGE[state]}
        line={line}
        error={error}
        actions={
          // 버튼 세 칸은 상태와 상관없이 같은 크기 · 같은 자리이고, 가운데 「일시 중지 ↔ 다시 켜기」, 오른쪽 「동의 철회 ↔ 다시 동의」만
          // 바뀐다(2026-10-20 노영주). 동의가 없으면 멈출 것도 없어 일시 중지를 흐리게 둔다.
          // 다시 동의가 필요하면 가운데가 동의 철회, 오른쪽이 다시 동의다.
          <SmallButtons>
            {termsButton}
            {reconsent ? (
              withdrawButton
            ) : state === "PAUSED" ? (
              <Button variant="outline" disabled={pending} onClick={() => change("location-resume")}>
                다시 켜기
              </Button>
            ) : (
              <Button variant="outline" disabled={state !== "AGREED"} onClick={() => setSheet("pause")}>
                일시 중지
              </Button>
            )}
            {!reconsent && (state === "AGREED" || state === "PAUSED") ? (
              withdrawButton
            ) : (
              <Button variant="outline" onClick={() => setSheet("terms")}>
                {/* 세 칸(한 칸 약 100px)에 「다시 동의하기」는 넘쳐 줄였다. */}
                {state === "NOT_AGREED" ? "동의하기" : "다시 동의"}
              </Button>
            )}
          </SmallButtons>
        }
        note={
          reconsent
            ? state === "PAUSED"
              ? "새 약관에 다시 동의해도 일시 중지는 그대로입니다. 다시 동의한 뒤 「다시 켜기」로 수집을 켜면 앱으로 출퇴근을 등록할 수 있습니다."
              : "새 약관에 다시 동의하기 전에는 앱으로 출퇴근을 등록할 수 없습니다. 이 화면이나 다음 출퇴근 등록 때 다시 동의할 수 있습니다."
            : state === "AGREED"
            ? "동의하지 않으면 앱으로 출퇴근을 등록할 수 없고, 이 화면이나 다음 출퇴근 등록 때 다시 동의할 수 있습니다."
            : state === "PAUSED"
              ? "일시 중지 동안 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다시 켜면 새로 동의하지 않아도 됩니다."
              : "동의하지 않은 동안 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 이 화면이나 다음 출퇴근 등록 때 동의해도 됩니다."
        }
      />
      {toast && <Toast key={toast.key}>{toast.text}</Toast>}

      {/* 약관 본문은 지금 시행 중인 LOCATION 약관(api). 데모의 고정 문구 대신이다. */}
      <BottomSheet open={sheet === "terms"} onClose={() => setSheet(undefined)} title={terms?.label ?? "위치정보 수집·이용 동의"}>
        {terms ? (
          <>
            <p className="-mt-[12px] text-[12px] text-staff-text-muted">
              {terms.version} · {dateLabel(terms.effectiveDate)}부터
            </p>
            <div className="max-h-[45dvh] overflow-y-auto rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px]">
              <TermsContent markdown={terms.content} />
            </div>
            <p className="text-[12px] text-staff-text-muted">
              {reconsent
                ? "약관이 바뀌었습니다. 이 버전에 다시 동의해야 앱으로 출퇴근을 등록할 수 있습니다."
                : "약관 버전이 바뀌면 다음 출퇴근 등록 때 새 버전으로 다시 동의를 받습니다."}
            </p>
            {/* 동의는 약관을 보인 이 시트 안에서만 받는다(고지 후 동의, 2026-10-20 노영주). 읽었다는 값은 따로 두지 않는다 —
                api 가 동의한 약관 버전과 일시를 남긴다. */}
            {(state === "NOT_AGREED" || state === "WITHDRAWN" || reconsent) && (
              <Button
                disabled={pending}
                // 일시 중지 중 다시 동의는 멈춘 채다 — 「수집에 동의했습니다」로 켜진 것처럼 읽히지 않게
                onClick={() => change("location-agree", terms.version, reconsent && state === "PAUSED" ? "새 약관에 동의했습니다. 일시 중지는 그대로입니다" : undefined)}
              >
                동의합니다
              </Button>
            )}
          </>
        ) : (
          // 약관이 없으면(운영 설정) 다시 열어도 같아 관리자에게 알리게 하고, 잠시 못 받았으면 다시 열게 한다. 둘 다 동의 버튼은 없다.
          <Alert tone="warning">
            <p>
              {current.status === "missing"
                ? "지금은 위치정보 동의를 받을 수 없습니다. 근무지 관리자에게 문의해 주세요."
                : "약관을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요."}
            </p>
          </Alert>
        )}
      </BottomSheet>

      {/* 일시 중지(ATT-26). 동의는 남고 수집만 멎어 다시 켤 때 동의 절차가 없다. */}
      <BottomSheet open={sheet === "pause"} onClose={() => setSheet(undefined)} title="위치 수집을 일시 중지할까요" closeLabel="그대로 두기">
        <p className="text-[14px] font-bold text-staff-text">
          일시 중지 중에는 앱으로 출퇴근을 등록할 수 없습니다. 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다시 켜면 새로 동의하지 않아도
          됩니다
        </p>
        <Sunken>동의는 그대로 남고 수집만 멎습니다. 철회와 달리 다시 켤 때 동의 절차가 없습니다.</Sunken>
        <Button disabled={pending} onClick={() => change("location-pause")}>
          일시 중지
        </Button>
      </BottomSheet>

      {/* 동의 철회(ATT-23). 다시 등록하려면 새로 동의해야 한다. */}
      <BottomSheet open={sheet === "withdraw"} onClose={() => setSheet(undefined)} title="위치정보 동의를 철회할까요" closeLabel="그대로 두기">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          철회하면 <strong>앱으로 출퇴근을 등록할 수 없습니다. 출퇴근 기록은 근무지 관리자에게 문의해 주세요.</strong>
        </p>
        <Sunken>다시 등록하려면 이 화면이나 다음 출퇴근 등록 때 새로 동의하면 됩니다. 이미 남은 기록은 그대로 보존됩니다.</Sunken>
        <Button disabled={pending} onClick={() => change("location-withdraw")}>
          철회합니다
        </Button>
      </BottomSheet>
    </>
  );
}

type HqSheet = "content" | "withdraw";

/**
 * 본사 제공 동의 카드(ATT-30, 데모 me 의 본사 제공 카드). 가맹 점포 소속이 있을 때만 보인다. 계정에 하나라 소속 가맹 점포 모두에
 * 같이 적용된다. 동의 중이면 내용 보기 · 동의 철회(확인 시트), 아니면 내용 보기 · 다시 동의하기(내용 시트 안의 「동의합니다」로 기록).
 * 옛 문구 버전에 동의해 다시 동의해야 하면(needsReconsent, api #183) 「다시 동의 필요」 · 다시 동의하기다 — 표시는 hqSharingView.
 */
export function HqSharingConsentCard({ consent }: { consent: Schemas["MyHqSharingConsentDto"] }) {
  const [sheet, setSheet] = useState<HqSheet>();
  const { pending, error, toast, change } = useConsentChange(() => setSheet(undefined));
  const view = hqSharingView(consent);
  const contentButton = (
    <Button variant="outline" onClick={() => setSheet("content")}>
      내용 보기
    </Button>
  );

  return (
    <>
      <ConsentCard
        title="사업자 제공 동의"
        badge={view.badge}
        line={view.line}
        error={error}
        actions={
          // 위치정보 카드와 같이 크기는 그대로 두고 오른쪽 칸만 「동의 철회 ↔ 다시 동의하기」로 바뀐다.
          <SmallButtons>
            {contentButton}
            {view.action.kind === "withdraw" ? (
              <Button variant="outline" onClick={() => setSheet("withdraw")}>
                동의 철회
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setSheet("content")}>
                {view.action.label}
              </Button>
            )}
            {view.action.kind === "agree" && view.action.alsoWithdraw && (
              <Button variant="outline" onClick={() => setSheet("withdraw")}>
                동의 철회
              </Button>
            )}
          </SmallButtons>
        }
        note={view.note}
      />
      {toast && <Toast key={toast.key}>{toast.text}</Toast>}

      <BottomSheet open={sheet === "content"} onClose={() => setSheet(undefined)} title="사업자 제공 동의">
        <dl className="rounded-[12px] border border-staff-border-light bg-staff-info-bg px-[14px] py-[5px] text-[13px]">
          {HQ_SHARING_TERMS.map(([name, value]) => (
            <div key={name} className="flex gap-[12px] border-b border-staff-border-light py-[9px] last:border-b-0">
              <dt className="shrink-0 text-staff-text-sub">{name}</dt>
              <dd className="min-w-0 flex-1 text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[12px] text-staff-text-muted [&_strong]:font-bold [&_strong]:text-staff-text">
          선택 동의입니다. 철회해도 가입과 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. <strong>항목이나 목적이 넓어지면</strong> 새
          버전으로 다시 동의를 받습니다.
        </p>
        {view.action.kind === "agree" && view.action.alsoWithdraw && (
          <Alert tone="warning">
            <p>동의한 뒤 내용이 바뀌었습니다. 위 내용으로 다시 동의해야 본사에 개인 단위로 보입니다 — 원하지 않으면 동의를 철회할 수 있습니다.</p>
          </Alert>
        )}
        <p className="text-[12px] text-staff-placeholder">동의 문구는 법무 검토 중(ATT-8)</p>
        {/* 위치정보와 같이 내용을 보인 이 시트 안에서만 동의를 받는다. */}
        {view.action.kind === "agree" && (
          <Button disabled={pending} onClick={() => change("hq-sharing-agree", HQ_SHARING_TERMS_VERSION)}>
            동의합니다
          </Button>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "withdraw"} onClose={() => setSheet(undefined)} title="사업자 제공 동의를 철회할까요" closeLabel="그대로 두기">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          철회하면 가맹본부가 <strong>내 근무 정보를 개인 단위로 보지 않습니다.</strong> 점포별 숫자로만 보입니다.
        </p>
        <Sunken>가입과 근무, 급여명세서 수령은 그대로입니다. 다시 동의하려면 이 화면의 「다시 동의하기」로 하면 됩니다.</Sunken>
        <Button disabled={pending} onClick={() => change("hq-sharing-withdraw")}>
          철회합니다
        </Button>
      </BottomSheet>
    </>
  );
}
