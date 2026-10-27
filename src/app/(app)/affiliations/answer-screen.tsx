"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Alert, Button, Card, CheckBox, Dock, MaskIcon, Notice, PageHeader, ReasonSheet } from "@/components/common";
import { Sunken, Values } from "@/app/_components/tax-profile-parts";
import { INITIAL_ANSWER_STATE, REJECT_REASON_MAX, employmentLine, type AffiliationRequest, type AnswerState } from "@/lib/affiliation-requests";
import { kstDateTimeLabel } from "@/lib/profile";

// 소속 추가 확인(WHALEERP-144). 기준: 데모 docs/demo/join 의 addsite · addsite-done · reject(시트).
// 수락하기 전에는 초대한 사업자 · 점포와 고용 형태만 보인다 — 기존 계정 정보와 직원 레코드 값은 api 가 주지 않는다.
// 데모와 다른 점: 점포 주소는 api 가 주지 않아 사업자 이름을 대신 둔다. 수락 완료의 「계약서 날인하러 가기」는 직원 앱 계약 화면(#146)이
// 아직 없어 홈으로 보내고 안내만 둔다(2026-10-27). 거절 확정은 근로계약서 거부와 같이 오류색 버튼이다.

const subscribeNothing = () => () => {};

const BODY = "flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] leading-[1.5]";

/** 화면 첫 제목 + 설명(데모 lead). 결과 화면은 같은 주소에서 바뀌어 붙을 때 제목에 초점을 옮긴다. */
function Lead({ title, focus = false, children }: { title: string; focus?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  return (
    <div className="flex flex-col gap-[6px]">
      <h2 ref={ref} tabIndex={-1} className="text-[22px] font-bold outline-none">
        {title}
      </h2>
      <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{children}</p>
    </div>
  );
}

/** 카드 안 한 줄(데모 iconRow): 20px 칸의 아이콘 · 제목 14px semibold · 설명 12px. */
function IconRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-[12px] py-[8px] first:pt-0 last:pb-0">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold break-keep">{title}</p>
        <p className="text-[12px] text-staff-text-sub">{sub}</p>
      </div>
    </div>
  );
}

/** 요청 id 를 묶은 서버 액션 — 하이드레이션 전 제출도 POST 로 닿게 서버 화면이 bind 해 넘긴다(신고 정보 고치기와 같다). */
type AnswerAction = (previous: AnswerState, formData: FormData) => Promise<AnswerState>;

export function AnswerScreen({
  request,
  acceptAction: accept,
  rejectAction: reject,
  backHref,
  hasOthers,
}: {
  request: AffiliationRequest;
  acceptAction: AnswerAction;
  rejectAction: AnswerAction;
  backHref: string;
  /** 이 요청 말고도 답할 요청이 있는지 — 결과 화면에서 목록으로 돌아가는 버튼을 둔다. */
  hasOthers: boolean;
}) {
  const [accepted, acceptAction, accepting] = useActionState(accept, INITIAL_ANSWER_STATE);
  const [rejected, rejectAction, rejecting] = useActionState(reject, INITIAL_ANSWER_STATE);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [hqSharing, setHqSharing] = useState(false);
  // 동의 칸은 상태로 들고 켰을 때만 숨은 칸으로 싣는다(CheckBox). 하이드레이션 전에 체크하고 수락하면 동의가 빠지므로, 동의를 묻는
  // 요청은 하이드레이션 전에는 수락을 막는다(서버 그림은 막힌 버튼이다).
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);

  // 답이 끝났거나 더 답할 수 없는 요청이면 결과 화면이다. 거절 시트가 연 채 끝나도 화면이 바뀌며 시트는 사라진다.
  const done = [accepted, rejected].find((state) => state.step !== "input");
  if (done) return <Result state={done} hasOthers={hasOthers} />;

  const pending = accepting || rejecting;
  // 이 점포에 이미 재직 중(409) — 수락은 막고 거절로 닫게 한다.
  const acceptBlocked = accepted.step === "input" && accepted.acceptBlocked === true;
  const returning = request.invitationType === "RETURN_CONFIRM";
  return (
    <>
      <PageHeader title="소속 추가 확인" backHref={backHref} />
      <form action={acceptAction} className="flex flex-1 flex-col">
        <div className={BODY}>
          <Lead title={returning ? "다시 함께 일하자는 요청" : "새 소속 추가 요청"}>
            <strong>{request.storeName}</strong>
            {returning ? "에서 다시 함께 일해 달라고 요청했습니다." : "에서 함께 일해 달라고 요청했습니다."}
          </Lead>
          <Card>
            <div className="flex flex-col divide-y divide-staff-border-light">
              <IconRow icon="/icons/store-small.svg" title={request.storeName} sub={`사업자 · ${request.bpName}`} />
              <IconRow icon="/icons/contract.svg" title="고용 형태" sub={employmentLine(request)} />
            </div>
          </Card>
          <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
            수락하면 <strong>이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부만</strong> 새 소속에 복사됩니다. 다른 소속의 계약 · 급여 ·
            출퇴근 기록은 넘어가지 않습니다.
          </Notice>
          <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
            <strong>여기서 수락하는 것은 소속 연결까지입니다.</strong> 시급 · 근무 시간대를 포함한 근무 조건은 수락한 뒤 도착하는
            근로계약서에서 확인하고 날인합니다.
          </Notice>
          {/* 가맹 점포이고 아직 동의하지 않았을 때만(ATT-30). 계정 등록의 동의 칸과 같다. */}
          {request.asksHqSharingConsent && (
            <div className="flex flex-col gap-[4px]">
              <CheckBox name="hqSharingConsented" checked={hqSharing} onChange={setHqSharing}>
                본사 제공 동의 (선택)
              </CheckBox>
              <p className="text-[12px] text-staff-text-muted">
                가맹본부가 내 근무 정보(근로계약 · 근무스케줄 · 출퇴근 기록 · 급여명세서)를 개인 단위로 보는 것에 동의합니다. 동의하지 않아도
                소속 추가와 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. 내 정보에서 언제든 철회할 수 있습니다.
              </p>
            </div>
          )}
          <p className="text-[12px] text-staff-text-muted">
            이 요청은 {kstDateTimeLabel(request.expiresAt)}까지 답할 수 있습니다. 거절해도 기존 소속과 계정에는 영향이 없습니다.
          </p>
          {accepted.step === "input" && accepted.error && <Alert tone={acceptBlocked ? "warning" : "danger"}>{accepted.error}</Alert>}
        </div>
        <Dock>
          <div className="grid grid-cols-2 gap-[8px]">
            <Button variant="ghost" disabled={pending} onClick={() => setRejectOpen(true)}>
              거절
            </Button>
            <Button type="submit" disabled={pending || acceptBlocked || (request.asksHqSharingConsent && !hydrated)}>
              수락
            </Button>
          </div>
        </Dock>
      </form>
      {/* 시트 안에 거절 폼이 있어 수락 폼 밖에 둔다(폼 안의 폼은 안 된다). */}
      <ReasonSheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="소속 추가를 거절하시겠어요?"
        description="거절해도 기존 소속과 계정에는 영향이 없습니다. 이 요청과 함께 온 근로계약서는 거부로 닫힙니다."
        label="거절 사유"
        placeholder="예: 다른 곳에서 일하고 있어요"
        help="사유를 남기면 점포 관리자가 참고합니다."
        maxLength={REJECT_REASON_MAX}
        confirmLabel="거절하기"
        action={rejectAction}
        pending={pending}
        error={rejected.step === "input" ? rejected.error : undefined}
      />
    </>
  );
}

/** 답한 뒤 · 더 답할 수 없을 때의 화면. 머리줄은 홈으로 간다 — 답한 요청은 목록에서 빠져 확인 화면으로 돌아갈 곳이 없다. */
function Result({ state, hasOthers }: { state: Exclude<AnswerState, { step: "input" }>; hasOthers: boolean }) {
  if (state.step === "accepted")
    return (
      <>
        <PageHeader title="소속 추가 완료" backHref="/home" />
        <div className={`${BODY} text-center`}>
          <Lead focus title={`${state.storeName} 소속이 추가되었습니다`}>
            기존 계정은 그대로이고, 계정의 이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부만 이 근무지의 새 직원 레코드에 이어졌습니다.
          </Lead>
          <Sunken>
            <Values
              flush
              rows={[
                ["넘어간 것", "이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부"],
                ["넘어가지 않은 것", "계약 · 급여 · 출퇴근"],
              ]}
            />
          </Sunken>
          <div className="text-left">
            {/* 날인 화면(#146)이 생기면 이 안내 대신 「계약서 날인하러 가기」로 그 계약(contractIds)에 보낸다. */}
            <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
              {state.contractCount > 0 ? (
                <>
                  이 소속의 <strong>근로계약서가 발송되었습니다.</strong> 날인해야 근무가 시작됩니다. 날인 기한은 오늘부터 30일입니다.
                </>
              ) : (
                <>근로계약서가 도착하면 알림으로 알려 드립니다. 날인해야 근무가 시작됩니다.</>
              )}
            </Notice>
          </div>
        </div>
        <Dock>
          {hasOthers && <Button href="/affiliations">다른 요청 보기</Button>}
          <Button variant={hasOthers ? "ghost" : "primary"} href="/home">
            홈으로
          </Button>
        </Dock>
      </>
    );

  const { title, message } =
    state.step === "rejected"
      ? { title: "소속 추가를 거절했습니다", message: "기존 소속과 계정은 그대로입니다. 함께 온 근로계약서는 거부로 닫혔습니다." }
      : state;
  return (
    <>
      <PageHeader title="소속 추가 확인" backHref="/home" />
      <div className={BODY}>
        <Lead focus title={title}>
          {message}
        </Lead>
      </div>
      <Dock>
        {hasOthers && <Button href="/affiliations">다른 요청 보기</Button>}
        <Button variant={hasOthers ? "ghost" : "primary"} href="/home">
          홈으로
        </Button>
      </Dock>
    </>
  );
}
