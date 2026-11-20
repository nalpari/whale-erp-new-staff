"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { Alert, Badge, BottomSheet, Button, Toast, type BadgeTone } from "@/components/common";
import { PRESS } from "@/components/common/theme";
import type { Schemas } from "@/lib/api";
// 지금 시행 중인 위치정보 약관 — 받음 · 없음(설정 문제) · 잠시 못 받음. 타입만 가져온다(서버 모듈).
import type { CurrentTerms } from "@/lib/my-profile";
import { HQ_SHARING_TERMS_VERSION } from "@/lib/hq-sharing-terms";
import { HqSharingTermsBody, HqSharingTermsReviewNote } from "@/app/_components/hq-sharing-terms";
import {
  CONSENT_CHANGES,
  LOCATION_REAGREED,
  dateLabel,
  hqSharingView,
  kstDateTimeLabel,
  locationNeedsReconsent,
  type ConsentChange,
  type LocationConsentState,
} from "@/lib/profile";
import { changeConsentAction } from "./actions";
import { RowBox, RowGroup, RowIcon, type LineIconName } from "./me-rows";
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
  /** done 은 끝난 알림 문구를 바꿀 때(일시 중지 중 새 약관 동의 · 철회 뒤나 약관 변경 뒤 다시 동의) — 없으면 CONSENT_CHANGES 의 문구 */
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
            ? `동의 상태를 바꾸지 못했습니다. 계속되면 근무지에 알려 주세요 (오류 번호 ${digest})`
            : "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요",
        );
      }
      onDone();
    });
  return { pending, error, toast, change };
}

/**
 * 동의 묶음(정돈 시안 ⑬) — 제목(14 semibold 보조) 아래 흰 상자: 윗줄은 32px 원 아이콘 · 상태 배지 · 13px 일시 줄, 아랫줄은 구분선
 * 위 가로 글자 버튼들(높이 44, 사이 1×14 세로선). 실패 문구는 상자 아래, 안내는 묶음 밖 12px 흐린 글자다.
 */
function ConsentCard({
  title,
  icon,
  badge,
  line,
  actions,
  note,
  error,
}: {
  title: string;
  icon: LineIconName;
  badge: { tone: BadgeTone; text: string };
  /** 비면 두지 않는다(처음 · 동의하지 않음) */
  line: string;
  actions: ReactNode;
  /** 비면 두지 않는다 */
  note: string;
  error?: string;
}) {
  return (
    <RowGroup title={title} note={note || undefined}>
      <RowBox>
        <div className="flex min-h-[56px] items-center gap-[12px] py-[10px] pr-[16px] pl-[14px]">
          <RowIcon name={icon} />
          <span className="flex min-w-0 flex-1 flex-col items-start gap-[2px] break-keep">
            <Badge tone={badge.tone}>{badge.text}</Badge>
            {line && <span className="text-[13px] text-staff-text-muted">{line}</span>}
          </span>
        </div>
        {/* 글자 버튼 사이 세로선(1×14, staff-border)은 둘째 버튼부터 앞에 긋는다 */}
        <div className="flex items-center [&>*+*]:before:absolute [&>*+*]:before:top-[15px] [&>*+*]:before:left-0 [&>*+*]:before:h-[14px] [&>*+*]:before:w-px [&>*+*]:before:bg-staff-border">
          {actions}
        </div>
      </RowBox>
      {error && (
        <Alert tone="warning">
          <p>{error}</p>
        </Alert>
      )}
    </RowGroup>
  );
}

/** 상자 아래 가로 글자 버튼 — 칸을 나눠 갖는다. primary 면 남보라 글자(그 상태의 주 동작). */
function TextAction({ primary = false, ...props }: { primary?: boolean } & Omit<ComponentProps<"button">, "className" | "type">) {
  return (
    <button
      {...props}
      type="button"
      className={`relative h-[44px] min-w-0 flex-1 text-[14px] font-semibold ${primary ? "text-staff-primary" : "text-staff-text-sub"} active:bg-staff-info-bg ${PRESS}`}
    />
  );
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
 * 출퇴근 위치정보 이용 동의 묶음(ATT-23 · ATT-26, 정돈 시안 ⑬ 상태별). 동의 중이면 약관 보기 · 일시 중지 · 동의 철회, 일시 중지면
 * 약관 보기 · 다시 켜기(새 동의 없음) · 동의 철회, 미동의면 약관 보기 · 동의하기(ME-5 — 내 정보에서도 동의한다, 2026-10-20 노영주),
 * 철회 뒤면 약관 보기 · 다시 동의하기다. 그 상태의 주 동작(동의하기 · 다시 켜기 · 다시 동의하기)만 남보라 글자다. 일시 중지 · 철회는 확인 시트를,
 * 동의하기 · 다시 동의는 약관 시트를 거친다 — 약관을 보이고 그 안의 「동의합니다」로만 기록한다(2026-10-20 노영주). 약관을 못 받으면 동의할 수 없다.
 * 동의한 약관 버전이 바뀌어 다시 동의해야 하면(needsReconsent — 동의 · 일시 중지일 때) 「다시 동의 필요」 배지와 약관 보기 · 다시 동의하기
 * (약관 시트의 「동의합니다」) · 동의 철회를 둔다 — 옛 동의로는 수집하지 않아 일시 중지가 뜻이 없고, 새 약관에 동의하지 않으려는 직원도
 * 거둘 수 있게(ATT-30 v252, 2026-10-29 재영 — 시안의 ⑤에는 동의 철회가 없지만 이 결정이라 남겼다). 출근 화면의 다시 동의 시트는 그대로다.
 */
export function LocationConsentCard({ consent, terms: current }: { consent: Schemas["MyLocationConsentDto"]; terms: CurrentTerms }) {
  const terms = current.status === "ok" ? current.terms : null;
  const [sheet, setSheet] = useState<LocationSheet>();
  const { pending, error, toast, change } = useConsentChange(() => setSheet(undefined));
  const { state, agreedAt, pausedAt, withdrawnAt, consentVersion } = consent;
  const reconsent = locationNeedsReconsent(consent);
  const version = consentVersion ? ` · 약관 ${consentVersion}` : "";

  // 일시 줄 — 시 · 분과 동의한 약관 버전. 다시 동의가 필요하면 지금 약관의 시행일(받지 못했으면 날짜 없이)이다.
  const line = reconsent
    ? `약관 변경${terms ? ` · ${dateLabel(terms.effectiveDate)}` : ""}`
    : state === "AGREED" && agreedAt
      ? `${kstDateTimeLabel(agreedAt)} 동의${version}`
      : state === "PAUSED" && pausedAt
        ? `${kstDateTimeLabel(pausedAt)} 일시 중지`
        : state === "WITHDRAWN" && withdrawnAt
          ? `${kstDateTimeLabel(withdrawnAt)} 동의 철회`
          : "";
  const termsButton = <TextAction onClick={() => setSheet("terms")}>약관 보기</TextAction>;
  const withdrawButton = <TextAction onClick={() => setSheet("withdraw")}>동의 철회</TextAction>;

  return (
    <>
      <ConsentCard
        title="출퇴근 위치정보 이용 동의"
        icon="pin"
        badge={reconsent ? { tone: "warning", text: "다시 동의 필요" } : LOCATION_BADGE[state]}
        line={line}
        error={error}
        actions={
          // 다시 동의하기 · 동의하기도 약관 시트를 거친다.
          reconsent ? (
            <>
              {termsButton}
              <TextAction primary onClick={() => setSheet("terms")}>
                다시 동의하기
              </TextAction>
              {withdrawButton}
            </>
          ) : state === "AGREED" ? (
            <>
              {termsButton}
              <TextAction onClick={() => setSheet("pause")}>일시 중지</TextAction>
              {withdrawButton}
            </>
          ) : state === "PAUSED" ? (
            <>
              {termsButton}
              <TextAction primary disabled={pending} onClick={() => change("location-resume")}>
                다시 켜기
              </TextAction>
              {withdrawButton}
            </>
          ) : (
            <>
              {termsButton}
              <TextAction primary onClick={() => setSheet("terms")}>
                {state === "WITHDRAWN" ? "다시 동의하기" : "동의하기"}
              </TextAction>
            </>
          )
        }
        note={
          reconsent
            ? // 일시 중지 중에 다시 동의해도 멈춘 채다(api 가 새 동의 행에 일시 중지를 옮긴다, ATT-26) — 시안 문구 뒤에 한 줄 더한다
              `위치정보 이용약관이 변경되었습니다.\n변경된 약관에 다시 동의해야 앱에서 출퇴근을 기록할 수 있습니다.${state === "PAUSED" ? "\n다시 동의해도 일시 중지는 그대로이며, 「다시 켜기」로 수집을 켤 수 있습니다." : ""}`
            : state === "AGREED"
              ? ""
              : state === "PAUSED"
                ? "일시 중지 중 출퇴근 기록은 근무지 관리자에게 문의해 주세요."
                : state === "WITHDRAWN"
                  ? "다시 동의하기 전 출퇴근 기록은 근무지 관리자에게 문의해 주세요."
                  : "출퇴근을 기록하려면 위치정보 이용 동의가 필요합니다. 동의 전 출퇴근 기록은 근무지 관리자에게 문의해 주세요."
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
            {/* 평소의 「약관 버전이 바뀌면 …」 안내는 뺐다 — 바뀌었을 때만 알린다(2026-11-20 사용자 지정) */}
            {reconsent && (
              <p className="text-[12px] text-staff-text-muted">약관이 바뀌었습니다. 이 버전에 다시 동의해야 앱으로 출퇴근을 등록할 수 있습니다.</p>
            )}
            {/* 동의는 약관을 보인 이 시트 안에서만 받는다(고지 후 동의, 2026-10-20 노영주). 읽었다는 값은 따로 두지 않는다 —
                api 가 동의한 약관 버전과 일시를 남긴다. */}
            {(state === "NOT_AGREED" || state === "WITHDRAWN" || reconsent) && (
              <Button
                disabled={pending}
                // 처음 동의는 CONSENT_CHANGES 문구, 철회 뒤 · 약관 변경 뒤는 「다시 동의했습니다」(데모 me). 일시 중지 중 새 약관 동의는
                // 멈춘 채다 — 「수집에 동의했습니다」로 켜진 것처럼 읽히지 않게
                onClick={() =>
                  change(
                    "location-agree",
                    terms.version,
                    reconsent && state === "PAUSED" ? "새 약관에 동의했습니다. 일시 중지는 그대로입니다" : state === "NOT_AGREED" ? undefined : LOCATION_REAGREED,
                  )
                }
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
      <BottomSheet open={sheet === "pause"} onClose={() => setSheet(undefined)} title="위치 수집을 일시 중지하시겠습니까?" closeLabel="취소">
        <p className="text-[14px] font-bold text-staff-text">
          일시 중지 중에는 앱으로 출퇴근을 등록할 수 없습니다.
          <br />
          출퇴근 기록은 근무지 관리자에게 문의해 주세요.
        </p>
        <Sunken>동의는 그대로 유지되어, 다시 켤 때 새로 동의하지 않아도 됩니다.</Sunken>
        <Button disabled={pending} onClick={() => change("location-pause")}>
          일시 중지
        </Button>
      </BottomSheet>

      {/* 동의 철회(ATT-23). 다시 등록하려면 새로 동의해야 한다. */}
      <BottomSheet open={sheet === "withdraw"} onClose={() => setSheet(undefined)} title="위치정보 동의를 철회하시겠습니까?" closeLabel="취소">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          철회하면 앱으로 출퇴근을 등록할 수 없습니다.
          <br />
          <strong>출퇴근 기록은 근무지 관리자에게 문의해 주세요.</strong>
        </p>
        <Sunken>
          다음 출퇴근 등록 때 다시 동의할 수 있습니다.
          <br />
          지금까지의 기록은 그대로 남습니다.
        </Sunken>
        <Button disabled={pending} onClick={() => change("location-withdraw")}>
          철회하기
        </Button>
      </BottomSheet>
    </>
  );
}

type HqSheet = "content" | "withdraw";

/**
 * 근무정보(사업자 · 본사) 제공 동의 묶음(ATT-30, 정돈 시안 ⑬ 상태별). 가맹 점포 소속이 있을 때만 보인다. 계정에 하나라 소속 가맹 점포 모두에
 * 같이 적용된다. 동의 중이면 내용 보기 · 동의 철회(확인 시트), 아니면 내용 보기 · 다시 동의하기(내용 시트 안의 「동의합니다」로 기록).
 * 옛 문구 버전에 동의해 다시 동의해야 하면(needsReconsent, api #183) 「다시 동의 필요」 · 다시 동의하기다 — 표시는 hqSharingView.
 */
export function HqSharingConsentCard({ consent }: { consent: Schemas["MyHqSharingConsentDto"] }) {
  const [sheet, setSheet] = useState<HqSheet>();
  const { pending, error, toast, change } = useConsentChange(() => setSheet(undefined));
  const view = hqSharingView(consent);
  const withdrawButton = <TextAction onClick={() => setSheet("withdraw")}>동의 철회</TextAction>;

  return (
    <>
      <ConsentCard
        // 화면 이름은 「근무정보 제공 동의」(정돈 시안 ⑬, 2026-11-20 사용자 확정 — 전엔 「사업자 제공 동의」). 버전에 묶인 동의 본문(HqSharingTermsBody)은 그대로다.
        title="근무정보 제공 동의"
        icon="store"
        badge={view.badge}
        line={view.line}
        error={error}
        actions={
          <>
            <TextAction onClick={() => setSheet("content")}>내용 보기</TextAction>
            {view.action.kind === "withdraw" ? (
              withdrawButton
            ) : (
              <TextAction primary onClick={() => setSheet("content")}>
                {view.action.label}
              </TextAction>
            )}
            {view.action.kind === "agree" && view.action.alsoWithdraw && withdrawButton}
          </>
        }
        note={view.note}
      />
      {toast && <Toast key={toast.key}>{toast.text}</Toast>}

      <BottomSheet open={sheet === "content"} onClose={() => setSheet(undefined)} title="근무정보 제공 동의">
        <HqSharingTermsBody />
        {view.action.kind === "agree" && view.action.alsoWithdraw && (
          <Alert tone="warning">
            <p>동의한 뒤 내용이 바뀌었습니다. 위 내용으로 다시 동의해야 가맹본부에 개인 단위로 보입니다 — 원하지 않으면 동의를 철회할 수 있습니다.</p>
          </Alert>
        )}
        <HqSharingTermsReviewNote />
        {/* 위치정보와 같이 내용을 보인 이 시트 안에서만 동의를 받는다. */}
        {view.action.kind === "agree" && (
          // 내 정보의 끝난 알림은 「동의를 완료했습니다」 — 홈 다시 동의 팝업이 같이 쓰는 CONSENT_CHANGES 문구는 그대로 둔다
          <Button disabled={pending} onClick={() => change("hq-sharing-agree", HQ_SHARING_TERMS_VERSION, "근무정보 제공 동의를 완료했습니다")}>
            동의합니다
          </Button>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "withdraw"} onClose={() => setSheet(undefined)} title="근무정보 제공 동의를 철회하시겠습니까?" closeLabel="취소">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          철회하면 가맹본부에는 내 근무 정보가
          <br />
          <strong>점포별 숫자로만 보입니다.</strong>
        </p>
        <Sunken>
          근무와 급여명세서에는 영향이 없습니다.
          <br />
          내 정보에서 언제든 다시 동의할 수 있습니다.
        </Sunken>
        <Button disabled={pending} onClick={() => change("hq-sharing-withdraw")}>
          철회하기
        </Button>
      </BottomSheet>
    </>
  );
}
